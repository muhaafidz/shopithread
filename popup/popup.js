document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const productCount = document.getElementById('product-count');
  const dbCount = document.getElementById('db-count');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  const openPanelBtn = document.getElementById('open-panel-btn');
  const openShopeeBtn = document.getElementById('open-shopee-btn');

  // Load database count
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['shopee_products', 'threads_queue'], (store) => {
      const list = store.shopee_products || store.threads_queue || [];
      if (dbCount) dbCount.textContent = list.length;
    });
  }

  // Open Dashboard Button Handler
  if (openDashboardBtn) {
    openDashboardBtn.onclick = () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
      window.close();
    };
  }

  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    statusText.textContent = 'Unable to detect the current tab.';
    return;
  }

  const isShopee = tab.url.includes('shopee.com.my') || tab.url.includes('affiliate.shopee.com.my');

  if (!isShopee) {
    statusDot.className = 'dot warning';
    statusText.textContent = 'Open the Shopee / Affiliate portal';
    productCount.textContent = '-';
    openPanelBtn.style.display = 'none';
    openShopeeBtn.style.display = 'block';

    openShopeeBtn.onclick = () => {
      chrome.tabs.create({ url: 'https://affiliate.shopee.com.my/offer/product_offer' });
    };
    return;
  }

  // Ask content script for current status
  chrome.tabs.sendMessage(tab.id, { action: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      statusDot.className = 'dot warning';
      statusText.textContent = 'Shopee page open (Refresh if not active)';
      productCount.textContent = '0';
      return;
    }

    statusDot.className = 'dot active';
    statusText.textContent = 'Ready on Shopee';
    productCount.textContent = response.detectedCount || 0;
  });

  if (openPanelBtn) {
    openPanelBtn.addEventListener('click', () => {
      chrome.tabs.sendMessage(tab.id, { action: 'OPEN_PANEL' }, () => {
        window.close();
      });
    });
  }
});
