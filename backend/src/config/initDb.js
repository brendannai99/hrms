const db = require("./db");

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES employees(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS performance_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comments TEXT NOT NULL,
      review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (reviewer_id) REFERENCES employees(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS salary_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      base_salary REAL NOT NULL CHECK (base_salary >= 0),
      effective_date TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (created_by) REFERENCES employees(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      salary_record_id INTEGER NOT NULL,
      payroll_month TEXT NOT NULL,
      base_salary REAL NOT NULL,
      deduction_amount REAL NOT NULL DEFAULT 0 CHECK (deduction_amount >= 0),
      net_pay REAL NOT NULL,
      issued_by INTEGER NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'issued',
      correction_of_payroll_id INTEGER,
      remarks TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (salary_record_id) REFERENCES salary_records(id),
      FOREIGN KEY (issued_by) REFERENCES employees(id),
      FOREIGN KEY (correction_of_payroll_id) REFERENCES payroll_records(id),
      UNIQUE (employee_id, payroll_month, status)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_employee_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_employee_id) REFERENCES employees(id)
    )
  `);

    db.run(
        `ALTER TABLE employees ADD COLUMN must_change_password INTEGER DEFAULT 1`,
        (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Failed to add must_change_password column:", err.message);
            }
        }
    );

    db.run(
        `ALTER TABLE employees ADD COLUMN reset_token TEXT`,
        (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Failed to add reset_token column:", err.message);
            }
        }
    );

    db.run(
        `ALTER TABLE employees ADD COLUMN reset_token_expiry DATETIME`,
        (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Failed to add reset_token_expiry column:", err.message);
            }
        }
    );
});

module.exports = db;