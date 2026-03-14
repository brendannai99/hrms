const db = require("../config/db");

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else {
                resolve({
                    lastID: result.insertId,
                    changes: result.affectedRows
                });
            }
        });
    });
}

async function addAuditLog(actorEmployeeId, action, targetType, targetId, details = null) {
    await dbRun(
        `INSERT INTO audit_logs (actor_employee_id, action, target_type, target_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
            actorEmployeeId || null,
            action,
            targetType,
            targetId || null,
            details ? JSON.stringify(details) : null
        ]
    );
}

module.exports = { addAuditLog };