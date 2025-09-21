
# Expense Tracker Backend (Node.js + MySQL)

This project is a ready-to-run backend scaffold for the **Personal Expense Tracker** take-home assignment.
It implements the required **database schema** (exactly as provided in the assignment), core REST endpoints, authentication (JWT),
file uploads for receipts, basic validation, duplicate detection, audit log insertion, exports, and simple analytics.

## What is included
- Express server with modular routes/controllers
- MySQL schema SQL (migrations/schema.sql) using the **exact** CREATE TABLE statements required by the assignment
- `src/utils/run_migrations.js` to run the SQL migration and seed system categories
- Authentication (register/login) using bcryptjs + JWT (24h expiry)
- Password reset implemented via short-lived JWT token (no extra DB table required)
- Expense & Category endpoints with validation and rules matching the assignment
- Receipt upload via `multipart/form-data` (JPEG/PNG only, max 2MB)
- Export endpoint for CSV
- Simple analytics endpoints (overview and charts placeholders)
- Dockerfile + docker-compose (optional; app service needs `npm install` first)

## Quick start (local)
1. Copy `.env.example` to `.env` and set your DB credentials.
2. `npm install`
3. Create a MySQL database named `expense_tracker` (or set `DB_NAME` to your database name).
4. Run migrations & seed: `npm run migrate`
   - This executes `migrations/schema.sql` and seeds system categories.
5. Start app: `npm run dev` (requires `nodemon`) or `npm start`

### Notes
- After running migrations the required tables will be created **exactly** as in the assignment schema.
- The app uses parameterized queries (mysql2) to avoid SQL injection.
- Password reset uses JWT tokens (signed) with 1-hour expiry and is printed to console to simulate email sending.
- Use Postman or similar to interact with the API. Example routes:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `GET /api/categories`
  - `POST /api/expenses` (multipart/form-data with `receipt` file field allowed)
  - `GET /api/expenses/export?format=csv`

## Where to go next
- Run `npm install` to fetch dependencies.
- Start the server and test endpoints.
- I can extend any endpoints, add unit tests, or wire up an actual email service (SendGrid/Nodemailer) if you want — tell me what to add next!

