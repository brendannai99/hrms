HRMS – Human Resource Management System

ICT2504C Full Stack Secured Development Assignment

This project is a Full Stack Human Resource Management System (HRMS) built using a cloud-hosted MySQL database.

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

MySQL (Hosted on Aiven Cloud)

1. Requirements

Install the following before running the project.

Node.js

Download Node.js:

https://nodejs.org/

Recommended version:

Node.js >= 18

Verify installation:

node -v
npm -v
2. Clone the Project
git clone <repository_url>
cd hrms

Project structure:

hrms
 ├ frontend
 ├ backend
 └ README.md
3. Database Setup (Cloud Database)

This project uses a MySQL database hosted on Aiven Cloud, so local MySQL installation is NOT required.

All teammates connect to the same cloud database.

The database schema must still be created once.

Step 1 – Open MySQL Workbench

Download if needed:

https://dev.mysql.com/downloads/workbench/

Step 2 – Connect to the Cloud Database

Create a new MySQL connection using the Aiven credentials.

Example:

Host: kabas-sql-jiggydiggity.f.aivencloud.com
Port: 28603
User: avnadmin
Password: (provided in project .env)
Database: defaultdb
Step 3 – Create Tables

Open the file:

backend/hrms_schema.sql

Run the entire script.

This will create:

employees table

salary tables

reset password fields

4. Backend Environment Setup

Go to backend folder:

cd backend

Create a .env file based on .env.example.

Example .env:

APP_PORT=3001

CLIENT_URL=http://localhost:5173

DB_HOST=kabas-sql-jiggydiggity.f.aivencloud.com
DB_PORT=28603
DB_USER=avnadmin
DB_PWD=your_aiven_password
DB_NAME=defaultdb

JWT_SECRET=super_secret_key

FRONTEND_URL=http://localhost:5173

Important:

Do NOT commit .env files to Git.

5. Install Dependencies

From project root:

Install Frontend Dependencies
cd frontend
npm install
Install Backend Dependencies
cd ../backend
npm install
Backend Dependencies

The backend uses:

express

cors

mysql2

bcryptjs

jsonwebtoken

dotenv

nodemon

crypto

If needed you can install them manually:

npm install express cors mysql2 bcryptjs jsonwebtoken dotenv
npm install nodemon --save-dev
Frontend Dependencies

The frontend uses:

react

vite

axios

react-router-dom

6. Running the Application

You need two terminals.

Terminal 1 – Start Backend
cd backend
npm run dev

Expected output:

Server running on port 3001
Connected to MySQL database

Backend runs on:

http://localhost:3001
Terminal 2 – Start Frontend
cd frontend
npm run dev

Frontend runs on:

http://localhost:5173

Open this URL in your browser.

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

Admin creates employee accounts.

New employees must change their password on first login.

Flow:

Admin creates account
        ↓
Employee logs in with temporary password
        ↓
User redirected to First Time Password page
        ↓
User sets a new password
        ↓
Dashboard access granted
9. Common Issues
Port Already in Use

Change backend port in .env:

APP_PORT=3002

Restart backend.

Backend Cannot Connect to Database

Check .env:

DB_HOST
DB_PORT
DB_USER
DB_PWD
DB_NAME

Ensure the Aiven database credentials are correct.

Login Fails

Make sure:

the user exists in the employees table

passwords are hashed using bcrypt

correct email/password are used

10. Development Notes
Important Backend Folders
backend/src/routes
backend/src/middleware
backend/src/config
Frontend Pages
frontend/src/pages
API Service
frontend/src/services/api.js

Handles all backend API requests.

Key Architecture
Frontend (React)
        ↓
Backend API (Node + Express)
        ↓
Cloud Database (Aiven MySQL)

Because the database is cloud-hosted:

teammates do NOT need local MySQL

nobody needs to keep their PC running to host the DB

everyone connects to the same shared database.