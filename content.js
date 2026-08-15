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
      countEl.textContent = `${detectedItems.length} (Hal. ${currentPage})`;
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
          <button id="dl-refresh-btn" class="shopee-dl-icon-btn" title="Scan Ulang Produk">🔄</button>
          <button id="dl-close-btn" class="shopee-dl-icon-btn" title="Tutup">✕</button>
        </div>
      </div>
      
      <div class="shopee-dl-stats">
        <span>Produk di Halaman Ini:</span>
        <b id="dl-count-num">${detectedItems.length} (Hal. ${currentPage})</b>
      </div>

      <div class="shopee-dl-progress-track">
        <div id="dl-progress-bar" class="shopee-dl-progress-bar"></div>
      </div>

      <div id="dl-status" class="shopee-dl-status">
        Siap scrape produk, simpan ke Dashboard, atau download ZIP.
      </div>

      <div class="shopee-dl-controls">
        <button id="dl-save-dash-btn" class="shopee-dl-btn-primary">
          💾 Simpan ke Dashboard & CSV (${detectedItems.length})
        </button>

        <button id="dl-start-zip-btn" class="shopee-dl-btn-primary" style="background: linear-gradient(135deg, #3b82f6, #6366f1); margin-top: 6px;">
          ⚡ Generate ZIP & Download Foto
        </button>

        <button id="dl-open-dash-btn" class="shopee-dl-btn-stop" style="display: flex; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: #f1f5f9; margin-top: 6px;">
          📊 Buka Dashboard Produk & CSV
        </button>

        <button id="dl-stop-btn" class="shopee-dl-btn-stop">
          🛑 Batalkan Proses
        </button>
      </div>

      <div class="shopee-dl-options">
        <div class="shopee-dl-option-row">
          <span>📄 Target Scraping Halaman:</span>
          <select id="dl-pages-select">
            <option value="1" selected>Halaman Saat Ini Saja (1 Hal)</option>
            <option value="2">Scrape 2 Halaman Otomatis</option>
            <option value="3">Scrape 3 Halaman Otomatis</option>
            <option value="5">Scrape 5 Halaman Otomatis</option>
            <option value="10">Scrape 10 Halaman Otomatis</option>
          </select>
        </div>
        <div class="shopee-dl-option-row">
          <span>⏱️ Jeda Scraping per Produk:</span>
          <select id="dl-delay-select">
            <option value="400">Cepat (400ms)</option>
            <option value="600" selected>Normal (600ms)</option>
            <option value="1000">Aman (1000ms)</option>
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
      statusText.textContent = `Ditemukan ${detectedItems.length} produk di halaman ${pageNum}.`;
      setProgressBarPercent(0);
    };

    closeBtn.onclick = () => {
      isCancelled = true;
      ui.remove();
    };

    stopBtn.onclick = () => {
      isCancelled = true;
      statusText.textContent = '🛑 Menghentikan proses...';
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
            statusText.textContent = `📄 Memproses Halaman ${info.pageNum} (${info.pageItemCount} produk)...`;
          } else if (info.phase === 'item_start') {
            const titleCut = (info.product.safeTitle || info.product.title || '').substring(0, 15);
            statusText.textContent = `[Hal ${info.pageNum} | Item ${info.itemIndex}/${info.pageItemCount}] Ambil link: ${titleCut}...`;
          } else if (info.phase === 'item_complete') {
            const totalTarget = Math.max(1, maxPages * info.pageItemCount);
            const pct = Math.min(85, Math.round((info.totalProcessed / totalTarget) * 85));
            setProgressBarPercent(pct);
          } else if (info.phase === 'switching_page') {
            statusText.textContent = `➡️ Berpindah otomatis ke Halaman ${info.nextPageNum}...`;
          } else if (info.phase === 'switch_failed') {
            statusText.textContent = `⚠️ Halaman berikutnya tidak tersedia atau gagal dimuat.`;
          }
        }
      });
    }

    // 1. ACTION: SAVE TO DASHBOARD
    saveDashBtn.onclick = async () => {
      if (isProcessing) return;

      detectedItems = ScraperService ? ScraperService.findProductItems() : [];
      if (detectedItems.length === 0) {
        alert('⚠️ Tidak ditemukan produk Shopee di halaman ini. Buka halaman penawaran affiliate.');
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
          statusText.textContent = '💾 Menyimpan data produk ke Dashboard...';
          setProgressBarPercent(92);

          if (Storage) {
            const result = await Storage.mergeProducts(scraped);
            statusText.textContent = `🎉 Sukses! ${scraped.length} produk disimpan ke Dashboard (${result.addedCount} baru).`;
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
            statusText.textContent = `🎉 Sukses! ${scraped.length} produk disimpan ke Dashboard.`;
          }

          setProgressBarPercent(100);
          showInPageToast(`💾 ${scraped.length} produk berhasil disimpan ke Dashboard!`);
        } else if (isCancelled) {
          statusText.textContent = `🛑 Proses dihentikan (${scraped.length} produk diproses).`;
        }
      } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Extension context invalidated')) {
          statusText.textContent = `⚠️ Ekstensi baru saja diperbarui. Silakan refresh (F5) halaman ini.`;
          alert('⚠️ Ekstensi baru saja di-reload. Silakan muat ulang / refresh (F5) halaman Shopee ini agar ekstensi terhubung kembali.');
        } else {
          statusText.textContent = `❌ Terjadi kesalahan: ${err.message}`;
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
        alert('⚠️ Tidak ditemukan produk Shopee di halaman ini. Buka halaman penawaran affiliate.');
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
          statusText.textContent = '📦 Mengompilasi foto & file ke dalam ZIP...';

          if (CSV) {
            await CSV.downloadZIP(scraped, {
              isCancelled: () => isCancelled,
              onProgress: (curr, total) => {
                const zipPct = 85 + Math.round((curr / Math.max(1, total)) * 15);
                setProgressBarPercent(zipPct);
                statusText.textContent = `📦 Mengompres gambar [${curr}/${total}]...`;
              }
            });
          }

          setProgressBarPercent(100);
          statusText.textContent = `🎉 Selesai! ${scraped.length} produk tersimpan di ZIP.`;
          showInPageToast(`File ZIP berhasil diunduh (${scraped.length} produk).`);
        }
      } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('Extension context invalidated')) {
          statusText.textContent = `⚠️ Ekstensi baru saja diperbarui. Silakan refresh (F5) halaman ini.`;
          alert('⚠️ Ekstensi baru saja di-reload. Silakan muat ulang / refresh (F5) halaman Shopee ini agar ekstensi terhubung kembali.');
        } else {
          statusText.textContent = `❌ Terjadi kesalahan: ${err.message}`;
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

  console.log('📦 [ShopeeAffiliateDL] Content script siap digunakan di Shopee (Modular Architecture)!');
})();
