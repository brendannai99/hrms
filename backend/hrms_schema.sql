CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('employee', 'manager', 'admin') NOT NULL,
  department VARCHAR(255),
  manager_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  must_change_password TINYINT(1) DEFAULT 1,
  reset_token TEXT NULL,
  reset_token_expiry DATETIME NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  rating INT NOT NULL,
  comments TEXT NOT NULL,
  review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (reviewer_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (created_by) REFERENCES employees(id),
  CHECK (base_salary >= 0)
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  salary_record_id INT NOT NULL,
  payroll_month VARCHAR(20) NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(10,2) NOT NULL,
  issued_by INT NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'issued',
  correction_of_payroll_id INT NULL,
  remarks TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (salary_record_id) REFERENCES salary_records(id),
  FOREIGN KEY (issued_by) REFERENCES employees(id),
  FOREIGN KEY (correction_of_payroll_id) REFERENCES payroll_records(id),
  UNIQUE KEY unique_payroll_record (employee_id, payroll_month, status),
  CHECK (deduction_amount >= 0)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_employee_id INT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id INT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_employee_id) REFERENCES employees(id)
);