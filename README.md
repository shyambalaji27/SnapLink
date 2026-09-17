# ⚡ SnapLink — Fast Link Reducer & URL Shortener

> A lightweight and modern URL shortening application that converts long URLs into clean, shareable links with custom aliases, QR code generation, click tracking, and persistent storage.

<p align="center">
  <a href="https://snaplink-77hw.onrender.com/">
    <strong>🚀 Live Demo</strong>
  </a>
</p>

---

## 📌 Overview

**SnapLink** is a web-based URL shortening application designed to make long and complex URLs shorter, cleaner, and easier to share.

Users can enter a long URL, optionally create a custom alias, generate a short link, generate a QR code, and track the number of clicks received by each shortened URL.

The project uses a lightweight **Node.js HTTP server** with **SQLite** for persistent link storage.

---

## 🌐 Live Demo

🚀 **Live Application:**  
https://snaplink-77hw.onrender.com/

---

## ✨ Features

- 🔗 **URL Shortening** — Convert long URLs into short, shareable links.
- ⚡ **Instant Redirection** — Redirect users from short URLs to their original destinations.
- 🎯 **Custom Aliases** — Create personalized short-link endings.
- 📱 **QR Code Generation** — Generate QR codes for shortened URLs.
- 📥 **QR Code Download** — Download generated QR codes as SVG.
- 📊 **Click Tracking** — Track the number of visits to shortened URLs.
- 🔎 **Link Search** — Search through generated links and aliases.
- 📋 **Copy Short Link** — Quickly copy shortened URLs.
- 💾 **Persistent Storage** — Store link information in SQLite.
- 🧪 **Automated Testing** — Includes a test suite for application functionality.
- 📱 **Responsive UI** — Designed to work across desktop and mobile devices.
- 🪶 **Lightweight Backend** — Uses Node.js without requiring a heavy backend framework.

---

## 🖥️ Application Workflow

```text
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
