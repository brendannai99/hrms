const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    addAuditLog
} = require("../utils/auditLogger");

const router = express.Router();

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function createsCycle(employeeId, newManagerId) {
    // A person cannot manage themselves
    if (Number(employeeId) === Number(newManagerId)) return true;

    let currentManagerId = newManagerId;

    while (currentManagerId) {
        const result = await dbQuery("SELECT manager_id FROM employees WHERE id = ?", [currentManagerId]);

        // Reached the top of the chain (CEO/Admin with no manager)
        if (result.length === 0 || !result[0].manager_id) break;

        const nextManagerId = result[0].manager_id;

        // If the chain loops back to our target employee, we have a cycle: A -> B -> A
        if (Number(nextManagerId) === Number(employeeId)) {
            return true;
        }

        currentManagerId = nextManagerId;
    }

    return false;
}

router.put("/reassign", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const {
        employee_id,
        new_manager_id
    } = req.body;

    if (!employee_id) {
        return res.status(400).json({
            error: "employee_id is required"
        });
    }

    try {
        // 1. Run Cycle Detection (Only if a new manager is actually being assigned)
        if (new_manager_id) {
            const hasCycle = await createsCycle(employee_id, new_manager_id);
            if (hasCycle) {
                return res.status(400).json({
                    error: "Circular dependency detected. This change would create an infinite reporting loop."
                });
            }
        }

        // 2. Close out the existing reporting history (Challenge #2)
        await dbQuery(
            "UPDATE reporting_history SET end_date = CURRENT_DATE() WHERE employee_id = ? AND end_date IS NULL",
            [employee_id]
        );

        // 3. Insert new history record
        if (new_manager_id) {
            await dbQuery(
                "INSERT INTO reporting_history (employee_id, manager_id, start_date) VALUES (?, ?, CURRENT_DATE())",
                [employee_id, new_manager_id]
            );
        }

        // 4. Update the actual employees table so the rest of the app sees the change
        await dbQuery(
            "UPDATE employees SET manager_id = ? WHERE id = ?",
            [new_manager_id || null, employee_id]
        );

        // 5. Audit the action using your team's existing logger
        await addAuditLog(req.user.id, "MANAGER_REASSIGNED", "employee", employee_id, {
            new_manager_id: new_manager_id || null
        }).catch(() => {});

        res.json({
            message: "Manager reassigned successfully and history preserved."
        });

    } catch (error) {
        console.error("Reassignment Error:", error);
        res.status(500).json({
            error: "Server error during reassignment."
        });
    }
});

router.get("/tree", authMiddleware, async (req, res) => {
    try {
        const employees = await dbQuery("SELECT id, name, email, role, department, manager_id FROM employees");
        res.json(employees);
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch org chart data."
        });
    }
});

module.exports = router;