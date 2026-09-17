# ⚡ SnapLink — Link Reducer & URL Shortener

[![GitHub Repo](https://img.shields.io/badge/GitHub-shyambalaji27%2FSnapLink-blue?logo=github)](https://github.com/shyambalaji27/SnapLink)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-green.svg)](https://nodejs.org/)

🔗 **GitHub Repository**: [https://github.com/shyambalaji27/SnapLink](https://github.com/shyambalaji27/SnapLink)  
👤 **Author**: [Shyambalaji S (@shyambalaji27)](https://github.com/shyambalaji27)

A high-performance, modern link reducer website built with **100% native Node.js** (`node:http`, `node:sqlite`, `node:crypto`). It requires **zero external npm packages**, stores data locally in SQLite with WAL mode, generates instant vector QR codes, and tracks real-time click statistics.

---

## ✨ Features

- **Link Reduction**: Shortens any long URL into a 6-character short link or a custom alias of your choice.
- **Instant Redirection**: `GET /:slug` performs an immediate `302 Found` redirect to the destination URL while atomically incrementing click counters and updating timestamps.
- **Real-Time Analytics & Dashboard**:
  - Live click counter for every link.
  - Search and filter across links and custom slugs.
  - Creation date tracking.
  - One-click deletion.
- **Built-in QR Code Generator**: Generates crisp, downloadable vector SVG QR codes directly in the browser with zero external CDN dependencies.
- **One-Click Clipboard Copy**: Smooth visual feedback and toast notifications.
- **Sleek, Responsive UI**:
  - Dark mode and Light mode with theme persistence.
  - Glassmorphic card styling, gradient accents, and responsive layout for mobile and desktop.
- **Zero-Dependency Architecture**:
  - Powered by native `node:sqlite` (SQLite 3 with WAL journal mode).
  - No `node_modules` or npm dependencies required.

---

## 🚀 Getting Started

### 1. Start the Server

Run the server using Antigravity's bundled Node.js runtime:

```bash
agy-node server.js
```

The server will start at:
👉 **[http://localhost:3000](http://localhost:3000)**

*(You can customize the port by setting the `PORT` environment variable, e.g., `PORT=8080 agy-node server.js`)*

---

### 2. Run the Automated Test Suite

To run the built-in test suite (tests routing, auto-generated slugs, custom aliases, conflict handling, 302 redirects, click analytics, and deletion):

```bash
agy-node test.js
```

---

## 🌐 Free Cloud Hosting & Deployment

You can host **SnapLink** online for free using any of the following platforms:

### 1. Deploy on [Render.com](https://render.com) (Recommended)
1. Sign in to [Render](https://render.com) with GitHub.
2. Click **New +** → **Web Service** → select **[shyambalaji27/SnapLink](https://github.com/shyambalaji27/SnapLink)**.
3. Settings:
   - **Start Command**: `node server.js`
   - **Build Command**: `echo 'Ready'`
   - **Instance Type**: `Free`
4. Add Environment Variable:
   - `NODE_VERSION`: `22`
5. Click **Deploy Web Service** to receive your public HTTPS link (e.g., `https://snaplink.onrender.com`).

### 2. Deploy on [Railway.app](https://railway.com) (Persistent SQLite)
1. Sign in to [Railway](https://railway.com) with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → select **[shyambalaji27/SnapLink](https://github.com/shyambalaji27/SnapLink)**.
3. Under **Settings** → **Networking**, click **Generate Domain** to get your public URL.
4. *(Optional)* Add a Volume mounted at `/app/data` to persist your SQLite database across restarts.

---

## 🔌 REST API Reference

### 1. Shorten a URL
- **Endpoint**: `POST /api/shorten`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "url": "https://example.com/very/long/article?ref=social&utm_source=twitter",
    "customSlug": "my-custom-slug" // Optional
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "link": {
      "id": 1,
      "slug": "my-custom-slug",
      "original_url": "https://example.com/very/long/article?ref=social&utm_source=twitter",
      "clicks": 0,
      "created_at": "2026-09-17T15:30:00.000Z",
      "last_clicked_at": null,
      "shortUrl": "http://localhost:3000/my-custom-slug"
    }
  }
  ```

### 2. List All Shortened Links
- **Endpoint**: `GET /api/links`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "links": [ ... ]
  }
  ```

### 3. Get Link Details
- **Endpoint**: `GET /api/info/:slug`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "link": {
      "id": 1,
      "slug": "my-custom-slug",
      "original_url": "https://example.com",
      "clicks": 14,
      "created_at": "2026-09-17T15:30:00.000Z",
      "last_clicked_at": "2026-09-17T15:45:12.000Z",
      "shortUrl": "http://localhost:3000/my-custom-slug"
    }
  }
  ```

### 4. Delete a Shortened Link
- **Endpoint**: `DELETE /api/links/:slug`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Link deleted successfully"
  }
  ```

### 5. Redirect
- **Endpoint**: `GET /:slug`
- **Response**: `302 Found` with `Location: <original_url>` header.

---

## 📁 Project Structure

```
link-shortener/
├── db.js              # SQLite database manager using node:sqlite
├── server.js          # HTTP server, routing, API endpoints, redirection
├── test.js            # Automated test suite
├── package.json       # Project configuration
├── README.md          # Project documentation
├── data/
│   └── links.db       # Persistent SQLite database
└── public/
    ├── index.html     # Responsive web UI
    ├── style.css      # Modern design system & styles
    ├── app.js         # Client-side controller & toast alerts
    └── qr.js          # Standalone client-side QR SVG generator
```
