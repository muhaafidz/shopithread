/**
 * Test Suite for ShopiThread Popup (structure & wiring)
 * The popup is browser-only (chrome.* + DOM), so we verify markup & handlers statically.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing popup/popup.js & popup/popup.html...');

// 1. popup.html structure
console.log('\n1. Testing popup.html Structure:');
const htmlContent = fs.readFileSync(path.join(__dirname, 'popup/popup.html'), 'utf8');

assert(htmlContent.includes('id="status-dot"'), 'popup.html should have #status-dot');
assert(htmlContent.includes('id="status-text"'), 'popup.html should have #status-text');
assert(htmlContent.includes('id="product-count"'), 'popup.html should have #product-count');
assert(htmlContent.includes('id="db-count"'), 'popup.html should have #db-count');
assert(htmlContent.includes('id="open-dashboard-btn"'), 'popup.html should have #open-dashboard-btn');
assert(htmlContent.includes('id="open-panel-btn"'), 'popup.html should have #open-panel-btn');
assert(htmlContent.includes('id="open-shopee-btn"'), 'popup.html should have #open-shopee-btn');
assert(htmlContent.includes('lang="en"'), 'popup.html should declare English interface');
assert(!htmlContent.includes('lang="id"'), 'popup.html should not use Indonesian locale');
console.log('  ✅ popup.html structure verified successfully!');

// 2. popup.js wiring
console.log('\n2. Testing popup.js Wiring:');
const jsContent = fs.readFileSync(path.join(__dirname, 'popup/popup.js'), 'utf8');

assert(jsContent.includes("chrome.tabs.create"), 'popup.js should open the dashboard via chrome.tabs');
assert(jsContent.includes("dashboard/dashboard.html"), 'popup.js should point to the dashboard page');
assert(jsContent.includes('shopee.com.my'), 'popup.js should detect Shopee Malaysia domain');
assert(jsContent.includes('affiliate.shopee.com.my/offer/product_offer'), 'popup.js should open the Shopee MY affiliate portal');
assert(jsContent.includes('GET_STATUS'), 'popup.js should request status from the content script');
assert(jsContent.includes('OPEN_PANEL'), 'popup.js should trigger the scraper panel');
assert(!jsContent.includes('shopee.co.id'), 'popup.js should not reference the .co.id domain');
console.log('  ✅ popup.js wiring verified successfully!');

// 3. English interface copy
console.log('\n3. Testing Popup Interface Copy (English):');
assert(htmlContent.includes('Open Products & CSV Dashboard'), 'popup.html should show English dashboard button');
assert(htmlContent.includes('Open Shopee Scraper Panel'), 'popup.html should show English scraper button');
assert(htmlContent.includes('Checking page...'), 'popup.html should show English status text');
console.log('  ✅ Popup interface copy verified successfully!');

console.log('\n===============================================================');
console.log('🎉 ALL POPUP TESTS PASSED WITH 100% SUCCESS!');
console.log('===============================================================');
