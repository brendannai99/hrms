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