# ⚡ SnapLink - URL Shortener

> A simple and lightweight URL shortening application built with Node.js and SQLite.

## 🌐 Live Demo

🚀 **[https://snaplink-77hw.onrender.com/](https://snaplink-77hw.onrender.com/)**

---

## 📌 About

**SnapLink** converts long URLs into short and easy-to-share links.

It supports custom aliases, QR code generation, click tracking, and link search.

---

## ✨ Features

* 🔗 Shorten long URLs
* 🎯 Create custom aliases
* ⚡ Redirect short URLs
* 📱 Generate QR codes
* 📥 Download QR codes as SVG
* 📊 Track link clicks
* 🔎 Search shortened links
* 📋 Copy short links
* 💾 SQLite database storage
* 📱 Responsive interface
* 🧪 Automated testing

---

## 🛠️ Technologies Used

| Technology | Purpose                |
| ---------- | ---------------------- |
| Node.js    | Backend server         |
| SQLite     | Database               |
| HTML5      | Web structure          |
| CSS3       | Styling                |
| JavaScript | Frontend functionality |
| SVG        | QR code generation     |
| Render     | Deployment             |

---

## 🗂️ Project Structure

```text
link-shortener/
│
├── db.js              # SQLite database manager
├── server.js          # HTTP server and API routes
├── test.js            # Automated tests
├── package.json       # Project configuration
├── README.md          # Project documentation
│
├── data/
│   └── links.db       # SQLite database
│
└── public/
    ├── index.html     # Web interface
    ├── style.css      # Website styles
    ├── app.js         # Frontend functionality
    └── qr.js          # QR code generator
```

---

## 🔄 How It Works

```text
Enter Long URL
      │
      ▼
Optional Custom Alias
      │
      ▼
Generate Short Link
      │
      ├───────────────┐
      ▼               ▼
  Short URL        QR Code
      │
      ▼
 Click Tracking
      │
      ▼
SQLite Database
```

---

## 🎯 Example

### Original URL

```text
https://example.com/very/long/url/path
```

### Short URL

```text
https://snaplink-77hw.onrender.com/abc123
```

### Custom Alias

```text
https://snaplink-77hw.onrender.com/my-project
```

---

## 💾 Database

SnapLink uses **SQLite** to store shortened URL information.

```text
data/links.db
```

---

## 🚀 Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/link-shortener.git
```

### 2. Open the Project

```bash
cd link-shortener
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

Or:

```bash
node server.js
```

### 5. Open in Browser

```text
http://localhost:3000
```

---

## 🧪 Run Tests

```bash
npm test
```

---

## 🔐 Security

Possible production security improvements:

* URL validation
* Input sanitization
* Rate limiting
* Malicious URL detection
* Abuse prevention
* HTTPS
* Open-redirect protection

---

## 📈 Future Enhancements

* [ ] User authentication
* [ ] Advanced analytics
* [ ] Link expiration
* [ ] Password-protected links
* [ ] Custom domains
* [ ] REST API
* [ ] Admin dashboard
* [ ] Malicious URL detection
* [ ] Docker support

---

## 🎓 Use Cases

* Academic projects
* Presentations
* Social media sharing
* QR-based sharing
* Documentation
* Developer projects
* Marketing links

---

## 👨‍💻 Author

**Shyambalaji S**

Computer Science Engineering Student
Cloud Security & Cybersecurity Enthusiast

* GitHub: [https://github.com/shyambalaji27](https://github.com/shyambalaji27)
* LinkedIn: [https://www.linkedin.com/in/shyambalaji-s-7a2072379/](https://www.linkedin.com/in/shyambalaji-s-7a2072379/)

---

<p align="center">
  Built with Node.js, SQLite, HTML, CSS & JavaScript
</p>

<p align="center">
  ⚡ <strong>SnapLink — Shorten. Share. Track.</strong>
</p>
