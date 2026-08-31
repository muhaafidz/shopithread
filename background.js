/**
 * Shopee Affiliate Downloader & CSV Dashboard
 * Background Service Worker — Clean Architecture (Manifest V3)
 * 
 * @author sodikinnaa
 * @license MIT
 */

'use strict';

// Load shared services into the service worker (classic SW: importScripts is available)
try {
  importScripts('libs/storage-service.js');
} catch (_) {}
const Storage = (typeof self !== 'undefined' && self.StorageService) || null;

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

// Append items into the Poster Panel queue (threads_queue) without duplicates
async function appendToThreadsQueue(newItems) {
  const items = Array.isArray(newItems) ? newItems : [];
  if (items.length === 0) return { added: 0, total: 0 };

  const existing = await new Promise((resolve) => {
    chrome.storage.local.get(['threads_queue'], (store) => {
      resolve(Array.isArray(store.threads_queue) ? store.threads_queue : []);
    });
  });

  const seen = new Set(existing.map(q =>
    `id:${q.productId || q.product_id || q.shopeeId || ''}`.toLowerCase() + '|' +
    `t:${(q.title || q.rawTitle || '').trim().toLowerCase()}`
  ));

  const nowIso = new Date().toISOString();
  const toAdd = [];
  items.forEach((p, idx) => {
    const productId = String(p.productId || p.shopeeId || p.id || `q_${Date.now()}_${idx}`);
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
  await new Promise((resolve) => {
    chrome.storage.local.set({ threads_queue: merged }, resolve);
  });

  return { added: toAdd.length, total: merged.length };
}

// Global message router
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.action) return;

    if (request.action === 'GET_QUEUE') {
      chrome.storage.local.get(['threads_queue'], (store) => {
        const queue = Array.isArray(store.threads_queue) ? store.threads_queue : [];
        sendResponse({ success: true, queue, count: queue.length });
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

    if (request.action === 'SAVE_PRODUCTS_TO_DASHBOARD' || request.action === 'ADD_TO_QUEUE') {
      const newItems = request.products || request.items || [];
      if (!Array.isArray(newItems) || newItems.length === 0) {
        sendResponse({ success: false, error: 'Empty product list' });
        return true;
      }

      (async () => {
        try {
          // 1. Merge into the product database with duplicate protection
          let addedCount = newItems.length;
          let totalCount = newItems.length;
          if (Storage && typeof Storage.mergeProducts === 'function') {
            const res = await Storage.mergeProducts(newItems);
            addedCount = res.addedCount;
            totalCount = res.merged.length;
          } else {
            // Fallback: manual merge with dedup by shopeeId/title
            const current = await new Promise((resolve) => {
              chrome.storage.local.get(['shopee_products'], (store) => {
                resolve(Array.isArray(store.shopee_products) ? store.shopee_products : []);
              });
            });
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
            await new Promise((resolve) => {
              chrome.storage.local.set({ shopee_products: merged }, resolve);
            });
            addedCount = unique.length;
            totalCount = merged.length;
          }

          // 2. ADD_TO_QUEUE also feeds the Poster Panel queue (threads_queue)
          let queueRes = { added: 0, total: 0 };
          if (request.action === 'ADD_TO_QUEUE') {
            queueRes = await appendToThreadsQueue(newItems);
          }

          sendResponse({
            success: true,
            count: totalCount,
            added: addedCount,
            queueAdded: queueRes.added,
            queueTotal: queueRes.total
          });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    if (request.action === 'GET_DASHBOARD_PRODUCTS') {
      chrome.storage.local.get(['shopee_products'], (store) => {
        const list = Array.isArray(store.shopee_products) ? store.shopee_products : [];
        sendResponse({ success: true, products: list, count: list.length });
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

console.log('📦 [ShopeeAffiliateDL] Background Service Worker ready to serve the Dashboard & Scraper.');
