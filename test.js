const assert = require('node:assert');
const http = require('node:http');
const db = require('./db.js');
const { createServer } = require('./server.js');

// Initialize in-memory database for testing
db.initDb(':memory:');

const server = createServer();

// Start on ephemeral port
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`\n🧪 Running SnapLink Automated Test Suite on ${baseUrl}...\n`);

  try {
    // Test 1: Static index.html serve
    console.log('Test 1: Serving static index.html');
    const homeRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(homeRes.status, 200);
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes('SnapLink'));
    assert.ok(homeHtml.includes('shortenForm'));
    console.log('  ✔ Static index.html served successfully');

    // Test 2: Shorten URL with random slug
    console.log('Test 2: POST /api/shorten (auto-generated slug)');
    const shortenRes = await fetch(`${baseUrl}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/very/long/path?param=1&query=test' })
    });
    assert.strictEqual(shortenRes.status, 201);
    const shortenData = await shortenRes.json();
    assert.strictEqual(shortenData.success, true);
    assert.ok(shortenData.link.slug);
    assert.strictEqual(shortenData.link.original_url, 'https://example.com/very/long/path?param=1&query=test');
    assert.strictEqual(shortenData.link.clicks, 0);
    const generatedSlug = shortenData.link.slug;
    console.log(`  ✔ Auto-generated slug: ${generatedSlug}`);

    // Test 3: Shorten URL with custom slug
    console.log('Test 3: POST /api/shorten (custom slug)');
    const customRes = await fetch(`${baseUrl}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://google.com', customSlug: 'my-custom-link' })
    });
    assert.strictEqual(customRes.status, 201);
    const customData = await customRes.json();
    assert.strictEqual(customData.link.slug, 'my-custom-link');
    console.log('  ✔ Custom slug created successfully');

    // Test 4: Conflict on duplicate custom slug
    console.log('Test 4: Duplicate custom slug conflict handling');
    const duplicateRes = await fetch(`${baseUrl}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://other.com', customSlug: 'my-custom-link' })
    });
    assert.strictEqual(duplicateRes.status, 409);
    const duplicateData = await duplicateRes.json();
    assert.ok(duplicateData.error.includes('already in use'));
    console.log('  ✔ Duplicate slug rejected with 409 Conflict');

    // Test 5: Redirection & Click count increment
    console.log('Test 5: GET /:slug redirection and click tracking');
    // Using manual http request so we don't automatically follow redirect
    const redirectStatus = await new Promise((resolve, reject) => {
      http.get(`${baseUrl}/${generatedSlug}`, (res) => {
        resolve({
          status: res.statusCode,
          location: res.headers.location
        });
      }).on('error', reject);
    });

    assert.strictEqual(redirectStatus.status, 302);
    assert.strictEqual(redirectStatus.location, 'https://example.com/very/long/path?param=1&query=test');
    
    // Check click counter incremented
    const infoRes = await fetch(`${baseUrl}/api/info/${generatedSlug}`);
    const infoData = await infoRes.json();
    assert.strictEqual(infoData.link.clicks, 1);
    assert.ok(infoData.link.last_clicked_at);
    console.log('  ✔ 302 Redirection verified and click count incremented to 1');

    // Test 6: GET /api/links list
    console.log('Test 6: GET /api/links');
    const listRes = await fetch(`${baseUrl}/api/links`);
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listData.success, true);
    assert.strictEqual(listData.links.length, 2);
    console.log(`  ✔ Retrieved list of ${listData.links.length} links`);

    // Test 7: DELETE /api/links/:slug
    console.log('Test 7: DELETE /api/links/:slug');
    const deleteRes = await fetch(`${baseUrl}/api/links/my-custom-link`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteData.success, true);

    const recheckRes = await fetch(`${baseUrl}/api/info/my-custom-link`);
    assert.strictEqual(recheckRes.status, 404);
    console.log('  ✔ Link deleted and verified 404');

    // Test 8: 404 on nonexistent slug
    console.log('Test 8: Friendly 404 page on unknown slug');
    const notFoundRes = await fetch(`${baseUrl}/nonexistent-link-12345`);
    assert.strictEqual(notFoundRes.status, 404);
    const notFoundHtml = await notFoundRes.text();
    assert.ok(notFoundHtml.includes('Link Not Found'));
    console.log('  ✔ Friendly 404 page rendered');

    console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
