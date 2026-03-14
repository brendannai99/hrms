HRMS – Human Resource Management System

ICT2504C Full Stack Secured Development Assignment

This project is a Full Stack Human Resource Management System (HRMS) built using a cloud-hosted MySQL database.

The system allows administrators to manage employees, salaries, payroll issuance, and audit trails while implementing secure authentication and account protection mechanisms.

Tech Stack

Frontend
React (Vite)
Axios
React Router

Backend
Node.js
Express.js
JWT Authentication
bcrypt password hashing

Database
MySQL hosted on Aiven Cloud

1. Requirements

Install the following before running the project.

Node.js

Download Node.js from:
https://nodejs.org/

Recommended version: Node.js version 18 or higher.

After installation verify it using the commands:
node -v
npm -v

2. Clone the Project

Clone the repository and navigate into the project folder.

git clone <repository_url>
cd hrms

Project structure:

hrms
frontend
backend
README.md

3. Database Setup (Cloud Database)

This project uses a MySQL database hosted on Aiven Cloud.
Local MySQL installation is not required.

All teammates connect to the same cloud database.

However the database schema must still be created once.

Step 1 – Open MySQL Workbench

If you do not have MySQL Workbench installed, download it from:
https://dev.mysql.com/downloads/workbench/

Step 2 – Connect to the Cloud Database

Create a new MySQL connection using the Aiven credentials.

Example configuration:

Host: kabas-sql-jiggydiggity.f.aivencloud.com
Port: 28603
User: avnadmin
Password: provided in the project .env file
Database: defaultdb

If MySQL Workbench Shows "No Connection"

Sometimes MySQL Workbench cannot connect because the MySQL service is not running.

To fix this in Windows:

Press the Windows key

Search for "Services"

Open the Services application

Look for MySQL or MySQL80

Right click and select Start

After the service starts, reconnect using MySQL Workbench.

Step 3 – Create Tables

Open the file located at:

backend/hrms_schema.sql

Run the entire SQL script.

This will create the following tables:

employees
salary_records
payroll_records
audit_logs
refresh_tokens

These tables support employee management, payroll processing, audit logging, and refresh token authentication.

4. Backend Environment Setup

Navigate to the backend folder.

cd backend

Create a .env file based on the .env.example file.

Example configuration:

APP_PORT = 3001

CLIENT_URL = http://localhost:5173

DB_HOST = kabas-sql-jiggydiggity.f.aivencloud.com
DB_PORT = 28603
DB_USER = avnadmin
DB_PWD = your_aiven_password
DB_NAME = defaultdb

JWT_SECRET = super_secret_key

FRONTEND_URL = http://localhost:5173

Important:
Do not commit .env files to Git.

5. Install Dependencies

From the project root install dependencies for both frontend and backend.

Install Frontend Dependencies

cd frontend
npm install

Install Backend Dependencies

cd ../backend
npm install

Backend Dependencies

The backend uses the following packages:

express
cors
mysql2
bcryptjs
jsonwebtoken
dotenv
nodemon
crypto

If needed they can be installed manually using npm install.

Frontend Dependencies

The frontend uses:

react
vite
axios
react-router-dom

6. Running the Application

You need two terminals to run the system.

Terminal 1 – Start Backend

Navigate to backend folder.

cd backend
npm run dev

Expected output should show:

Server running on port 3001
Connected to MySQL database

Backend URL:
http://localhost:3001

Terminal 2 – Start Frontend

Navigate to frontend folder.

cd frontend
npm run dev

Frontend URL:
http://localhost:5173

Open this address in your browser.

7. Running Everything From Root

Install dependencies:

cd frontend
npm install

cd ../backend
npm install

Start backend:

cd backend
npm run dev

Start frontend in another terminal:

cd frontend
npm run dev

8. First Login Flow

The system requires new employees to change their password when logging in for the first time.

Process:

Admin creates a new employee account
Employee logs in with temporary password
User is redirected to the First Time Password page
User sets a new password
User is granted access to the dashboard

9. Security Features Implemented

The system includes multiple security features to protect user accounts.

Password Security

Passwords are hashed using bcrypt before being stored in the database.

This ensures passwords are never stored as plain text.

JWT Authentication

The system uses JSON Web Tokens for authentication.

Two types of tokens are used.

Access Token
Short-lived token used for authentication when accessing protected API endpoints.
Valid for 15 minutes.

Refresh Token
Long-lived token stored in the database.
Valid for 7 days.

When the access token expires, the frontend automatically uses the refresh token to request a new access token.

Refresh Token Rotation

Every time a refresh token is used:

The old refresh token is revoked.
A new refresh token is generated.

This prevents reuse of compromised tokens.

Brute Force Login Protection

Accounts are automatically locked after repeated failed login attempts.

Security rules:

Maximum failed login attempts: 5
Lock duration: 15 minutes

Example sequence:

Failed attempt 1
Failed attempt 2
Failed attempt 3
Failed attempt 4
Failed attempt 5
Account locked

Admin Account Unlock

Administrators can unlock locked employee accounts through the Manage Employees page.

Unlocking resets the failed login attempts and removes the lock.

Audit Logging

The system records important security and administrative actions in an audit trail.

Examples of logged events include:

Login success
Login failed
Account locked
Account unlocked
Password changed
Password reset requested
Password reset completed
Token refresh
Logout
Employee created
Employee updated

The audit trail helps track all security-related activities in the system.

10. Common Issues

Port Already in Use

Change the backend port in the .env file.

Example:
APP_PORT = 3002

Restart the backend server.

Backend Cannot Connect to Database

Check the database credentials in the .env file:

DB_HOST
DB_PORT
DB_USER
DB_PWD
DB_NAME

Ensure the Aiven database credentials are correct.

Login Fails

Verify the following:

The user exists in the employees table.
Passwords are hashed using bcrypt.
Correct email and password are used.

11. Development Notes

Important Backend Folders

backend/src/routes
backend/src/middleware
backend/src/config

Frontend Pages

frontend/src/pages

API Service

frontend/src/services/api.js

This file handles all backend API requests and implements automatic JWT refresh handling.

12. System Architecture

Frontend (React)
communicates with

Backend API (Node.js + Express)

which connects to

Cloud Database (Aiven MySQL)

Because the database is cloud-hosted:

Teammates do not need local MySQL installations.
No developer machine needs to host the database.
All developers connect to the same shared database instance.