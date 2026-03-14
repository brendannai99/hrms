const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { addAuditLog } = require("../utils/auditLogger");

const validRoles = ["employee", "manager", "admin"];

router.get("/", authMiddleware, roleMiddleware("admin"), (req, res) => {
    db.query(
        `SELECT id, name, email, role, department, manager_id, created_at,
                must_change_password, failed_login_attempts, locked_until
         FROM employees`,
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch employees" });
            }

            rows.forEach((row) => {
                row.must_change_password = !!row.must_change_password;
            });

            res.json(rows);
        }
    );
});

router.get("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user.id !== Number(id)) {
        return res.status(403).json({ error: "Access denied" });
    }

    db.query(
        `SELECT id, name, email, role, department, manager_id, created_at,
                must_change_password, failed_login_attempts, locked_until
         FROM employees
         WHERE id = ?`,
        [id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch employee" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            rows[0].must_change_password = !!rows[0].must_change_password;
            res.json(rows[0]);
        }
    );
});

router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { name, email, password, role, department, manager_id } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Name, email, password and role are required" });
    }

    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO employees (name, email, password, role, department, manager_id, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        db.query(
            sql,
            [name, email, hashedPassword, role, department || null, manager_id || null],
            async (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ error: "Email already exists" });
                    }

                    return res.status(500).json({ error: "Failed to create employee" });
                }

                await addAuditLog(req.user.id, "EMPLOYEE_CREATED", "employee", result.insertId, {
                    email,
                    role,
                    department: department || null
                }).catch(() => { });

                res.status(201).json({
                    message: "Employee created successfully",
                    id: result.insertId
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/:id", authMiddleware, roleMiddleware("admin"), (req, res) => {
    const { id } = req.params;
    const { name, email, department, role, manager_id } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ error: "Name, email and role are required" });
    }

    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    db.query(
        `
            UPDATE employees
            SET name = ?, email = ?, department = ?, role = ?, manager_id = ?
            WHERE id = ?
        `,
        [name, email, department || null, role, manager_id || null, id],
        async (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ error: "Email already exists" });
                }

                return res.status(500).json({ error: "Failed to update employee" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            await addAuditLog(req.user.id, "EMPLOYEE_UPDATED", "employee", Number(id), {
                name,
                email,
                role,
                department: department || null,
                manager_id: manager_id || null
            }).catch(() => { });

            res.json({ message: "Employee updated successfully" });
        }
    );
});

router.put("/:id/unlock", authMiddleware, roleMiddleware("admin"), (req, res) => {
    const { id } = req.params;

    db.query(
        "UPDATE employees SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
        [id],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ error: "Failed to unlock employee account" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            await addAuditLog(req.user.id, "ACCOUNT_UNLOCKED", "employee", Number(id), {
                unlockedByAdminId: req.user.id
            }).catch(() => { });

            res.json({ message: "Employee account unlocked successfully" });
        }
    );
});

module.exports = router;