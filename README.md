# 🌿 EcoTracker – A Community-Powered Environmental Reporting Platform

EcoTracker is a full-stack web application that enables citizens to report, track, and engage with environmental issues in their local areas. Whether it's illegal garbage dumping, smog, deforestation, or water pollution — EcoTracker creates a centralized hub for raising awareness and prompting action.

---

## 🔧 Tech Stack

- **Frontend**: HTML, CSS, JavaScript (with TailwindCSS)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (NeonDB – Serverless Cloud DB)
- **Authentication**: Express Sessions
- **Deployment**: Render + NeonDB
- **Other Tools**: Multer (File Uploads), Chart.js (Future Reporting), EJS Templating

---

## 📌 Features

### ✅ User Features
- Anonymous or authenticated environmental issue reporting
- Interactive Map to view incidents by location
- EcoFeed: Twitter-style feed with:
  - Report Title, Description & Image
  - Upvote/Downvote system
  - Comment section for discussions
- Location & category-based filtering
- Real-time report tracking

### 🛠 Admin Panel
- User role detection based on email domain (`@ecotracker.pk`)
- Role-based access: Admin vs User views
- View and manage:
  - All submitted reports
  - Report statuses (e.g., Pending, Verified, Resolved)
  - User comments and votes

### 🔒 Security & Data Integrity
- Secure sessions for authentication
- Parameterized SQL queries to prevent injection
- Anonymous reporting without storing identity
- Referential integrity using foreign keys in PostgreSQL

---

## 📊 Modules

### 🗺 Reports Module
- Reports Table (title, description, location, category, status, image)
- Allows upvotes/downvotes and threaded comments

### 💬 Voting System
- Prevents duplicate votes using `(user_id, report_id)` unique constraint
- Dynamic vote count update on each interaction

### 👥 Comments
- Authenticated users can comment
- Anonymous reports hide user info in public view

### 📌 Admin Dashboard
- Count cards for total reports, upvotes, categories, and users
- Future-ready charts with Chart.js

---

## 🚀 Getting Started

### 🖥 Prerequisites
- Node.js & npm
- PostgreSQL account (NeonDB or local setup)

### ⚙️ Installation
```bash
git clone https://github.com/sahilkumarvalecha/ecotracker.git
cd ecotracker
npm install
````

### 🛠 Environment Setup

Create a `.env` file with:

```env
DB_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_session_key
```

### ▶️ Run the App

```bash
npm start
```

---

## 🙌 Credits

### 👨‍💻 Developers:

* **Sahil Kumar Valecha**
* **Saleena Ahuja**

### 🤝 Initial Hackathon Contributors:

* Muhammad Muneeb
* Mahkash Thourani

### 🎓 Mentors:

* **Sir Usama Khalid**
* **Sir Abid Ali**

---

## 🌍 Purpose

EcoTracker was originally conceptualized during the ZAB E-Fest Hackathon as a civic-tech project for positive environmental impact. Although the project wasn't completed during the event, it was later revived and completed with enhanced features, data models, and an intuitive UI.

---

## 📷 Demo 

Uploading Eco Tracker - Made with Clipchamp (1).mp4…

---

## 🏁 Future Enhancements

* Real-time notifications
* Report escalation workflows
* Admin assignment to field officers
* Public API for NGOs and media access
* Interactive data visualizations with Chart.js

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

```

---

Let me know if you’d like a version with images, demo links, or if you want help writing the screen-recording script for GitHub or LinkedIn!
```
