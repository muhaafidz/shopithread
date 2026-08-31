/**
 * Shopee Affiliate Downloader & CSV Dashboard
 * Background Service Worker — Clean Architecture (Manifest V3)
 *
 * Central message router for Dashboard, Popup, Poster Panel, and content scripts.
 *
 * @license MIT
 */

'use strict';

// Load shared services into the service worker (classic SW: importScripts is available)
try {
  importScripts('libs/storage-service.js');
} catch (_) {}
const Storage = (typeof self !== 'undefined' && self.StorageService) || null;

const QUEUE_ALARM_NAME = 'THREADS_QUEUE_POSTER';

/**
 * Injected helper into Threads tab to find composer, focus, and paste caption
 * STRICTLY MANUAL ASSISTED: NEVER CLICKS SUBMIT / POST.
 */
function fillThreadsComposerSafe(captionText) {
  try {
    // 1. Try to find open contenteditable element
    let editor = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                 document.querySelector('[contenteditable="true"]');

    // 2. If not found, try clicking the "Start a thread..." or "+" button
    if (!editor) {
      const composeBtn = document.querySelector('svg[aria-label="Create"]') ||
                         document.querySelector('svg[aria-label="Buat"]') ||
                         document.querySelector('[aria-label="New thread"]') ||
                         document.querySelector('[aria-label="Utas baru"]');
      if (composeBtn) {
        const clickable = composeBtn.closest('button') || composeBtn.closest('div[role="button"]') || composeBtn.parentElement;
        if (clickable) clickable.click();
      }
    }

    setTimeout(() => {
      editor = document.querySelector('[contenteditable="true"][role="textbox"]') ||
               document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.focus();
        // Insert text safely via execCommand or DataTransfer
        const success = document.execCommand('insertText', false, captionText);
        if (!success) {
          editor.innerText = captionText;
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 500);
  } catch (e) {
    console.warn('[ThreadsHelper] Fill composer safe notice:', e);
  }
}

// ===========================================================================
// Storage helpers (callback adapter)
// ===========================================================================
async function readStorageKey(key, fallback = []) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([key], (store) => {
        const val = store && store[key];
        resolve(Array.isArray(val) ? val : (val && typeof val === 'object' ? val : fallback));
      });
    } catch (_) {
      resolve(fallback);
    }
  });
}

async function writeStorageKey(pairs) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(pairs, () => resolve(true));
    } catch (_) {
      resolve(false);
    }
  });
}

// ===========================================================================
// Poster Panel queue ingestion (threads_queue)
// ===========================================================================
async function appendToThreadsQueue(newItems) {
  const items = Array.isArray(newItems) ? newItems : [];
  if (items.length === 0) return { added: 0, total: 0 };

  const existing = await readStorageKey('threads_queue', []);

  const seen = new Set(existing.map(q =>
    `id:${q.productId || q.product_id || q.shopeeId || ''}`.toLowerCase() + '|' +
    `t:${(q.title || q.rawTitle || '').trim().toLowerCase()}`
  ));

  const nowIso = new Date().toISOString();
  const toAdd = [];
  items.forEach((p, idx) => {
    const productId = String(p.productId || p.product_id || p.shopeeId || p.id || `q_${Date.now()}_${idx}`);
    const title = (p.title || p.rawTitle || '').trim();
    const key = `id:${productId}`.toLowerCase() + '|' + `t:${title.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    toAdd.push({
      id: `queue_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).substring(2, 8)}`,
      productId,
      title,
      price: p.price || '-',
      discount: p.discount || '',
      rating: p.rating || '4.9',
      sold: p.sold || '1k+ terjual',
      commission: p.commission || '',
      shortLink: p.shortLink || p.link || '',
      primaryImage: p.primaryImage || p.image || p.cleanImgUrl || '',
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images
        : (p.primaryImage || p.image ? [p.primaryImage || p.image || p.cleanImgUrl] : []),
      caption: p.caption || '',
      status: 'PENDING',
      scheduleTime: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    });
  });

  const merged = [...existing, ...toAdd];
  await writeStorageKey({ threads_queue: merged });

  return { added: toAdd.length, total: merged.length };
}

// ===========================================================================
// Central Message Router
// ===========================================================================
const messageRouter = {
  /**
   * Dispatch an action and return the result object.
   * Used directly by tests/Node and by the chrome.runtime.onMessage listener.
   * @param {Object} request
   * @returns {Promise<Object>}
   */
  async dispatch(request = {}) {
    const action = request && request.action;
    try {
      switch (action) {
        case 'ADD_TO_QUEUE':
        case 'SAVE_PRODUCTS_TO_DASHBOARD':
          return await this._ingestProducts(request);

        case 'GET_QUEUE': {
          const queue = await readStorageKey('threads_queue', []);
          return { success: true, queue, count: queue.length };
        }

        case 'GET_QUEUE_STATS': {
          const stats = await this._computeQueueStats();
          return { success: true, ...stats };
        }

        case 'GET_QUEUE_STATUS': {
          const settings = await readStorageKey('threads_settings', {});
          const stats = await this._computeQueueStats();
          return { success: true, isRunning: !!settings.isQueueRunning, ...stats };
        }

        case 'START_QUEUE':
          return await this._startQueue(request);

        case 'STOP_QUEUE':
          return await this._stopQueue();

        case 'EXPORT_DATABASE':
          return await this._exportDatabase();

        case 'IMPORT_DATABASE':
          return await this._importDatabase(request);

        case 'OPEN_POSTER_PANEL':
          return { success: true, url: chrome.runtime.getURL('panel/poster-panel.html') };

        default:
          return { success: false, error: `Action '${action || '(missing)'}' is unrecognized` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Ingest products: merge into the product DB (dedup) and, for ADD_TO_QUEUE,
   * also feed the Poster Panel queue (threads_queue).
   */
  async _ingestProducts(request) {
    const newItems = request.products || request.items || [];
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return { success: false, error: 'No valid product data' };
    }

    // 1. Merge into the product database with duplicate protection
    let addedCount = newItems.length;
    let totalCount = newItems.length;
    if (Storage && typeof Storage.mergeProducts === 'function') {
      const res = await Storage.mergeProducts(newItems);
      addedCount = res.addedCount;
      totalCount = res.merged.length;
    } else {
      // Fallback: manual merge with dedup by shopeeId/title
      const current = await readStorageKey('shopee_products', []);
      const seen = new Set(current.map(p =>
        (p.shopeeId ? `id:${p.shopeeId}` : `t:${(p.title || p.rawTitle || '').trim().toLowerCase()}`)
      ));
      const unique = newItems.filter(p => {
        const key = p.shopeeId ? `id:${p.shopeeId}` : `t:${(p.title || p.rawTitle || '').trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const merged = [...current, ...unique];
      await writeStorageKey({ shopee_products: merged });
      addedCount = unique.length;
      totalCount = merged.length;
    }

    // 2. ADD_TO_QUEUE also feeds the Poster Panel queue (threads_queue)
    let queueRes = { added: 0, total: 0 };
    if (request.action === 'ADD_TO_QUEUE') {
      queueRes = await appendToThreadsQueue(newItems);
    }

    return {
      success: true,
      count: totalCount,
      added: addedCount,
      queueAdded: queueRes.added,
      queueTotal: queueRes.total
    };
  },

  async _computeQueueStats() {
    const queue = await readStorageKey('threads_queue', []);
    const stats = { total: queue.length, pending: 0, posting: 0, posted: 0, failed: 0 };
    queue.forEach(item => {
      const st = String(item.status || 'PENDING').toUpperCase();
      if (st === 'PENDING') stats.pending++;
      else if (st === 'POSTING' || st === 'PROCESSING') stats.posting++;
      else if (st === 'POSTED') stats.posted++;
      else if (st === 'FAILED') stats.failed++;
    });
    return stats;
  },

  async _startQueue(request) {
    const interval = Number(
      request.intervalMinutes ||
      request.interval_minutes ||
      (await readStorageKey('threads_settings', {})).intervalMinutes ||
      15
    );

    if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.create) {
      chrome.alarms.create(QUEUE_ALARM_NAME, { periodInMinutes: interval });
    }
    await this._setSetting('isQueueRunning', true);

    // Notify live contexts (poster panel / threads tab) that the scheduler started
    try {
      chrome.runtime.sendMessage({ action: 'QUEUE_STATUS_CHANGED', isRunning: true }, () => {});
    } catch (_) {}

    return { success: true, isRunning: true, intervalMinutes: interval };
  },

  async _stopQueue() {
    if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.clear) {
      chrome.alarms.clear(QUEUE_ALARM_NAME, () => {});
    }
    await this._setSetting('isQueueRunning', false);

    try {
      chrome.runtime.sendMessage({ action: 'QUEUE_STATUS_CHANGED', isRunning: false }, () => {});
    } catch (_) {}

    return { success: true, isRunning: false };
  },

  async _setSetting(key, value) {
    const current = await readStorageKey('threads_settings', {});
    const updated = { ...current, [key]: value, updated_at: new Date().toISOString() };
    await writeStorageKey({ threads_settings: updated });
    return updated;
  },

  async _exportDatabase() {
    const [queue, products, settings, logs] = await Promise.all([
      readStorageKey('threads_queue', []),
      readStorageKey('shopee_products', []),
      readStorageKey('threads_settings', {}),
      readStorageKey('threads_logs', [])
    ]);

    return {
      success: true,
      data: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        market: (typeof self !== 'undefined' && self.ShopiThreadMarket) ? self.ShopiThreadMarket.country : 'MY',
        queue,
        products,
        settings,
        logs
      }
    };
  },

  async _importDatabase(request) {
    const data = request.data || {};
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON backup data' };
    }

    const pairs = {};
    if (Array.isArray(data.queue)) pairs.threads_queue = data.queue;
    if (Array.isArray(data.products)) pairs.shopee_products = data.products;
    if (data.settings && typeof data.settings === 'object') pairs.threads_settings = data.settings;
    if (Array.isArray(data.logs)) pairs.threads_logs = data.logs;

    await writeStorageKey(pairs);

    return {
      success: true,
      restored: {
        queue: Array.isArray(data.queue) ? data.queue.length : 0,
        products: Array.isArray(data.products) ? data.products.length : 0,
        settings: data.settings ? 1 : 0,
        logs: Array.isArray(data.logs) ? data.logs.length : 0
      }
    };
  }
};

// Scheduler tick: broadcast a hint so live contexts can pick the next pending item
if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === QUEUE_ALARM_NAME) {
      try {
        chrome.runtime.sendMessage({ action: 'POST_NEXT_ITEM', source: 'scheduler' }, () => {});
      } catch (_) {}
    }
  });
}

// Global message router bridge
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  const ROUTED_ACTIONS = new Set([
    'ADD_TO_QUEUE',
    'SAVE_PRODUCTS_TO_DASHBOARD',
    'GET_QUEUE',
    'GET_QUEUE_STATS',
    'GET_QUEUE_STATUS',
    'START_QUEUE',
    'STOP_QUEUE',
    'EXPORT_DATABASE',
    'IMPORT_DATABASE',
    'OPEN_POSTER_PANEL'
  ]);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.action) return;

    if (ROUTED_ACTIONS.has(request.action)) {
      messageRouter.dispatch(request).then(sendResponse);
      return true;
    }

    if (request.action === 'GET_DASHBOARD_PRODUCTS') {
      chrome.storage.local.get(['shopee_products'], (store) => {
        const list = Array.isArray(store.shopee_products) ? store.shopee_products : [];
        sendResponse({ success: true, products: list, count: list.length });
      });
      return true;
    }

    if (request.action === 'OPEN_DASHBOARD') {
      const dashboardUrl = chrome.runtime.getURL('dashboard/dashboard.html');
      chrome.tabs.query({ url: dashboardUrl }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId && chrome.windows) {
            chrome.windows.update(tabs[0].windowId, { focused: true }).catch(() => {});
          }
        } else {
          chrome.tabs.create({ url: dashboardUrl });
        }
        sendResponse({ success: true });
      });
      return true;
    }

    if (request.action === 'OPEN_THREADS_AND_PASTE') {
      const textToPaste = request.text || '';
      // Open Threads web or reuse tab
      chrome.tabs.query({ url: '*://*.threads.net/*' }, (tabs) => {
        const targetUrl = 'https://www.threads.net/';
        if (tabs && tabs.length > 0) {
          const tab = tabs[0];
          chrome.tabs.update(tab.id, { active: true }, (updatedTab) => {
            if (tab.windowId && chrome.windows) {
              chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
            }
            // Execute script to focus composer and insert text safely without clicking post
            chrome.scripting ? chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: fillThreadsComposerSafe,
              args: [textToPaste]
            }).catch(() => {}) : null;
          });
        } else {
          chrome.tabs.create({ url: targetUrl }, (createdTab) => {
            // Wait for tab load
            const listener = (tabId, changeInfo) => {
              if (tabId === createdTab.id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(() => {
                  if (chrome.scripting) {
                    chrome.scripting.executeScript({
                      target: { tabId: createdTab.id },
                      func: fillThreadsComposerSafe,
                      args: [textToPaste]
                    }).catch(() => {});
                  }
                }, 1500);
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
        }
        sendResponse({ success: true });
      });
      return true;
    }

    return true;
  });
}

// Export for Node.js test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { messageRouter };
}

console.log('📦 [ShopeeAffiliateDL] Background Service Worker ready to serve the Dashboard & Scraper.');
