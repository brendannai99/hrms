const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

function formatDateOnly(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function calculateLeaveDays(startDate, endDate, halfDay, holidaySet) {
    const dates = getDatesInRange(startDate, endDate);

    let workingDays = dates.filter((date) => {
        const dateStr = formatDateOnly(date);
        return !isWeekend(date) && !holidaySet.has(dateStr);
    }).length;

    if (workingDays === 0) {
        return 0;
    }

    if (halfDay !== "none") {
        const sameDay = formatDateOnly(startDate) === formatDateOnly(endDate);
        if (!sameDay) {
            return -1;
        }
        return 0.5;
    }

    return workingDays;
}

async function getOrCreateLeaveBalance(employeeId, year) {
    const existing = await dbQuery(
        "SELECT * FROM leave_balances WHERE employee_id = ? AND year = ?",
        [employeeId, year]
    );

    if (existing.length > 0) {
        return existing[0];
    }

    await dbQuery(
        `INSERT INTO leave_balances (employee_id, year, annual_quota, annual_used, annual_remaining)
         VALUES (?, ?, 14.0, 0.0, 14.0)`,
        [employeeId, year]
    );

    const created = await dbQuery(
        "SELECT * FROM leave_balances WHERE employee_id = ? AND year = ?",
        [employeeId, year]
    );

    return created[0];
}

// Employee applies leave
router.post("/apply", authMiddleware, async (req, res) => {
    const { leave_type, start_date, end_date, reason, half_day = "none" } = req.body;
    const employeeId = req.user.id;

    if (!["annual", "sick"].includes(leave_type)) {
        return res.status(400).json({ error: "Invalid leave type" });
    }

    if (!start_date || !end_date) {
        return res.status(400).json({ error: "Start date and end date are required" });
    }

    if (!["none", "AM", "PM"].includes(half_day)) {
        return res.status(400).json({ error: "Invalid half-day selection" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
        return res.status(400).json({ error: "End date cannot be before start date" });
    }

    if (startDate < startOfToday()) {
        return res.status(400).json({ error: "Employees cannot apply for leave in the past" });
    }

    try {
        const overlapping = await dbQuery(
            `SELECT id FROM leave_requests
             WHERE employee_id = ?
               AND status IN ('pending', 'approved')
               AND start_date <= ?
               AND end_date >= ?`,
            [employeeId, formatDateOnly(endDate), formatDateOnly(startDate)]
        );

        if (overlapping.length > 0) {
            return res.status(400).json({
                error: "You already have a leave request on the selected date(s)."
            });
        }

        const holidays = await dbQuery(
            `SELECT holiday_date FROM public_holidays
             WHERE holiday_date BETWEEN ? AND ?`,
            [formatDateOnly(startDate), formatDateOnly(endDate)]
        );

        const holidaySet = new Set(
            holidays.map((h) => {
                if (typeof h.holiday_date === "string") {
                    return h.holiday_date.slice(0, 10);
                }
                return formatDateOnly(new Date(h.holiday_date));
            })
        );

        const daysRequested = calculateLeaveDays(startDate, endDate, half_day, holidaySet);

        if (daysRequested === -1) {
            return res.status(400).json({
                error: "Half-day leave only supports a single-day selection."
            });
        }

        if (daysRequested <= 0) {
            return res.status(400).json({
                error: "Selected date falls on a weekend or public holiday. Please choose a working day."
            });
        }

        if (leave_type === "annual") {
            const year = startDate.getFullYear();
            const balance = await getOrCreateLeaveBalance(employeeId, year);

            if (Number(balance.annual_remaining) < Number(daysRequested)) {
                return res.status(400).json({
                    error: `Insufficient annual leave balance. Remaining: ${balance.annual_remaining} day(s)`
                });
            }
        }

        await dbQuery(
            `INSERT INTO leave_requests
             (employee_id, leave_type, start_date, end_date, half_day, days_requested, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                employeeId,
                leave_type,
                formatDateOnly(startDate),
                formatDateOnly(endDate),
                half_day,
                daysRequested,
                reason || null
            ]
        );

        res.status(201).json({ message: "Leave application submitted successfully." });
    } catch (error) {
        console.error("APPLY LEAVE ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to apply leave" });
    }
});

router.get("/my", authMiddleware, async (req, res) => {
    try {
        const rows = await dbQuery(
            `SELECT 
                lr.id,
                lr.employee_id,
                lr.leave_type,
                DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date,
                lr.half_day,
                lr.days_requested,
                lr.reason,
                lr.status,
                lr.approved_by,
                lr.approved_at,
                lr.rejection_reason,
                lr.created_at,
                lr.updated_at,
                e.name AS employee_name
             FROM leave_requests lr
             JOIN employees e ON e.id = lr.employee_id
             WHERE lr.employee_id = ?
             ORDER BY lr.created_at DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leave history" });
    }
});

// Current employee annual leave balance
router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const balance = await getOrCreateLeaveBalance(req.user.id, year);
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leave balance" });
    }
});

// Managers/admins view pending requests
router.get("/pending", authMiddleware, async (req, res) => {
    try {
        if (!["manager", "admin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        let sql = "";
        let params = [];

        if (req.user.role === "admin") {
            sql = `
                SELECT
                    lr.id,
                    lr.employee_id,
                    lr.leave_type,
                    DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date,
                    DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date,
                    lr.half_day,
                    lr.days_requested,
                    lr.reason,
                    lr.status,
                    lr.approved_by,
                    lr.approved_at,
                    lr.rejection_reason,
                    lr.created_at,
                    lr.updated_at,
                    e.name AS employee_name,
                    e.department,
                    e.manager_id
                FROM leave_requests lr
                JOIN employees e ON e.id = lr.employee_id
                WHERE lr.status = 'pending'
                ORDER BY lr.created_at DESC
            `;
        } else {
            sql = `
                SELECT
                    lr.id,
                    lr.employee_id,
                    lr.leave_type,
                    DATE_FORMAT(lr.start_date, '%Y-%m-%d') AS start_date,
                    DATE_FORMAT(lr.end_date, '%Y-%m-%d') AS end_date,
                    lr.half_day,
                    lr.days_requested,
                    lr.reason,
                    lr.status,
                    lr.approved_by,
                    lr.approved_at,
                    lr.rejection_reason,
                    lr.created_at,
                    lr.updated_at,
                    e.name AS employee_name,
                    e.department,
                    e.manager_id
                FROM leave_requests lr
                JOIN employees e ON e.id = lr.employee_id
                WHERE lr.status = 'pending' AND e.manager_id = ?
                ORDER BY lr.created_at DESC
            `;
            params = [req.user.id];
        }

        const rows = await dbQuery(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending leave requests" });
    }
});

// Manager/admin approves or rejects leave
router.put("/:id/status", authMiddleware, async (req, res) => {
    const leaveId = Number(req.params.id);
    const { status, rejection_reason } = req.body;

    if (!["manager", "admin"].includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be approved or rejected" });
    }

    try {
        const rows = await dbQuery(
            `SELECT lr.*, e.manager_id
             FROM leave_requests lr
             JOIN employees e ON e.id = lr.employee_id
             WHERE lr.id = ?`,
            [leaveId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Leave request not found" });
        }

        const leave = rows[0];

        if (leave.status !== "pending") {
            return res.status(400).json({ error: "Only pending requests can be updated" });
        }

        if (req.user.role === "manager" && Number(leave.manager_id) !== Number(req.user.id)) {
            return res.status(403).json({ error: "Managers can only approve direct reports" });
        }

        if (status === "approved" && leave.leave_type === "annual") {
            const year = new Date(leave.start_date).getFullYear();
            const balance = await getOrCreateLeaveBalance(leave.employee_id, year);

            if (Number(balance.annual_remaining) < Number(leave.days_requested)) {
                return res.status(400).json({ error: "Employee has insufficient annual leave balance" });
            }

            await dbQuery(
                `UPDATE leave_balances
                 SET annual_used = annual_used + ?,
                     annual_remaining = annual_remaining - ?
                 WHERE employee_id = ? AND year = ?`,
                [leave.days_requested, leave.days_requested, leave.employee_id, year]
            );
        }

        await dbQuery(
            `UPDATE leave_requests
             SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?
             WHERE id = ?`,
            [
                status,
                req.user.id,
                status === "rejected" ? (rejection_reason || null) : null,
                leaveId
            ]
        );

        res.json({ message: `Leave request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ error: "Failed to update leave request" });
    }
});

// Admin manages public holidays
router.get("/holidays", authMiddleware, async (req, res) => {
    try {
        const rows = await dbQuery(
            "SELECT id, DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date, name FROM public_holidays ORDER BY holiday_date ASC"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch public holidays" });
    }
});

router.post("/holidays", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
    }

    const { holiday_date, name } = req.body;

    if (!holiday_date || !name) {
        return res.status(400).json({ error: "Holiday date and name are required" });
    }

    try {
        await dbQuery(
            "INSERT INTO public_holidays (holiday_date, name) VALUES (?, ?)",
            [holiday_date, name]
        );
        res.status(201).json({ message: "Public holiday added successfully" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Holiday date already exists" });
        }
        res.status(500).json({ error: "Failed to add public holiday" });
    }
});

router.put("/holidays/:id", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
    }

    const { holiday_date, name } = req.body;

    if (!holiday_date || !name) {
        return res.status(400).json({ error: "Holiday date and name are required" });
    }

    try {
        const result = await dbQuery(
            "UPDATE public_holidays SET holiday_date = ?, name = ? WHERE id = ?",
            [holiday_date, name, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }

        res.json({ message: "Public holiday updated successfully" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Holiday date already exists" });
        }
        res.status(500).json({ error: "Failed to update holiday" });
    }
});

router.delete("/holidays/:id", authMiddleware, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        const result = await dbQuery(
            "DELETE FROM public_holidays WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }

        res.json({ message: "Public holiday deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete holiday" });
    }
});

module.exports = router;