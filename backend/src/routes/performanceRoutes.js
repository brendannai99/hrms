const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { addAuditLog } = require("../utils/auditLogger");

const router = express.Router();

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

// ==========================================
// REVIEW PERIODS (ADMIN ONLY)
// ==========================================

// Create a new review period
router.post("/periods", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { period_name } = req.body;

    if (!period_name) {
        return res.status(400).json({ error: "period_name is required" });
    }

    try {
        const result = await dbQuery(
            "INSERT INTO review_periods (period_name, created_by) VALUES (?, ?)",
            [period_name, req.user.id]
        );

        await addAuditLog(req.user.id, "REVIEW_PERIOD_CREATED", "review_period", result.insertId, { period_name }).catch(() => {});
        res.status(201).json({ message: "Review period created successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Failed to create review period." });
    }
});

// Open or close a review period
router.put("/periods/:id/toggle", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const periodId = req.params.id;
    const { is_open } = req.body;

    if (is_open === undefined) {
        return res.status(400).json({ error: "is_open boolean is required" });
    }

    try {
        await dbQuery("UPDATE review_periods SET is_open = ? WHERE id = ?", [is_open ? 1 : 0, periodId]);
        
        await addAuditLog(req.user.id, "REVIEW_PERIOD_TOGGLED", "review_period", periodId, { is_open }).catch(() => {});
        res.json({ message: `Review period ${is_open ? 'opened' : 'closed'} successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update review period." });
    }
});

// Get all review periods (Everyone can see periods to know if one is active)
router.get("/periods", authMiddleware, async (req, res) => {
    try {
        const periods = await dbQuery("SELECT * FROM review_periods ORDER BY created_at DESC");
        res.json(periods);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch review periods." });
    }
});


// ==========================================
// PERFORMANCE RATINGS
// ==========================================

// Submit a rating (Managers/Admins only)
router.post("/ratings", authMiddleware, roleMiddleware("manager", "admin"), async (req, res) => {
    const { employee_id, review_period_id, rating, comments } = req.body;
    const reviewerId = req.user.id;

    if (!employee_id || !review_period_id || !rating || !comments) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    try {
        // 1. Check if the period is actually open
        const period = await dbQuery("SELECT is_open FROM review_periods WHERE id = ?", [review_period_id]);
        if (period.length === 0 || period[0].is_open === 0) {
            return res.status(400).json({ error: "This review period is closed or does not exist." });
        }

        // 2. Security Check: Ensure the reviewer is actually this employee's manager
        const employee = await dbQuery("SELECT manager_id FROM employees WHERE id = ?", [employee_id]);
        if (employee.length === 0) {
            return res.status(404).json({ error: "Employee not found." });
        }
        
        if (Number(employee[0].manager_id) !== Number(reviewerId) && req.user.role !== "admin") {
            return res.status(403).json({ error: "You can only rate your direct reports." });
        }

        // 3. Insert Rating (The database UNIQUE constraint will throw an error if one already exists)
        const result = await dbQuery(
            "INSERT INTO performance_ratings (employee_id, reviewer_id, review_period_id, rating, comments) VALUES (?, ?, ?, ?, ?)",
            [employee_id, reviewerId, review_period_id, rating, comments]
        );

        await addAuditLog(reviewerId, "RATING_SUBMITTED", "performance_rating", result.insertId, { employee_id, rating }).catch(() => {});
        res.status(201).json({ message: "Performance review submitted successfully." });

    } catch (error) {
        // Handle the duplicate rating database error gracefully
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "This employee has already been rated for this review period." });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to submit rating." });
    }
});

// View own ratings (Employees)
router.get("/ratings/me", authMiddleware, async (req, res) => {
    try {
        const ratings = await dbQuery(`
            SELECT pr.*, rp.period_name, rev.name as reviewer_name 
            FROM performance_ratings pr
            JOIN review_periods rp ON pr.review_period_id = rp.id
            JOIN employees rev ON pr.reviewer_id = rev.id
            WHERE pr.employee_id = ?
            ORDER BY pr.created_at DESC
        `, [req.user.id]);
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch your ratings." });
    }
});

// View ratings of direct reports (Managers)
router.get("/ratings/team", authMiddleware, roleMiddleware("manager", "admin"), async (req, res) => {
    try {
        const ratings = await dbQuery(`
            SELECT pr.*, rp.period_name, emp.name as employee_name, emp.email as employee_email
            FROM performance_ratings pr
            JOIN review_periods rp ON pr.review_period_id = rp.id
            JOIN employees emp ON pr.employee_id = emp.id
            WHERE pr.reviewer_id = ?
            ORDER BY pr.created_at DESC
        `, [req.user.id]);
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch team ratings." });
    }
});

module.exports = router;