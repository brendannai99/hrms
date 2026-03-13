const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const validRoles = ["employee", "manager", "admin"];

router.get("/", authMiddleware, roleMiddleware("admin"), (req, res) => {
    db.all(
        "SELECT id, name, email, role, department, manager_id, created_at FROM employees",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch employees" });
            }

            res.json(rows);
        }
    );
});

router.get("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    if (req.user.role !== "admin" && req.user.id !== Number(id)) {
        return res.status(403).json({ error: "Access denied" });
    }

    db.get(
        "SELECT id, name, email, role, department, manager_id, created_at FROM employees WHERE id = ?",
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch employee" });
            }

            if (!row) {
                return res.status(404).json({ error: "Employee not found" });
            }

            res.json(row);
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
      INSERT INTO employees (name, email, password, role, department, manager_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        db.run(
            sql,
            [name, email, hashedPassword, role, department || null, manager_id || null],
            function (err) {
                if (err) {
                    if (err.message.includes("UNIQUE")) {
                        return res.status(400).json({ error: "Email already exists" });
                    }

                    return res.status(500).json({ error: "Failed to create employee" });
                }

                res.status(201).json({
                    message: "Employee created successfully",
                    id: this.lastID
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

    db.run(
        `
      UPDATE employees
      SET name = ?, email = ?, department = ?, role = ?, manager_id = ?
      WHERE id = ?
    `,
        [name, email, department || null, role, manager_id || null, id],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({ error: "Email already exists" });
                }

                return res.status(500).json({ error: "Failed to update employee" });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "Employee not found" });
            }

            res.json({ message: "Employee updated successfully" });
        }
    );
});

module.exports = router;