⚡ SnapLink — Fast Link Reducer & URL Shortener

A lightweight and modern URL shortening application that converts long URLs into clean, shareable links with custom aliases, QR code generation, click tracking, and persistent storage.

<p align="center">
  <a href="https://snaplink-77hw.onrender.com/">
    <strong>🚀 Live Demo</strong>
  </a>
</p>

📌 Overview

SnapLink is a web-based URL shortening application designed to make long and complex URLs shorter, cleaner, and easier to share.

Users can enter a long URL, optionally create a custom alias, generate a short link, generate a QR code, and track the number of clicks received by each shortened URL.

The project uses a lightweight Node.js HTTP server with SQLite for persistent link storage.

🌐 Live Demo

🚀 Live Application:
https://snaplink-77hw.onrender.com/

✨ Features

🔗 URL Shortening — Convert long URLs into short, shareable links.

⚡ Instant Redirection — Redirect users from short URLs to their original destinations.

🎯 Custom Aliases — Create personalized short-link endings.

📱 QR Code Generation — Generate QR codes for shortened URLs.

📥 QR Code Download — Download generated QR codes as SVG.

📊 Click Tracking — Track the number of visits to shortened URLs.

🔎 Link Search — Search through generated links and aliases.

📋 Copy Short Link — Quickly copy shortened URLs.

💾 Persistent Storage — Store link information in SQLite.

🧪 Automated Testing — Includes a test suite for application functionality.

📱 Responsive UI — Designed to work across desktop and mobile devices.

🪶 Lightweight Backend — Uses Node.js without requiring a heavy backend framework.

🖥️ Application Workflow

                     ┌──────────────────────┐
                     │      Enter URL       │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Optional Custom      │
                     │       Alias          │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   Generate Short     │
                     │        Link          │
                     └──────────┬───────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
                 ▼              ▼              ▼
          ┌────────────┐ ┌────────────┐ ┌────────────┐
          │ Short URL  │ │  QR Code   │ │ Click Data │
          └─────┬──────┘ └────────────┘ └─────┬──────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                     ┌──────────────────────┐
                     │  SQLite Database     │
                     │     links.db         │
                     └──────────────────────┘

🛠️ Technology Stack

Technology

Purpose

Node.js

Backend runtime and HTTP server

node

SQLite database management

SQLite

Persistent storage for shortened links

HTML5

Web page structure

CSS3

UI styling and responsive design

JavaScript

Client-side functionality

SVG

QR code generation and download

Render

Application deployment

🗂️ Project Structure

link-shortener/
│
├── db.js              # SQLite database manager using node:sqlite
├── server.js          # HTTP server, routing, API endpoints, redirection
├── test.js            # Automated test suite
├── package.json       # Project configuration
├── README.md          # Project documentation
│
├── data/
│   └── links.db       # Persistent SQLite database
│
└── public/
    ├── index.html     # Responsive web UI
    ├── style.css      # Modern design system & styles
    ├── app.js         # Client-side controller & toast alerts
    └── qr.js          # Standalone client-side QR SVG generator

🎯 Core Functionality

1. URL Shortening

SnapLink accepts a long URL and generates a compact short link.

Example

Original URL
    ↓
https://example.com/products/category/item/details
    ↓
SnapLink
    ↓
Short URL
    ↓
https://snaplink-77hw.onrender.com/abc123

The generated short URL can then be shared with other users.

2. Custom Aliases

Users can optionally specify their own alias for a shortened URL.

Example

Original URL:
https://example.com/my-project

Custom Alias:
my-project

Generated Link:
https://snaplink-77hw.onrender.com/my-project

Custom aliases make links easier to remember and share.

3. URL Redirection

When a user opens a generated short URL:

User
  │
  ▼
Short URL
  │
  ▼
SnapLink Server
  │
  ▼
Find URL in SQLite
  │
  ▼
Original URL
  │
  ▼
Redirect User

4. Click Tracking

SnapLink records the number of clicks received by shortened URLs.

Example:

Short Link        Clicks
─────────────────────────
/abc123              25
/my-project           42
/demo                 18

This provides basic usage information for each generated link.

5. QR Code Generation

SnapLink can generate a QR code for a shortened URL.

Short URL
    │
    ▼
QR Generator
    │
    ▼
SVG QR Code
    │
    ├── View
    └── Download

QR codes can be useful for:

Presentations

Posters

Projects

Printed documents

Mobile sharing

Events

6. Link Search

Users can search through their generated links.

Search can be used to quickly find:

Short URLs

Aliases

Stored links

💾 Database

SnapLink uses SQLite for persistent data storage.

The database is located at:

data/
└── links.db

The database stores information required for managing shortened links, including the destination URL, short identifier/alias, click information, and creation data.

🧪 Testing

The project includes an automated test suite:

test.js

Run the tests using:

npm test

Testing helps verify that important application functionality continues to work correctly after changes.

🚀 Getting Started

Prerequisites

Install the following before running the project locally:

Node.js

npm

Git

Verify the installations:

node --version
npm --version
git --version

📥 Installation

1. Clone the Repository

git clone https://github.com/YOUR-USERNAME/link-shortener.git

2. Navigate to the Project

cd link-shortener

3. Install Dependencies

npm install

▶️ Run Locally

Start the application:

npm start

If the project is configured to run the server directly:

node server.js

Then open:

http://localhost:3000

🧪 Run Tests

To execute the automated test suite:

npm test

☁️ Deployment

SnapLink is deployed using Render.

Deployment Architecture

                 GitHub Repository
                        │
                        ▼
                     Render
                        │
                        ▼
                 Node.js Server
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          Public UI           SQLite DB
              │                   │
              └─────────┬─────────┘
                        ▼
                   Live Website

Live Deployment

https://snaplink-77hw.onrender.com/

🔐 Security Considerations

For production-scale usage, the following security improvements can be considered:

URL validation

Input sanitization

Rate limiting

Abuse prevention

Malicious URL detection

Open-redirect protection

Alias collision protection

Request logging

HTTPS enforcement

API access controls

Database backup and recovery

📈 Future Enhancements

The following features can be added in future versions:

User authentication

User-specific dashboards

Advanced analytics

Geographic click statistics

Device and browser analytics

Link expiration

Password-protected links

Bulk URL shortening

REST API

API authentication

Custom domains

Link preview

Malicious URL detection

Docker support

CI/CD pipeline

Database backup system

Admin dashboard

🎓 Use Cases

SnapLink can be used for:

📚 Academic projects

💼 Professional presentations

📱 Social media sharing

📄 Reports and documentation

🎯 Marketing campaigns

🧑‍💻 Developer projects

📊 Basic link analytics

🖼️ QR-based information sharing

🌐 Website link management

📊 Project Highlights

Feature

Status

URL Shortening

✅

Custom Aliases

✅

URL Redirection

✅

QR Code Generation

✅

QR Code Download

✅

Click Tracking

✅

Link Search

✅

SQLite Storage

✅

Responsive UI

✅

Automated Tests

✅

Live Deployment

✅

🔄 Example Usage

Step 1 — Enter a URL

https://www.example.com/very/long/url/path

Step 2 — Add an Optional Alias

my-project

Step 3 — Generate

SnapLink creates:

https://snaplink-77hw.onrender.com/my-project

Step 4 — Share

The shortened URL can be:

Copied

Shared

Converted into a QR code

Step 5 — Track

The application records clicks received by the shortened link.

🌐 Live Application

<p align="center">

🚀 Try SnapLink

https://snaplink-77hw.onrender.com/

</p>

🤝 Contributing

Contributions, improvements, and suggestions are welcome.

Contribution Workflow

# Clone the repository
git clone https://github.com/YOUR-USERNAME/link-shortener.git

# Enter the project
cd link-shortener

# Create a feature branch
git checkout -b feature/your-feature

# Install dependencies
npm install

# Make your changes

# Run tests
npm test

# Commit your changes
git add .
git commit -m "Add new feature"

# Push the branch
git push origin feature/your-feature

Then create a Pull Request on GitHub.

📄 License

This project is available for educational and development purposes.

If you are publishing the project publicly, consider adding an appropriate open-source license such as the MIT License.

👨‍💻 Author

Shyambalaji S

Computer Science Engineering Student
Cloud Security & Cybersecurity Enthusiast

GitHub: @shyambalaji27

LinkedIn: Shyambalaji S

<p align="center">
  Built with Node.js, SQLite, HTML, CSS & JavaScript
</p>

<p align="center">
  ⚡ <strong>SnapLink — Shorten. Share. Track.</strong>
</p>
