/**
 * CSV & Export Service
 * Handles CSV parsing, RFC 4180 formatting, TXT export, and ZIP compilation.
 * 
 * @author sodikinnaa
 * @license MIT
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let market = null;
    try { market = require('./market-config.js'); } catch (_) {}
    module.exports = factory(market);
  } else {
    root.CsvService = factory(root.ShopiThreadMarket || null);
  }
})(typeof self !== 'undefined' ? self : this, function (MARKET) {
  'use strict';

  MARKET = MARKET || {
    currency: 'RM',
    fallbackShortlink: 'https://s.shopee.com.my',
    defaultSold: '1k+ terjual',
    locale: 'ms-MY'
  };

  const CsvService = {
    /**
     * Generate standard RFC 4180 compliant CSV string from product array
     * @param {Array<Object>} products
     * @returns {string} CSV string
     */
    generateCSV(products) {
      if (!Array.isArray(products)) return '';
      const headers = ['No', 'Product Name', 'Price', 'Commission', 'Sold', 'Affiliate Link', 'Original Product Link', 'Image URL', 'Saved Date'];
      const rows = products.map((p, idx) => {
        const title = (p.title || p.rawTitle || '').replace(/"/g, '""');
        const price = (p.price || '-').replace(/"/g, '""');
        const commission = (p.commission || '-').replace(/"/g, '""');
        const sold = (p.sold || '-').replace(/"/g, '""');
        const shortLink = (p.shortLink || p.link || '').replace(/"/g, '""');
        const longLink = (p.longLink || p.url || '').replace(/"/g, '""');
        const image = (p.image || p.cleanImgUrl || '').replace(/"/g, '""');
        const date = p.createdAt || new Date().toISOString().slice(0, 10);

        return [
          idx + 1,
          `"${title}"`,
          `"${price}"`,
          `"${commission}"`,
          `"${sold}"`,
          `"${shortLink}"`,
          `"${longLink}"`,
          `"${image}"`,
          `"${date}"`
        ].join(',');
      });

      return [headers.join(','), ...rows].join('\r\n');
    },

    /**
     * Parse CSV string into product objects.
     * RFC 4180 compliant: supports quoted fields containing commas, escaped
     * quotes (""), and multi-line values. When the first row is a recognized
     * header, columns are mapped by name (English & Indonesian variants);
     * otherwise the legacy positional mapping is used.
     * @param {string} csvText
     * @returns {Array<Object>} Parsed products array
     */
    parseCSV(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];
      const records = this._parseCSVRecords(csvText);
      if (records.length === 0) return [];

      // Treat the first record as a header only when it maps to a plausible
      // title+price column pair (avoids false positives on data rows that
      // merely contain words like "Product").
      const colMap = this._mapHeaderRow(records[0]);
      const isHeader = colMap.title !== undefined && colMap.price !== undefined;

      let rows = records;
      let map = null;
      if (isHeader) {
        map = colMap;
        rows = records.slice(1);
      }

      const parsedItems = [];
      rows.forEach((cols, i) => {
        if (!cols.some(c => String(c).trim().length > 0)) return;

        const pick = (mappedIdx, fallback) => (
          mappedIdx !== undefined && cols[mappedIdx] !== undefined && String(cols[mappedIdx]).trim() !== ''
        ) ? String(cols[mappedIdx]).trim() : fallback;

        let title, price, commission, sold, shortLink, longLink, image;
        if (map) {
          title = pick(map.title, cols[1] || cols[0] || 'Imported Product');
          price = pick(map.price, '-');
          commission = pick(map.commission, '-');
          sold = pick(map.sold, MARKET.defaultSold);
          shortLink = pick(map.shortLink, '') || cols.find(c => c.startsWith('http')) || MARKET.fallbackShortlink;
          longLink = pick(map.longLink, '');
          image = pick(map.image, '') || cols.find(c => c.includes('.jpg') || c.includes('.png') || c.includes('susercontent')) || '';
        } else {
          // Legacy positional mapping: No, Title, Price, Commission, Sold, Shortlink, Long Link, Image
          title = cols[1] || cols[0] || 'Imported Product';
          price = cols[2] || '-';
          commission = cols[3] || '-';
          sold = cols[4] || MARKET.defaultSold;
          shortLink = cols[5] || cols.find(c => c.startsWith('http')) || MARKET.fallbackShortlink;
          longLink = cols[6] || '';
          image = cols[7] || cols.find(c => c.includes('.jpg') || c.includes('.png') || c.includes('susercontent')) || '';
        }

        parsedItems.push({
          id: `import_${Date.now()}_${i}`,
          title,
          rawTitle: title,
          price,
          commission,
          sold,
          shortLink,
          longLink,
          image,
          cleanImgUrl: image,
          createdAt: new Date().toISOString()
        });
      });

      return parsedItems;
    },

    /**
     * Split raw CSV text into records (arrays of cell strings), honoring
     * quoted fields with embedded commas, escaped quotes and newlines.
     * @private
     * @param {string} text
     * @returns {Array<Array<string>>}
     */
    _parseCSVRecords(text) {
      const records = [];
      let row = [];
      let cur = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
          if (ch === '"') {
            if (text[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            cur += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(cur.trim());
          cur = '';
        } else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          row.push(cur.trim());
          cur = '';
          if (row.length > 1 || (row[0] && row[0] !== '')) records.push(row);
          row = [];
        } else {
          cur += ch;
        }
      }

      row.push(cur.trim());
      if (row.length > 1 || (row[0] && row[0] !== '')) records.push(row);
      return records;
    },

    /**
     * Map a header row to column indexes (English & Indonesian variants).
     * @private
     * @param {Array<string>} headerCols
     * @returns {Object} e.g. { title: 1, price: 2, ... }
     */
    _mapHeaderRow(headerCols) {
      const map = {};
      headerCols.forEach((h, idx) => {
        const n = String(h).trim().toLowerCase();
        if (!n || n === 'no' || n === '#') return;
        if (['title', 'product name', 'nama produk', 'product', 'nama', 'name'].includes(n)) {
          if (map.title === undefined) map.title = idx;
        } else if (['price', 'harga'].includes(n)) {
          if (map.price === undefined) map.price = idx;
        } else if (['commission', 'komisi', 'comm', 'estimasi komisi'].includes(n)) {
          if (map.commission === undefined) map.commission = idx;
        } else if (['sold', 'terjual', 'sales'].includes(n)) {
          if (map.sold === undefined) map.sold = idx;
        } else if (['affiliate link', 'shortlink', 'short link', 'link affiliate', 'link singkat', 'link'].includes(n)) {
          if (map.shortLink === undefined) map.shortLink = idx;
        } else if (['original product link', 'long link', 'link produk', 'original link', 'product link', 'link produk asli'].includes(n)) {
          if (map.longLink === undefined) map.longLink = idx;
        } else if (['image url', 'url foto', 'image', 'foto', 'photo', 'gambar', 'url foto hd'].includes(n)) {
          if (map.image === undefined) map.image = idx;
        }
      });
      return map;
    },

    /**
     * Generate text summary of affiliate links
     * @param {Array<Object>} products 
     * @returns {string} Formatted text
     */
    generateTXT(products) {
      if (!Array.isArray(products) || products.length === 0) return '';
      let txt = `==================================================\n`;
      txt += `SHOPEE MALAYSIA AFFILIATE SHORTLINK LIST\n`;
      txt += `Date: ${new Date().toLocaleDateString(MARKET.locale || 'ms-MY')}\n`;
      txt += `Total Products: ${products.length}\n`;
      txt += `==================================================\n\n`;

      products.forEach((p, idx) => {
        const paddedIndex = String(idx + 1).padStart(2, '0');
        const title = p.rawTitle || p.title || `Product ${idx + 1}`;
        const currency = MARKET.currency || 'RM';
        const price = p.price ? (String(p.price).toLowerCase().startsWith(currency.toLowerCase()) ? p.price : `${currency} ${p.price}`) : '-';
        const safeTitle = (p.safeTitle || p.title || title).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
        const extMatch = (p.image || p.cleanImgUrl || '').match(/\.(jpg|jpeg|png|webp)/i);
        const ext = extMatch ? extMatch[1] : 'webp';
        const filename = `${paddedIndex}_${safeTitle}.${ext}`;

        txt += `[${paddedIndex}] ${title}\n`;
        txt += `- Price: ${price}\n`;
        txt += `- Image File: product_images/${filename}\n`;
        txt += `- Shortlink: ${p.shortLink || p.link || '-'}\n`;
        txt += `--------------------------------------------------\n\n`;
      });
      return txt;
    },

    /**
     * Trigger browser download for CSV
     * @param {Array<Object>} products 
     * @param {string} customFilename 
     */
    downloadCSV(products, customFilename) {
      if (!products || products.length === 0) throw new Error('No products to export.');
      const csvStr = this.generateCSV(products);
      const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = customFilename || `Shopee_Affiliate_Products_${dateStr}_${products.length}_items.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },

    /**
     * Trigger browser download for TXT
     * @param {Array<Object>} products 
     * @param {string} customFilename 
     */
    downloadTXT(products, customFilename) {
      if (!products || products.length === 0) throw new Error('No products to export.');
      const txt = this.generateTXT(products);
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = customFilename || `Shopee_Affiliate_Links_${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },

    /**
     * Build ZIP archive with images, CSV, and TXT links
     * @param {Array<Object>} products 
     * @param {Object} [options] 
     * @param {Function} [options.onProgress] 
     * @param {Function} [options.isCancelled] 
     * @returns {Promise<Blob>}
     */
    async buildZipBlob(products, options = {}) {
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('No products to compile into ZIP.');
      }
      const JSZipLib = (typeof window !== 'undefined' && window.JSZip) || (typeof global !== 'undefined' && global.JSZip);
      if (!JSZipLib) {
        throw new Error('JSZip library is not ready.');
      }

      const zip = new JSZipLib();
      const folder = zip.folder('product_images');

      for (let i = 0; i < products.length; i++) {
        if (options.isCancelled && options.isCancelled()) break;
        const p = products[i];
        const imgUrl = p.image || p.cleanImgUrl || (Array.isArray(p.images) && p.images[0]);
        if (imgUrl) {
          try {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            const extMatch = imgUrl.match(/\.(jpg|jpeg|png|webp)/i);
            const ext = extMatch ? extMatch[1] : 'jpg';
            const safeTitle = (p.title || p.safeTitle || p.rawTitle || `product_${i+1}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
            folder.file(`${String(i + 1).padStart(3, '0')}_${safeTitle}.${ext}`, blob);
          } catch (e) {
            console.warn(`Failed to download product image index ${i}:`, e);
          }
        }
        if (typeof options.onProgress === 'function') {
          options.onProgress(i + 1, products.length);
        }
      }

      // Add TXT & CSV
      zip.file('products.csv', this.generateCSV(products));
      zip.file('affiliate_links.txt', this.generateTXT(products));

      return await zip.generateAsync({ type: 'blob' });
    },

    /**
     * Generate & trigger browser download for ZIP file
     * @param {Array<Object>} products 
     * @param {Object} [options] 
     * @returns {Promise<void>}
     */
    async downloadZIP(products, options = {}) {
      const zipBlob = await this.buildZipBlob(products, options);
      if (options.isCancelled && options.isCancelled()) return;

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = options.filename || `Shopee_Affiliate_Products_${dateStr}_${products.length}_items.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
    }
  };

  return CsvService;
});
