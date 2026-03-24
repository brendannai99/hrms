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
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
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

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  year INT NOT NULL,
  annual_quota DECIMAL(4,1) NOT NULL DEFAULT 14.0,
  annual_used DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  annual_remaining DECIMAL(4,1) NOT NULL DEFAULT 14.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_year_balance (employee_id, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type ENUM('annual', 'sick') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_day ENUM('none', 'AM', 'PM') NOT NULL DEFAULT 'none',
  days_requested DECIMAL(4,1) NOT NULL,
  reason TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
);