HRMS – Human Resource Management System

ICT2504C Full Stack Secured Development Assignment

This project is a Full Stack HR Management System (HRMS) built with:

Frontend
React (Vite)
Axios
Backend
Node.js
Express.js
JWT Authentication
bcrypt password hashing
Database
MySQL

The system supports:

Employee onboarding
Login authentication
First-time password setup
Password reset
Profile management
Salary management
Role-based access (Employee / Manager / Admin)

1. Requirements

Install the following before running the project:

Node.js

Download and install Node.js:

https://nodejs.org/

Recommended version:

Node.js >= 18

Check installation:

node -v
npm -v
MySQL Server

Download:

https://dev.mysql.com/downloads/mysql/

During installation:
Choose:
Developer Default

Create a root password.

Remember this password because you will need it for the .env file.

MySQL Workbench

Download:

https://dev.mysql.com/downloads/workbench/

Workbench is used to run the database schema.

2. Clone the Project
git clone <repository_url>
cd hrms

Project structure:

hrms
 ├ frontend
 ├ backend
 └ README.md

3. Database Setup

Open MySQL Workbench

Connect to your Local MySQL Instance

Open the file:

backend/hrms_schema.sql

Run the entire script.

This will create:

hrms database
employees table
salary tables

4. Backend Environment Setup

Go to backend folder:

cd backend

Create a .env file based on .env.example.

Example .env:

PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hrms

JWT_SECRET=supersecretkey

FRONTEND_URL=http://localhost:5173

Replace:

your_mysql_password

with your MySQL root password.

5. Install Dependencies

From project root:

cd frontend
npm i client
npm install

Then:

cd ../backend
npm i client
npm install
Backend Dependencies Installed

The backend uses:

express
cors
mysql2
bcryptjs
jsonwebtoken
dotenv
crypto
nodemon

If needed you can install them manually:

npm install express cors mysql2 bcryptjs jsonwebtoken dotenv
npm install nodemon --save-dev
Frontend Dependencies Installed

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

You should see:

HRMS backend is running
Connected to MySQL database

Backend runs on:

http://localhost:5000
Terminal 2 – Start Frontend
cd frontend
npm run dev

Frontend runs on:

http://localhost:5173

Open this in your browser.

7. Running Everything From Root

Install dependencies:

cd frontend
npm install

cd ../backend
npm install

Run backend:

cd backend
npm run dev

Run frontend in another terminal:

cd frontend
npm run dev

8. First Login Flow

Admin creates employee accounts.

New employees must change password on first login.

Flow:

Admin creates account
↓
Employee logs in with temporary password
↓
User redirected to "First Time Password Setup"
↓
User sets their own password
↓
Normal dashboard access granted

9. Common Issues
MySQL connection failed

Check .env:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hrms

Make sure MySQL server is running.

Port already in use

Change backend port in .env:

PORT=5001
Node modules missing

Run again:

npm install

in both frontend and backend folders.

10. Development Notes

Important backend folders:

backend/src/routes
backend/src/middleware
backend/src/config

Frontend pages:

frontend/src/pages

API service:

frontend/src/services/api.js