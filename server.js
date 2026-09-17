const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const RESERVED_SLUGS = new Set([
  'api',
  'public',
  'static',
  'favicon.ico',
  'style.css',
  'app.js',
  'qr.js',
  'index.html',
  'health',
  'robots.txt'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Generates a base62-style 6 character random slug
function generateRandomSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Validates URL format
function isValidUrl(string) {
  try {
    const parsed = new URL(string);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Parses JSON body from request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      // Limit to 1MB
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendNotFoundHtml(res, slug) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Not Found - SnapLink</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 40px 32px;
      border-radius: 16px;
      border: 1px solid #334155;
      max-width: 460px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 { font-size: 3.5rem; margin: 0 0 10px; color: #f43f5e; }
    h2 { font-size: 1.5rem; margin: 0 0 12px; }
    p { color: #94a3b8; font-size: 1rem; line-height: 1.5; margin-bottom: 24px; }
    .code { font-family: monospace; background: #0f172a; padding: 2px 8px; border-radius: 6px; color: #38bdf8; }
    a.btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      transition: transform 0.15s, opacity 0.15s;
    }
    a.btn:hover { opacity: 0.9; transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <h1>404</h1>
    <h2>Link Not Found</h2>
    <p>The shortened link <span class="code">/${slug ? escapeHtml(slug) : ''}</span> doesn't exist or was removed.</p>
    <a href="/" class="btn">Return to SnapLink</a>
  </div>
</body>
</html>`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBaseUrl(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
}

function serveStaticFile(req, res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function requestHandler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/shorten' && method === 'POST') {
    parseJsonBody(req)
      .then(body => {
        let { url, customSlug } = body;

        if (!url || typeof url !== 'string') {
          return sendJson(res, 400, { error: 'Please provide a valid URL to shorten.' });
        }

        url = url.trim();
        // Prepend https:// if user omitted protocol
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }

        if (!isValidUrl(url)) {
          return sendJson(res, 400, { error: 'The provided URL is invalid. It must be a valid http or https web address.' });
        }

        let slug = '';
        if (customSlug && typeof customSlug === 'string') {
          slug = customSlug.trim();
          // Validation: letters, numbers, dashes, underscores, length 2 to 30
          if (!/^[a-zA-Z0-9-_]{2,30}$/.test(slug)) {
            return sendJson(res, 400, {
              error: 'Custom alias must be 2 to 30 characters and can only contain letters, numbers, hyphens, and underscores.'
            });
          }

          if (RESERVED_SLUGS.has(slug.toLowerCase())) {
            return sendJson(res, 400, { error: `The custom alias "${slug}" is reserved. Please choose another.` });
          }

          if (!db.isSlugAvailable(slug)) {
            return sendJson(res, 409, { error: `The alias "${slug}" is already in use. Please pick a different one.` });
          }
        } else {
          // Generate unique random slug
          let attempts = 0;
          do {
            slug = generateRandomSlug(6);
            attempts++;
          } while (!db.isSlugAvailable(slug) && attempts < 10);

          if (!db.isSlugAvailable(slug)) {
            return sendJson(res, 500, { error: 'Could not generate a unique link slug. Please try again.' });
          }
        }

        const link = db.createLink({ slug, originalUrl: url });
        const baseUrl = getBaseUrl(req);

        return sendJson(res, 201, {
          success: true,
          link: {
            ...link,
            shortUrl: `${baseUrl}/${link.slug}`
          }
        });
      })
      .catch(err => {
        sendJson(res, 400, { error: err.message || 'Failed to process request' });
      });
    return;
  }

  if (pathname === '/api/links' && method === 'GET') {
    try {
      const baseUrl = getBaseUrl(req);
      const links = db.getAllLinks().map(link => ({
        ...link,
        shortUrl: `${baseUrl}/${link.slug}`
      }));
      return sendJson(res, 200, { success: true, links });
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to retrieve links: ' + err.message });
    }
  }

  if (pathname.startsWith('/api/info/') && method === 'GET') {
    const slug = pathname.slice('/api/info/'.length).trim();
    const link = db.getLinkBySlug(slug);
    if (!link) {
      return sendJson(res, 404, { error: 'Short link not found' });
    }
    const baseUrl = getBaseUrl(req);
    return sendJson(res, 200, {
      success: true,
      link: {
        ...link,
        shortUrl: `${baseUrl}/${link.slug}`
      }
    });
  }

  if (pathname.startsWith('/api/links/') && method === 'DELETE') {
    const slug = pathname.slice('/api/links/'.length).trim();
    const deleted = db.deleteLink(slug);
    if (!deleted) {
      return sendJson(res, 404, { error: 'Link not found or already deleted' });
    }
    return sendJson(res, 200, { success: true, message: 'Link deleted successfully' });
  }

  // Static Assets Serving
  if (method === 'GET') {
    if (pathname === '/' || pathname === '/index.html') {
      return serveStaticFile(req, res, path.join(PUBLIC_DIR, 'index.html'));
    }
    if (pathname === '/style.css') {
      return serveStaticFile(req, res, path.join(PUBLIC_DIR, 'style.css'));
    }
    if (pathname === '/app.js') {
      return serveStaticFile(req, res, path.join(PUBLIC_DIR, 'app.js'));
    }
    if (pathname === '/qr.js') {
      return serveStaticFile(req, res, path.join(PUBLIC_DIR, 'qr.js'));
    }

    // Check if pathname matches a shortened slug (e.g. /my-link or /aB39x)
    const potentialSlug = pathname.slice(1);
    if (potentialSlug && !potentialSlug.includes('/') && !RESERVED_SLUGS.has(potentialSlug.toLowerCase())) {
      const link = db.getLinkBySlug(potentialSlug);
      if (link) {
        db.incrementClicks(potentialSlug);
        res.writeHead(302, {
          'Location': link.original_url,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end();
        return;
      } else {
        // Redirection failed because slug not found
        return sendNotFoundHtml(res, potentialSlug);
      }
    }
  }

  // Default 404
  sendNotFoundHtml(res, pathname.slice(1));
}

function createServer() {
  db.initDb();
  return http.createServer(requestHandler);
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`\n🚀 SnapLink (URL Shortener) server running at http://localhost:${PORT}`);
    console.log(`📊 Local SQLite database initialized.\n`);
  });
}

module.exports = {
  createServer,
  requestHandler
};
