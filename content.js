/**
 * Shopee Affiliate Product & Image Downloader - Orchestrator & Content Script UI
 * Uses CsvService, StorageService, and ShopeeScraperService from libs/
 * 
 * Author: sodikinnaa
 * License: MIT
 */

(function () {
  'use strict';

  if (window.__SHOPEE_AFFILIATE_DL_INITIALIZED__) return;
  window.__SHOPEE_AFFILIATE_DL_INITIALIZED__ = true;

  let isCancelled = false;
  let isProcessing = false;
  let detectedItems = [];

  // References to Services
  const ScraperService = window.ShopeeScraperService;
  const Storage = window.StorageService;
  const CSV = window.CsvService;

  // In-page Toast Helper
  function showInPageToast(message, isSuccess = true) {
    const existing = document.getElementById('shopee-dl-inpage-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'shopee-dl-inpage-toast';
    toast.className = 'shopee-dl-toast';
    if (!isSuccess) toast.style.borderLeftColor = '#ef4444';
    toast.innerHTML = `<span>${isSuccess ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Create floating trigger button
  function createFloatingTrigger() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFloatingTrigger, { once: true });
      }
      return;
    }

    let btn = document.getElementById('shopee-dl-float-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'shopee-dl-float-btn';
      btn.innerHTML = `<span>📦 Affiliate Tools</span><span class="badge" id="shopee-dl-badge">0</span>`;
      document.body.appendChild(btn);

      btn.addEventListener('click', () => {
        openOrTogglePanel();
      });
    } else if (!document.body.contains(btn)) {
      document.body.appendChild(btn);
    }

    updateDetectedCount();
  }

  function updateDetectedCount() {
    detectedItems = ScraperService ? ScraperService.findProductItems() : [];
    const currentPage = ScraperService ? ScraperService.getCurrentPageNumber() : 1;
    const badge = document.getElementById('shopee-dl-badge');
    if (badge) {
      badge.textContent = `${detectedItems.length}`;
    }
    const countEl = document.getElementById('dl-count-num');
    if (countEl) {
      countEl.textContent = `${detectedItems.length} (Pg. ${currentPage})`;
    }
  }

  // Open or toggle main Downloader Panel
  function openOrTogglePanel() {
    let ui = document.getElementById('shopee-downloader-ui');
    if (ui) {
      ui.remove();
      return;
    }

    detectedItems = ScraperService ? ScraperService.findProductItems() : [];
    const currentPage = ScraperService ? ScraperService.getCurrentPageNumber() : 1;

    ui = document.createElement('div');
    ui.id = 'shopee-downloader-ui';
    ui.innerHTML = `
      <div class="shopee-dl-header">
        <h3 class="shopee-dl-title">
          📦 Shopee <span style="color: #ff7337;">Affiliate Tools</span>
        </h3>
        <div class="shopee-dl-header-actions">
          <button id="dl-refresh-btn" class="shopee-dl-icon-btn" title="Rescan Products">🔄</button>
          <button id="dl-close-btn" class="shopee-dl-icon-btn" title="Close">✕</button>
        </div>
      </div>

      <div class="shopee-dl-stats">
        <span>Products on this page:</span>
        <b id="dl-count-num">${detectedItems.length} (Pg. ${currentPage})</b>
      </div>

      <div class="shopee-dl-progress-track">
        <div id="dl-progress-bar" class="shopee-dl-progress-bar"></div>
      </div>

      <div id="dl-status" class="shopee-dl-status">
        Ready to scrape products, save to Dashboard, or download the ZIP.
      </div>

      <div class="shopee-dl-controls">
        <button id="dl-save-dash-btn" class="shopee-dl-btn-primary">
          💾 Save to Dashboard & CSV (${detectedItems.length})
        </button>

        <button id="dl-start-zip-btn" class="shopee-dl-btn-primary" style="background: linear-gradient(135deg, #3b82f6, #6366f1); margin-top: 6px;">
          ⚡ Generate ZIP & Download Photos
        </button>

        <button id="dl-open-dash-btn" class="shopee-dl-btn-stop" style="display: flex; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: #f1f5f9; margin-top: 6px;">
          📊 Open Products & CSV Dashboard
        </button>

        <button id="dl-stop-btn" class="shopee-dl-btn-stop">
          🛑 Cancel Process
        </button>
      </div>

      <div class="shopee-dl-options">
        <div class="shopee-dl-option-row">
          <span>📄 Pages to scrape:</span>
          <select id="dl-pages-select">
            <option value="1" selected>Current page only (1 page)</option>
            <option value="2">Auto-scrape 2 pages</option>
            <option value="3">Auto-scrape 3 pages</option>
            <option value="5">Auto-scrape 5 pages</option>
            <option value="10">Auto-scrape 10 pages</option>
          </select>
        </div>
        <div class="shopee-dl-option-row">
          <span>⏱️ Delay per product:</span>
          <select id="dl-delay-select">
            <option value="400">Fast (400ms)</option>
            <option value="600" selected>Normal (600ms)</option>
            <option value="1000">Safe (1000ms)</option>
          </select>
        </div>
      </div>
    `;

    document.body.appendChild(ui);

    const saveDashBtn = ui.querySelector('#dl-save-dash-btn');
    const startZipBtn = ui.querySelector('#dl-start-zip-btn');
    const openDashBtn = ui.querySelector('#dl-open-dash-btn');
    const stopBtn = ui.querySelector('#dl-stop-btn');
    const closeBtn = ui.querySelector('#dl-close-btn');
    const refreshBtn = ui.querySelector('#dl-refresh-btn');
    const progressBar = ui.querySelector('#dl-progress-bar');
    const statusText = ui.querySelector('#dl-status');
    const pagesSelect = ui.querySelector('#dl-pages-select');
    const delaySelect = ui.querySelector('#dl-delay-select');

    const setProgressBarPercent = (pct) => {
      if (progressBar) {
        const clamped = Math.min(100, Math.max(0, Math.round(pct)));
        progressBar.style.setProperty('width', `${clamped}%`, 'important');
      }
    };

    refreshBtn.onclick = () => {
      updateDetectedCount();
      const pageNum = ScraperService ? ScraperService.getCurrentPageNumber() : 1;
      statusText.textContent = `Found ${detectedItems.length} products on page ${pageNum}.`;
      setProgressBarPercent(0);
    };

    closeBtn.onclick = () => {
      isCancelled = true;
      ui.remove();
    };

    stopBtn.onclick = () => {
      isCancelled = true;
      statusText.textContent = '🛑 Stopping process...';
      stopBtn.style.display = 'none';
      saveDashBtn.style.display = 'flex';
      startZipBtn.style.display = 'flex';
      openDashBtn.style.display = 'flex';
    };

    openDashBtn.onclick = () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
      }
    };

    // Helper: Scrape all products across selected pages
    async function runScrapeOperation() {
      const maxPages = parseInt(pagesSelect.value, 10) || 1;
      const delayMs = parseInt(delaySelect.value, 10) || 600;
      setProgressBarPercent(5);

      return await ScraperService.scrapeAcrossPages({
        maxPages,
        delayMs,
        isCancelled: () => isCancelled,
        onProgress: (info) => {
          if (info.phase === 'page_start') {
            statusText.textContent = `📄 Processing page ${info.pageNum} (${info.pageItemCount} products)...`;
          } else if (info.phase === 'item_start') {
            const titleCut = (info.product.safeTitle || info.product.title || '').substring(0, 15);
            statusText.textContent = `[Pg ${info.pageNum} | Item ${info.itemIndex}/${info.pageItemCount}] Getting link: ${titleCut}...`;
          } else if (info.phase === 'item_complete') {
            const totalTarget = Math.max(1, maxPages * info.pageItemCount);
            const pct = Math.min(85, Math.round((info.totalProcessed / totalTarget) * 85));
            setProgressBarPercent(pct);
          } else if (info.phase === 'switching_page') {
            statusText.textContent = `➡️ Auto-moving to page ${info.nextPageNum}...`;
          } else if (info.phase === 'switch_failed') {
            statusText.textContent = `⚠️ Next page unavailable or failed to load.`;
          }
        }
      });
    }

    // 1. ACTION: SAVE TO DASHBOARD
    saveDashBtn.onclick = async () => {
      if (isProcessing) return;

      detectedItems = ScraperService ? ScraperService.findProductItems() : [];
      if (detectedItems.length === 0) {
        alert('⚠️ No Shopee products found on this page. Open the affiliate offer page.');
        return;
      }

      isProcessing = true;
      isCancelled = false;
      setProgressBarPercent(0);

      saveDashBtn.style.display = 'none';
      startZipBtn.style.display = 'none';
      openDashBtn.style.display = 'none';
      stopBtn.style.display = 'flex';

      try {
        const scraped = await runScrapeOperation();

        if (scraped.length > 0 && !isCancelled) {
          statusText.textContent = '💾 Saving products to Dashboard...';
          setProgressBarPercent(92);

          if (Storage) {
            const result = await Storage.mergeProducts(scraped);
            statusText.textContent = `🎉 Success! ${scraped.length} products saved to Dashboard (${result.addedCount} new).`;
          } else {
            // Fallback direct storage
            await new Promise((resolve) => {
              if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['shopee_products'], (store) => {
                  const current = Array.isArray(store.shopee_products) ? store.shopee_products : [];
                  const existingMap = new Set(current.map(p => p.title || p.rawTitle));
                  const uniqueNew = scraped.filter(p => !existingMap.has(p.title));
                  const merged = [...current, ...uniqueNew];
                  chrome.storage.local.set({ shopee_products: merged }, () => resolve(merged));
                });
              } else {
                resolve(scraped);
              }
            });
            statusText.textContent = `🎉 Success! ${scraped.length} products saved to Dashboard.`;
          }

          setProgressBarPercent(100);
          showInPageToast(`💾 ${scraped.length} products saved to Dashboard!`);
        } else if (isCancelled) {
          statusText.textContent = `🛑 Process stopped (${scraped.length} products processed).`;
        }
      } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Extension context invalidated')) {
          statusText.textContent = `⚠️ The extension was just updated. Please refresh (F5) this page.`;
          alert('⚠️ The extension was just reloaded. Please refresh (F5) this Shopee page so the extension can reconnect.');
        } else {
          statusText.textContent = `❌ Error: ${err.message}`;
        }
      }

      isProcessing = false;
      stopBtn.style.display = 'none';
      saveDashBtn.style.display = 'flex';
      startZipBtn.style.display = 'flex';
      openDashBtn.style.display = 'flex';
    };

    // 2. ACTION: GENERATE ZIP & DOWNLOAD
    startZipBtn.onclick = async () => {
      if (isProcessing) return;

      detectedItems = ScraperService ? ScraperService.findProductItems() : [];
      if (detectedItems.length === 0) {
        alert('⚠️ No Shopee products found on this page. Open the affiliate offer page.');
        return;
      }

      isProcessing = true;
      isCancelled = false;
      setProgressBarPercent(0);

      saveDashBtn.style.display = 'none';
      startZipBtn.style.display = 'none';
      openDashBtn.style.display = 'none';
      stopBtn.style.display = 'flex';

      try {
        const scraped = await runScrapeOperation();

        if (scraped.length > 0 && !isCancelled) {
          statusText.textContent = '📦 Compiling photos & files into ZIP...';

          if (CSV) {
            await CSV.downloadZIP(scraped, {
              isCancelled: () => isCancelled,
              onProgress: (curr, total) => {
                const zipPct = 85 + Math.round((curr / Math.max(1, total)) * 15);
                setProgressBarPercent(zipPct);
                statusText.textContent = `📦 Compressing images [${curr}/${total}]...`;
              }
            });
          }

          setProgressBarPercent(100);
          statusText.textContent = `🎉 Done! ${scraped.length} products saved in ZIP.`;
          showInPageToast(`ZIP file downloaded successfully (${scraped.length} products).`);
        }
      } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Extension context invalidated')) {
          statusText.textContent = `⚠️ The extension was just updated. Please refresh (F5) this page.`;
          alert('⚠️ The extension was just reloaded. Please refresh (F5) this Shopee page so the extension can reconnect.');
        } else {
          statusText.textContent = `❌ Error: ${err.message}`;
        }
      }

      isProcessing = false;
      stopBtn.style.display = 'none';
      saveDashBtn.style.display = 'flex';
      startZipBtn.style.display = 'flex';
      openDashBtn.style.display = 'flex';
    };
  }

  // Setup periodic scanner & DOM observer for dynamically rendered products
  createFloatingTrigger();
  setInterval(() => {
    createFloatingTrigger();
    updateDetectedCount();
  }, 2000);

  // Listen for messages from popup.js
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'GET_STATUS') {
        const items = ScraperService ? ScraperService.findProductItems() : [];
        sendResponse({
          detectedCount: items.length,
          isDownloading: isProcessing,
          url: window.location.href
        });
      } else if (request.action === 'OPEN_PANEL') {
        openOrTogglePanel();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  console.log('📦 [ShopeeAffiliateDL] Content script is ready on Shopee (Modular Architecture)!');
})();
