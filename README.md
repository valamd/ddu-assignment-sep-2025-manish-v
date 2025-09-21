# 💰 Personal Expense Tracker with Analytics

[![Author](https://img.shields.io/badge/Author-Manish%20Vala-blue)](#)
[![Assessment](https://img.shields.io/badge/Assessment-eQuest%20Solutions%20Assignment-green)](#)
[![Tech Stack](https://img.shields.io/badge/Stack-Full--Stack%20Web%20App-orange)](#)

---

## 📋 Overview
The **Personal Expense Tracker with Analytics** is a secure, full-stack web application that allows users to manage their daily expenses efficiently.  
It provides **budget tracking, analytics dashboards, predictive insights, and personalized notifications** to improve financial decision-making.  

---
---

## 🎥 Demo Video
👉 [**Click here to watch Demo Video**](https://drive.google.com/file/d/1s79dDmlPMDdbCtcjppRUefblDaVUg-Z3/view?usp=sharing )  

---

## 📚 Documentation
- 📄 [**Project Design Document (PDF)**](https://drive.google.com/file/d/1pz6rF-4A8dYgsfsdDy8GZoEOGUodTPjV/view?usp=sharing )
- Includes architecture, database schema, security measures, and future improvements.
## 🚀 Features
- 🔐 **User Authentication & Profile**
  - Secure JWT-based login/registration
  - Password hashing with bcrypt
  - Rate limiting & session expiry
- 💸 **Expense Management**
  - Add, edit, delete expenses with validations
  - Receipt upload (JPEG/PNG, ≤2MB)
  - Duplicate expense detection
- 🏷 **Category Management**
  - System & custom categories with color codes
  - Monthly budgets with alerts
- 📊 **Analytics Dashboard**
  - Charts: Pie, Bar, Line (spending & trends)
  - Export reports in **CSV/PDF**
  - Predictive budget suggestions & anomaly detection
- 🎨 **UI/UX**
  - Fully responsive (mobile-first)
  - Dark mode & accessibility support
  - Interactive dashboard with drag/drop widgets



---

## 🛠 Technology Stack
**Frontend:** React.js (TailwindCSS / Bootstrap, Recharts/Chart.js)  
**Backend:** Node.js (Express.js, bcrypt, JWT, multer, express-rate-limit)  
**Database:** MySQL   
**Other Tools:**  CSV/PDF Export, ESLint/Prettier  

---

## 🔧 Installation & Setup 

1.**Clone Repository** </br>
git clone https://github.com/eqpracticals/ddu-assignment-sep-2025-manish-v.git cd ddu-assignment-sep-2025-manish-v </br>

2.**Install Backend Dependencies**</br>
cd backend npm install </br>

3.**Setup Environment Variables**</br>
PORT=5000</br>
DB_HOST=localhost</br>
DB_USER=root</br>
DB_PASSWORD=yourpassword</br>
DB_NAME=expense_tracker</br>
JWT_SECRET=your_jwt_secret</br>

4.**Run Database Migrations & Seed Data**</br> 
MySQL example mysql -u root -p < database/schema.sql mysql -u root -p < database/seed_data.sql </br>

5.**Start Backend Server** </br>
npm run dev</br>

6.**Install Frontend Dependencies**</br> 
cd ../frontend npm install </br>

7.**Start Frontend Server** </br>
npm start</br>

## 📂 Project Structure
```bash
root/
├── backend/          # Node.js/Express API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/         # React.js frontend
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── App.js
│
├── database/         # SQL schema & seed data
├── docs/             # Design & API documents
├── .env.example
├── package.json
└── README.md

