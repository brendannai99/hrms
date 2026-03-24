const db = require("./db");

const setupDatabase = () => {
    const createReportingHistory = `
        CREATE TABLE IF NOT EXISTS reporting_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            manager_id INT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (manager_id) REFERENCES employees(id)
        )
    `;

    const createReviewPeriods = `
        CREATE TABLE IF NOT EXISTS review_periods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            period_name VARCHAR(255) NOT NULL,
            is_open TINYINT(1) DEFAULT 0,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES employees(id)
        )
    `;

    const createPerformanceRatings = `
        CREATE TABLE IF NOT EXISTS performance_ratings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            reviewer_id INT NOT NULL,
            review_period_id INT NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comments TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (reviewer_id) REFERENCES employees(id),
            FOREIGN KEY (review_period_id) REFERENCES review_periods(id),
            UNIQUE KEY unique_review (employee_id, review_period_id) 
        )
    `;

    db.query(createReportingHistory, (err) => {
        if (err) console.error("Error creating reporting_history table:", err);
        else console.log("Table 'reporting_history' ready.");
    });

    db.query(createReviewPeriods, (err) => {
        if (err) {
            console.error("Error creating review_periods table:", err);
        } else {
            console.log("Table 'review_periods' ready.");

            db.query(createPerformanceRatings, (err) => {
                if (err) console.error("Error creating performance_ratings table:", err);
                else console.log("Table 'performance_ratings' ready.");
            });
        }
    });
};

module.exports = setupDatabase;