HRMS – Human Resource Management System

ICT2504C Full Stack Secured Development Assignment

This project is a full stack Human Resource Management System (HRMS) built using a cloud-hosted MySQL database.

The system allows administrators to manage employees, salaries, payroll issuance, and audit logs while implementing secure authentication and account protection mechanisms.

Tech Stack

Frontend:
React (Vite)
Axios
React Router

Backend:
Node.js
Express.js
JWT Authentication
bcrypt password hashing

Database:
MySQL hosted on Aiven Cloud

Requirements

Install the following before running the project.

Node.js

Download Node.js from:
https://nodejs.org/

Recommended version: Node.js version 18 or higher.

After installation verify using:
node -v
npm -v

Clone the Project

git clone <repository_url>
cd hrms

Project structure:

hrms

frontend
backend
launch-windows.bat
README.md
Database Setup (Cloud Database)

This project uses a MySQL database hosted on Aiven Cloud.
Local MySQL installation is NOT required.

All teammates connect to the same cloud database.

However, the database schema must be created once.

Step 1 – Open MySQL Workbench

Download:
https://dev.mysql.com/downloads/workbench/

Step 2 – Connect to Database

Use the credentials from your .env file:
-----------------------------------------------------------
Host: kabas-sql-jiggydiggity.f.aivencloud.com
Port: 28603
User: avnadmin
Password: (From .env)
Database: hrms
-----------------------------------------------------------

Step 3 – Run Schema

Open:
backend/hrms_schema.sql

Run the FULL script.

This creates:
employees
salary_records
payroll_records
audit_logs
refresh_tokens

Backend Setup

cd backend

Create a .env file and insert these:
-----------------------------------------------------------
JWT_SECRET=hrms_super_secret_key_2026_brendan_project

DB_HOST=kabas-sql-jiggydiggity.f.aivencloud.com
DB_PORT=28603
DB_USER=avnadmin
DB_PASSWORD= (From .env)
DB_NAME=hrms

EMAIL_USER=hrmsprojectofficial@gmail.com
EMAIL_PASS=iiacavycqfecilac
FRONTEND_URL=http://localhost:5173
-----------------------------------------------------------

IMPORTANT:
Do not commit .env files.

Install Dependencies

Option A (Recommended)

Just run:
launch-windows.bat

This will:

install backend dependencies
install frontend dependencies
start both servers
open browser automatically

Option B (Manual)

Frontend:
cd frontend
npm install

Backend:
cd backend
npm install

Run the Application

Option 1 (Recommended)

Double click:
launch-windows.bat

Option 2 (Manual)

Terminal 1:
cd backend
npm run dev

Terminal 2:
cd frontend
npm run dev

Application URLs

Frontend:
http://localhost:5173

Backend:
http://localhost:3001

Admin Account (IMPORTANT)

Use this account to access admin features:

-----------------------------------------------------------
Email: adminnew@hrms.com
Password: Admin123!
-----------------------------------------------------------

This account allows you to:

create new accounts
update accounts
unlock accounts
manage salary and payroll
view audit logs
First Time Login Flow
Admin creates employee account
User logs in with temporary password
User is redirected to First Time Password page
User sets a new password
User can access dashboard
Security Features

Password Security:
Passwords are hashed using bcrypt
No plaintext passwords are stored

JWT Authentication:
Access Token (15 minutes)
Refresh Token (7 days)

Refresh Token Rotation:
Old token is invalidated
New token is issued

Brute Force Protection:
Max attempts: 5
Lock duration: 15 minutes

Admin Unlock:
Admins can unlock accounts in Manage Employees page

Audit Logging:
Tracks:

login success / failure
password changes
account lock / unlock
payroll actions
employee updates
Common Issues

Port already in use:
Change in .env:
APP_PORT=3002

Backend cannot connect:
Check DB_HOST, DB_PORT, DB_USER, DB_PWD

Login fails:
Check user exists in database
Check correct password
Check bcrypt hashing

Dependencies missing:
Run:
npm install

or use:
launch-windows.bat

Project Structure

Backend:
backend/src/routes
backend/src/middleware
backend/src/config

Frontend:
frontend/src/pages
frontend/src/services/api.js

Architecture

Frontend (React)
↓
Backend API (Node.js + Express)
↓
Cloud Database (Aiven MySQL)

No local database required
Shared database across team

Quick Start

Clone repo
Setup .env
Run launch-windows.bat
Login using:

-----------------------------------------------------------
Email: adminnew@hrms.com
Password: Admin123!
-----------------------------------------------------------
