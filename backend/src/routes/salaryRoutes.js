const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

async function addAuditLog(actorEmployeeId, action, targetType, targetId, details = null) {
    await dbRun(
        `INSERT INTO audit_logs (actor_employee_id, action, target_type, target_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [actorEmployeeId || null, action, targetType, targetId || null, details ? JSON.stringify(details) : null]
    );
}

function isValidMonth(value) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getActiveSalaryRecord(employeeId, payrollMonth = null) {
    if (!payrollMonth) {
        return dbGet(
            `SELECT sr.*
             FROM salary_records sr
             WHERE sr.employee_id = ?
             ORDER BY sr.effective_date DESC, sr.id DESC
             LIMIT 1`,
            [employeeId]
        );
    }

    return dbGet(
        `SELECT sr.*
         FROM salary_records sr
         WHERE sr.employee_id = ?
           AND sr.effective_date <= ?
         ORDER BY sr.effective_date DESC, sr.id DESC
         LIMIT 1`,
        [employeeId, `${payrollMonth}-31`]
    );
}

router.get("/my-salary", authMiddleware, async (req, res) => {
    try {
        const record = await getActiveSalaryRecord(req.user.id);
        await addAuditLog(req.user.id, "VIEW_OWN_SALARY", "salary_record", record?.id || null, {
            employeeId: req.user.id
        });
        res.json(record || null);
    } catch {
        res.status(500).json({ error: "Failed to fetch salary" });
    }
});

router.get("/salary-records", authMiddleware, async (req, res) => {
    try {
        if (req.user.role === "admin") {
            const rows = await dbAll(
                `SELECT e.id AS employee_id, e.name, e.email, e.department,
                        sr.id AS salary_record_id, sr.base_salary, sr.effective_date, sr.created_at,
                        creator.name AS updated_by
                 FROM employees e
                 LEFT JOIN salary_records sr
                   ON sr.id = (
                        SELECT sr2.id
                        FROM salary_records sr2
                        WHERE sr2.employee_id = e.id
                        ORDER BY sr2.effective_date DESC, sr2.id DESC
                        LIMIT 1
                   )
                 LEFT JOIN employees creator ON creator.id = sr.created_by
                 ORDER BY e.name ASC`
            );
            await addAuditLog(req.user.id, "VIEW_ALL_SALARY_RECORDS", "salary_record", null, { scope: "all" });
            return res.json(rows);
        }

        const own = await getActiveSalaryRecord(req.user.id);
        await addAuditLog(req.user.id, "VIEW_OWN_SALARY", "salary_record", own?.id || null, {
            employeeId: req.user.id
        });
        return res.json(own ? [own] : []);
    } catch {
        return res.status(500).json({ error: "Failed to fetch salary records" });
    }
});

router.get("/salary-records/history/:employeeId", authMiddleware, async (req, res) => {
    const employeeId = Number(req.params.employeeId);

    if (req.user.role !== "admin" && req.user.id !== employeeId) {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        const rows = await dbAll(
            `SELECT sr.id, sr.employee_id, sr.base_salary, sr.effective_date, sr.created_at,
                    creator.name AS updated_by
             FROM salary_records sr
             LEFT JOIN employees creator ON creator.id = sr.created_by
             WHERE sr.employee_id = ?
             ORDER BY sr.effective_date DESC, sr.id DESC`,
            [employeeId]
        );

        await addAuditLog(
            req.user.id,
            req.user.role === "admin" ? "VIEW_EMPLOYEE_SALARY_HISTORY" : "VIEW_OWN_SALARY_HISTORY",
            "salary_record",
            employeeId,
            { employeeId }
        );

        res.json(rows);
    } catch {
        res.status(500).json({ error: "Failed to fetch salary history" });
    }
});

router.post("/salary-records", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { employee_id, base_salary, effective_date } = req.body;

    if (!employee_id || base_salary === undefined || !effective_date) {
        return res.status(400).json({ error: "employee_id, base_salary and effective_date are required" });
    }

    if (!isValidDate(effective_date)) {
        return res.status(400).json({ error: "effective_date must be in YYYY-MM-DD format" });
    }

    const parsedSalary = Number(base_salary);
    if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({ error: "base_salary must be a valid non-negative number" });
    }

    try {
        const employee = await dbGet("SELECT id FROM employees WHERE id = ?", [employee_id]);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const result = await dbRun(
            `INSERT INTO salary_records (employee_id, base_salary, effective_date, created_by)
             VALUES (?, ?, ?, ?)`,
            [employee_id, parsedSalary, effective_date, req.user.id]
        );

        await addAuditLog(req.user.id, "UPDATE_SALARY", "salary_record", result.lastID, {
            employeeId: Number(employee_id),
            baseSalary: parsedSalary,
            effectiveDate: effective_date
        });

        res.status(201).json({ message: "Salary record created successfully", id: result.lastID });
    } catch {
        res.status(500).json({ error: "Failed to create salary record" });
    }
});

router.get("/payroll-records", authMiddleware, async (req, res) => {
    try {
        let rows;
        if (req.user.role === "admin") {
            rows = await dbAll(
                `SELECT pr.*, e.name AS employee_name, e.email AS employee_email,
                        issuer.name AS issued_by_name
                 FROM payroll_records pr
                 JOIN employees e ON e.id = pr.employee_id
                 LEFT JOIN employees issuer ON issuer.id = pr.issued_by
                 ORDER BY pr.payroll_month DESC, e.name ASC, pr.issued_at DESC`
            );
            await addAuditLog(req.user.id, "VIEW_ALL_PAYROLL_RECORDS", "payroll_record", null, { scope: "all" });
        } else {
            rows = await dbAll(
                `SELECT pr.*, e.name AS employee_name, e.email AS employee_email,
                        issuer.name AS issued_by_name
                 FROM payroll_records pr
                 JOIN employees e ON e.id = pr.employee_id
                 LEFT JOIN employees issuer ON issuer.id = pr.issued_by
                 WHERE pr.employee_id = ?
                 ORDER BY pr.payroll_month DESC, pr.issued_at DESC`,
                [req.user.id]
            );
            await addAuditLog(req.user.id, "VIEW_OWN_PAYROLL_HISTORY", "payroll_record", null, {
                employeeId: req.user.id
            });
        }

        res.json(rows);
    } catch {
        res.status(500).json({ error: "Failed to fetch payroll records" });
    }
});

router.post("/payroll-records/issue", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { payroll_month, employee_id, deduction_amount = 0, remarks = null } = req.body;

    if (!payroll_month || !employee_id) {
        return res.status(400).json({ error: "payroll_month and employee_id are required" });
    }

    if (!isValidMonth(payroll_month)) {
        return res.status(400).json({ error: "payroll_month must be in YYYY-MM format" });
    }

    const parsedDeduction = Number(deduction_amount || 0);
    if (Number.isNaN(parsedDeduction) || parsedDeduction < 0) {
        return res.status(400).json({ error: "deduction_amount must be a valid non-negative number" });
    }

    try {
        const salaryRecord = await getActiveSalaryRecord(employee_id, payroll_month);
        if (!salaryRecord) {
            return res.status(400).json({ error: "No active salary record found for the selected payroll month" });
        }

        const existing = await dbGet(
            `SELECT id FROM payroll_records
             WHERE employee_id = ? AND payroll_month = ? AND status = 'issued'`,
            [employee_id, payroll_month]
        );
        if (existing) {
            return res.status(400).json({ error: "Salary has already been issued for this employee and month" });
        }

        const netPay = Number(salaryRecord.base_salary) - parsedDeduction;
        if (netPay < 0) {
            return res.status(400).json({ error: "Net pay cannot be negative" });
        }

        const result = await dbRun(
            `INSERT INTO payroll_records (
                employee_id, salary_record_id, payroll_month, base_salary,
                deduction_amount, net_pay, issued_by, remarks
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, salaryRecord.id, payroll_month, salaryRecord.base_salary, parsedDeduction, netPay, req.user.id, remarks]
        );

        await addAuditLog(req.user.id, "ISSUE_PAYROLL", "payroll_record", result.lastID, {
            employeeId: Number(employee_id),
            payrollMonth: payroll_month,
            salaryRecordId: salaryRecord.id
        });

        res.status(201).json({ message: "Payroll issued successfully", id: result.lastID });
    } catch {
        res.status(500).json({ error: "Failed to issue payroll" });
    }
});

router.post("/payroll-records/issue-bulk", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const { payroll_month } = req.body;

    if (!payroll_month || !isValidMonth(payroll_month)) {
        return res.status(400).json({ error: "payroll_month must be in YYYY-MM format" });
    }

    try {
        const employees = await dbAll(`SELECT id FROM employees ORDER BY id ASC`);
        const issued = [];
        const skipped = [];

        for (const employee of employees) {
            const existing = await dbGet(
                `SELECT id FROM payroll_records
                 WHERE employee_id = ? AND payroll_month = ? AND status = 'issued'`,
                [employee.id, payroll_month]
            );

            if (existing) {
                skipped.push({ employee_id: employee.id, reason: "Already issued" });
                continue;
            }

            const salaryRecord = await getActiveSalaryRecord(employee.id, payroll_month);
            if (!salaryRecord) {
                skipped.push({ employee_id: employee.id, reason: "No active salary record" });
                continue;
            }

            const result = await dbRun(
                `INSERT INTO payroll_records (
                    employee_id, salary_record_id, payroll_month, base_salary,
                    deduction_amount, net_pay, issued_by
                 ) VALUES (?, ?, ?, ?, 0, ?, ?)`,
                [employee.id, salaryRecord.id, payroll_month, salaryRecord.base_salary, salaryRecord.base_salary, req.user.id]
            );

            issued.push({ employee_id: employee.id, payroll_id: result.lastID });
            await addAuditLog(req.user.id, "ISSUE_PAYROLL", "payroll_record", result.lastID, {
                employeeId: employee.id,
                payrollMonth: payroll_month,
                salaryRecordId: salaryRecord.id,
                bulk: true
            });
        }

        res.status(201).json({
            message: "Bulk payroll processing completed",
            issued_count: issued.length,
            skipped_count: skipped.length,
            issued,
            skipped
        });
    } catch {
        res.status(500).json({ error: "Failed to issue bulk payroll" });
    }
});

router.post("/payroll-records/:id/corrections", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    const payrollId = Number(req.params.id);
    const { amount_delta, remarks } = req.body;

    const parsedDelta = Number(amount_delta);
    if (Number.isNaN(parsedDelta) || parsedDelta === 0 || !remarks) {
        return res.status(400).json({ error: "amount_delta and remarks are required. amount_delta cannot be 0" });
    }

    try {
        const original = await dbGet("SELECT * FROM payroll_records WHERE id = ?", [payrollId]);
        if (!original) {
            return res.status(404).json({ error: "Original payroll record not found" });
        }

        const existingCorrection = await dbGet(
            `SELECT id FROM payroll_records WHERE correction_of_payroll_id = ? AND status = 'correction'`,
            [payrollId]
        );
        if (existingCorrection) {
            return res.status(400).json({ error: "A correction record already exists for this payroll" });
        }

        const correctedNet = Number(original.net_pay) + parsedDelta;
        if (correctedNet < 0) {
            return res.status(400).json({ error: "Corrected net pay cannot be negative" });
        }

        const result = await dbRun(
            `INSERT INTO payroll_records (
                employee_id, salary_record_id, payroll_month, base_salary,
                deduction_amount, net_pay, issued_by, status, correction_of_payroll_id, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'correction', ?, ?)`,
            [
                original.employee_id,
                original.salary_record_id,
                original.payroll_month,
                original.base_salary,
                Math.max(0, Number(original.deduction_amount) - parsedDelta),
                correctedNet,
                req.user.id,
                payrollId,
                remarks
            ]
        );

        await addAuditLog(req.user.id, "ISSUE_PAYROLL_CORRECTION", "payroll_record", result.lastID, {
            originalPayrollId: payrollId,
            amountDelta: parsedDelta
        });

        res.status(201).json({ message: "Correction record created successfully", id: result.lastID });
    } catch (error) {
        if (String(error.message || "").includes("UNIQUE constraint failed")) {
            return res.status(400).json({ error: "Cannot create another issued payroll row for the same employee and month" });
        }
        res.status(500).json({ error: "Failed to create correction record" });
    }
});

router.get("/audit-logs", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT al.*, actor.name AS actor_name
             FROM audit_logs al
             LEFT JOIN employees actor ON actor.id = al.actor_employee_id
             ORDER BY al.created_at DESC, al.id DESC
             LIMIT 200`
        );
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
});

module.exports = router;
