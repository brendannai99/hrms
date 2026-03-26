# TEAMWORK

## Student 1 - Brendan Nai
Implemented employee onboarding, authentication, profile management, password reset, and access control.

## Student 2 - Sharlotte
Implemented leave application, leave approval workflow, leave validation, and leave balance logic.

## Student 3 - Haziq
Scope & Responsibilities:

- Developed the Organizational Chart module to visually represent reporting hierarchies for all employees.
- Implemented manager assignment and reporting structure logic, ensuring data integrity and preventing circular dependencies.
- Built the performance management system, allowing managers to rate direct reports with a 1–5 rating scale and optional comments.
- Applied access control, so managers can only view and rate their direct reports, and employees can only view their own performance.
- Integrated the Org Chart module with the backend, connecting it to the MySQL database for dynamic updates and persistence.
- Ensured data correctness and hierarchical consistency across user actions such as role changes or manager reassignment
- Tested and debugged visual tree representation of the org chart to provide an intuitive user interface for all employees.

Key Challenges Tackled:

- Preventing circular reporting chains during manager assignment.
- Handling role transitions while maintaining historical performance ratings.
- Implementing time-bound review periods and ensuring only one rating per employee per period.
- Maintaining data integrity while providing real-time updates in the frontend visualization.

Impact:

- Enabled managers to track performance effectively and make informed decisions.
- Created a clear visualization of the company hierarchy, improving usability and understanding of reporting lines.

## Student 4 - Teo Wei Jie
Implemented salary management and monthly payroll issuance:
- salary versioning with effective dates
- admin-only salary updates
- employee self-view salary access
- payroll issuance and duplicate prevention
- payroll correction records
- audit log for salary and payroll actions
