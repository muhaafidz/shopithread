/**
 * @file spintax.js
 * @description Spintax Parser & Dynamic Caption Engine for Shopee Affiliate & Threads Auto-Poster
 * Generates unique caption variations using nested spintax, dynamic product variables, and category hashtag banks.
 * 
 * Target: Google Chrome Extension Manifest V3 (Content Script, Popup, Dashboard, Service Worker, Node.js)
 * @author sodikinnaa
 * @license MIT
 */

(function (root) {
  'use strict';

  // Obtain constants from global CONSTANTS if available
  const APP_CONSTANTS = (typeof root !== 'undefined' && root.CONSTANTS) || {};

  /**
   * Default Category Hashtag Banks
   */
  const DEFAULT_HASHTAG_BANK = APP_CONSTANTS.HASHTAG_BANK || {
    viral: [
      '#RacunShopee', '#ShopeeHaul', '#SpillBawaBerkah', '#ShopeeAffiliateID',
      '#RacunShopeeCheck', '#ShopeeLook', '#BarangViral', '#TikTokShopFinds',
      '#ShopeeFinds', '#MurahLebay', '#FlashSaleShopee', '#DiskonShopee',
      '#ShopeeRacunKu', '#RekomendasiShopee', '#SpillProduk', '#ShopeeID',
      '#RacunBelanja', '#ShopeeFav', '#BeliDiShopee', '#PromoShopee'
    ],
    fashion: [
      '#OOTDIndo', '#FashionShopee', '#OutfitInspo', '#RacunFashion',
      '#KoreanStyle', '#HijabStyle', '#StyleInspiration', '#ShopeeHaulFashion',
      '#CasualLook', '#LocalBrandIndo', '#StreetwearIndo', '#DressViral',
      '#SneakersAddict', '#FashionInspoID', '#OutfitOfTheDay', '#BajuMurahShopee',
      '#CelanaKulot', '#TasWanita', '#OuterAesthetic', '#GayaKekinian'
    ],
    elektronik: [
      '#GadgetMurah', '#RacunGadget', '#SetupInspiration', '#DeskSetup',
      '#TechReviewID', '#ShopeeElektronik', '#SmartHomeID', '#AksesorisHP',
      '#GadgetViral', '#TWSMurah', '#PowerbankViral', '#ShopeeTech',
      '#HeadphoneWireless', '#KeyboardMechanical', '#SmartwatchMurah',
      '#GamingSetup', '#TechLovers', '#AksesorisKomputer', '#BarangFaedah', '#GadgetIndonesia'
    ],
    home_living: [
      '#DekorasiKamar', '#HomeLiving', '#InspirasiRumah', '#RacunHomeDecor',
      '#PeralatanDapur', '#EstetikRumah', '#AestheticRoom', '#RumahMinimalis',
      '#DapurMinimalis', '#ShopeeHome', '#OrganizerMurah', '#PerabotRumah',
      '#RoomDecorInspo', '#BarangUnikRumah', '#DapurCantik', '#KamarAesthetic',
      '#PeralatanRumahTangga', '#CleanWithMe', '#RumahImpian', '#MakeoverKamar'
    ],
    beauty: [
      '#SkincareViral', '#RacunSkincare', '#MakeupTutorial', '#GlowUpTips',
      '#SkincareRoutine', '#BeautyHacks', '#ShopeeBeauty', '#LipstikViral',
      '#SunscreenReview', '#SkincareLokal', '#MakeupInspo', '#SerumViral',
      '#MoisturizerMurah', '#BeautyReviewID', '#TipsKecantikan', '#CushionViral',
      '#SkincareRemaja', '#AcneProneSkin', '#GlowingSkinTips', '#MakeupMurah'
    ],
    food_snack: [
      '#KulinerViral', '#SnackShopee', '#CamilanEnak', '#FoodieID',
      '#JajananViral', '#RacunCamilan', '#MakananPedas', '#MukbangIndo',
      '#ShopeeFoodies', '#CamilanPedas', '#SnackMurah', '#MakananEnak',
      '#KeripikKaca', '#BasoAci', '#FrozenFoodMurah', '#JajananKekinian'
    ]
  };

  /**
   * Default High-Converting Preset Templates
   */
  const DEFAULT_PRESET_TEMPLATES = APP_CONSTANTS.PRESET_TEMPLATES || APP_CONSTANTS.DEFAULT_TEMPLATES || [
    {
      id: 'preset_racun_viral',
      name: '🔥 Racun Shopee Viral (High Engagement)',
      category: 'viral',
      isDefault: true,
      is_default: true,
      template: `{Gila sih ini|Keren parah|Gak nyangka sebagus ini|Wajib punya nih}! 😍🔥\n{Lagi viral banget|Banyak yang cari|Rekomendasi terbaik hari ini}: {nama_produk}\n\n💸 {Harga cuma|Dapet harga|Cuma}: {harga} {diskon}\n⭐ Rating: {rating} | {terjual} terjual\n\n🔗 {Beli di sini yuk|Cek checkout di sini|Link official promo|Spill link tokonya}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_aesthetic_review',
      name: '✨ Aesthetic & Honest Review',
      category: 'home_living',
      isDefault: false,
      is_default: false,
      template: `{Spill barang aesthetic check ✨|Honest review produk ini 🤍|Hidden gem Shopee yang wajib kamu tahu 🌿}\n\n{nama_produk}\n{Bener-bener worth to buy|Kualitasnya di luar ekspektasi|Desainnya cakep dan multifungsi banget}!\n\n💰 {Harga normal vs promo}: {harga}\n🌟 {Review rating}: {rating} ({terjual} terjual)\n\n🛒 {Tautan produk original|Link pembelian resmi}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_diskon_promo',
      name: '🚨 Flash Sale & Promo Alert',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `🚨 {PROMO ALERT|FLASH SALE ALERT|DROP PRICE}! 🚨\n{nama_produk}\n\n⚡ {Lagi diskon gede|Harga anjlok parah|Lagi turun harga banget}!\n🏷️ {Sekarang cuma}: {harga} {diskon}\n✨ {Terjual}: {terjual} | Rating {rating}\n\n👇 {Buruan klaim vouchernya sebelum kehabisan|Klik link di bawah ini|Link promo Shopee}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_solusi_lifehack',
      name: '💡 Solusi Praktis & Lifehack',
      category: 'elektronik',
      isDefault: false,
      is_default: false,
      template: `{Solusi buat kamu yang lagi cari ini|Lifehack barang berguna yang bikin hidup makin gampang|Nyesel baru tahu barang ini sekarang}! 🙌\n\n📌 {nama_produk}\n{Fungsinya beneran ngebantu banget|Praktis, awet, dan harganya super terjangkau}.\n\n💵 {Harga}: {harga}\n⭐ {Kepuasan pembeli}: {rating} ({terjual} terjual)\n\n👉 {Info & Pembelian|Tautan resmi promo}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_simple_direct',
      name: '🎯 Simple & Direct CTA',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `{nama_produk}\n\n{Spill link belinya ya guys|Yang dari kemarin nanyain link belinya nih|Langsung checkout sebelum restock abis}:\n👉 {link_affiliate}\n\n💸 {Harga}: {harga} | ⭐ Rating: {rating} ({terjual})\n\n{hashtag_random}`
    }
  ];

  /**
   * System variable identifiers that should not be spun if un-piped
   */
  const SYSTEM_VARIABLES = new Set([
    'nama_produk', 'product_name', 'judul', 'title', 'name',
    'harga', 'price',
    'diskon', 'discount',
    'link_affiliate', 'short_link', 'link', 'url', 'affiliate_link',
    'rating', 'stars', 'rate',
    'terjual', 'sold', 'sales',
    'komisi', 'comm_rate', 'commission', 'commrate', 'estimasi_komisi',
    'kategori', 'category',
    'hashtag_random', 'hashtags'
  ]);

  /**
   * Core Spintax & Caption Engine Class
   */
  class SpintaxEngine {
    /**
     * @param {Object} [customBank=null] - Optional custom hashtag bank
     * @param {Array<Object>} [customTemplates=null] - Optional custom template presets
     */
    constructor(customBank = null, customTemplates = null) {
      this.hashtagBank = customBank || DEFAULT_HASHTAG_BANK;
      this.defaultTemplates = customTemplates || DEFAULT_PRESET_TEMPLATES;
    }

    /**
     * Static accessors
     */
    static get HASHTAG_BANK() { return DEFAULT_HASHTAG_BANK; }
    static get defaultHashtags() { return DEFAULT_HASHTAG_BANK; }
    static get hashtagBank() { return DEFAULT_HASHTAG_BANK; }
    static get DEFAULT_TEMPLATES() { return DEFAULT_PRESET_TEMPLATES; }
    static get defaultTemplates() { return DEFAULT_PRESET_TEMPLATES; }

    /**
     * Memeriksa apakah token adalah nama variabel sistem
     * @private
     * @param {string} token
     * @returns {boolean}
     */
    _isSystemVariable(token) {
      if (!token) return false;
      return SYSTEM_VARIABLES.has(token.trim().toLowerCase());
    }

    /**
     * Memproses teks spintax bersarang (Nested Spintax Parser)
     * Mendukung kedalaman tak terbatas dengan safety guard max iterations.
     * Contoh: "{Pilihan 1|{Sub 1|Sub 2}|Pilihan 3}"
     * 
     * @param {string} text - Teks berformat spintax
     * @returns {string} Teks hasil spin acak
     */
    parseSpintax(text) {
      if (!text || typeof text !== 'string') return '';

      const spintaxRegex = /\{([^{}]+)\}/;
      let match;
      let iteration = 0;
      const maxIterations = 500;
      let parsed = text;

      while ((match = spintaxRegex.exec(parsed)) !== null && iteration < maxIterations) {
        iteration++;
        const content = match[1];

        // Jika token adalah variabel sistem tanpa pipe (|), amankan dari parsing awal
        if (!content.includes('|') && this._isSystemVariable(content)) {
          parsed = parsed.slice(0, match.index) + `___SYSVAR_${content}___` + parsed.slice(match.index + match[0].length);
          continue;
        }

        const options = content.split('|');
        const randomIndex = Math.floor(Math.random() * options.length);
        const selected = options[randomIndex];

        parsed = parsed.slice(0, match.index) + selected + parsed.slice(match.index + match[0].length);
      }

      // Kembalikan variabel sistem yang diproteksi
      return parsed.replace(/___SYSVAR_([a-zA-Z0-9_]+)___/g, '{$1}');
    }

    /**
     * Mengambil hashtag acak unik dari kumpulan kategori
     * @param {string} [category='viral'] - Kategori ('viral', 'fashion', 'elektronik', 'home_living', 'beauty', 'food_snack', 'all')
     * @param {number} [count=3] - Jumlah hashtag
     * @param {Object|Array} [customBank=null] - Bank hashtag opsional
     * @returns {string} String hashtag terpisah spasi (e.g. "#RacunShopee #ShopeeHaul #BarangViral")
     */
    getRandomHashtags(category = 'viral', count = 3, customBank = null) {
      const bank = customBank || this.hashtagBank || DEFAULT_HASHTAG_BANK;
      let pool = [];

      if (Array.isArray(bank)) {
        pool = [...bank];
      } else if (typeof bank === 'object' && bank !== null) {
        if (category === 'all' || !bank[category]) {
          Object.values(bank).forEach(tags => {
            if (Array.isArray(tags)) pool.push(...tags);
          });
        } else if (Array.isArray(bank[category])) {
          pool = [...bank[category]];
        }
      }

      if (pool.length === 0) {
        pool = (DEFAULT_HASHTAG_BANK.viral && DEFAULT_HASHTAG_BANK.viral.length > 0)
          ? [...DEFAULT_HASHTAG_BANK.viral]
          : ['#RacunShopee', '#ShopeeHaul', '#ShopeeAffiliateID'];
      }

      // Fisher-Yates shuffle
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const targetCount = Math.max(1, Math.min(typeof count === 'number' ? count : 3, shuffled.length));
      return shuffled.slice(0, targetCount).join(' ');
    }

    /**
     * Mengganti variabel template dengan data produk nyata
     * @param {string} text - Teks dengan token {nama_produk}, {harga}, dll.
     * @param {Object} [product={}] - Data produk
     * @param {Object} [options={}] - Opsi format
     * @returns {string}
     */
    replaceVariables(text, product = {}, options = {}) {
      if (!text || typeof text !== 'string') return '';

      const p = product || {};
      const hashtagCategory = options.hashtagCategory || p.category || p.kategori || 'viral';
      const hashtagCount = (options.hashtagCount !== undefined) ? options.hashtagCount : 3;

      // Extract & sanitize data fields
      const title = (p.title || p.rawTitle || p.name || p.product_name || p.nama_produk || p.judul || 'Produk Rekomendasi Shopee').trim();

      let price = (p.price || p.harga || p.formatted_price || '-').toString().trim();
      if (price !== '-' && !price.toLowerCase().startsWith('rp')) {
        price = `Rp ${price}`;
      }

      let discount = (p.discount || p.diskon || '').toString().trim();
      if (discount && !discount.includes('%') && !discount.toLowerCase().includes('diskon')) {
        discount = `(Diskon ${discount}%)`;
      } else if (discount && !discount.startsWith('(') && !discount.endsWith(')')) {
        discount = `(${discount})`;
      }

      const shortLink = (p.short_link || p.shortLink || p.affiliate_link || p.link_affiliate || p.link || p.url || '').trim();
      const rating = (p.rating || p.rating_star || p.stars || '⭐ 4.9').toString().trim();
      const sold = (p.sold || p.terjual || '1rb+').toString().trim();
      const commRate = (p.comm_rate || p.commission || p.commRate || p.komisi || '-').toString().trim();
      const categoryName = (p.category || p.kategori || 'Rekomendasi').toString().trim();

      let randomHashtags = '';
      if (typeof options.randomHashtags === 'string') {
        randomHashtags = options.randomHashtags;
      } else {
        const customBank = options.customBank || options.hashtagBanks || options.customHashtags || null;
        randomHashtags = this.getRandomHashtags(hashtagCategory, hashtagCount, customBank);
      }

      // Variable Replacement Map
      const replacements = {
        '{nama_produk}': title,
        '{product_name}': title,
        '{judul}': title,
        '{title}': title,
        '{name}': title,

        '{harga}': price,
        '{price}': price,

        '{diskon}': discount,
        '{discount}': discount,

        '{link_affiliate}': shortLink,
        '{short_link}': shortLink,
        '{link}': shortLink,
        '{url}': shortLink,
        '{affiliate_link}': shortLink,

        '{rating}': rating,
        '{stars}': rating,
        '{rate}': rating,

        '{terjual}': sold,
        '{sold}': sold,
        '{sales}': sold,

        '{komisi}': commRate,
        '{comm_rate}': commRate,
        '{commission}': commRate,
        '{estimasi_komisi}': commRate,

        '{kategori}': categoryName,
        '{category}': categoryName,

        '{hashtag_random}': randomHashtags,
        '{hashtags}': randomHashtags
      };

      let result = text;
      for (const [placeholder, value] of Object.entries(replacements)) {
        const escaped = placeholder.replace(/[{}]/g, '\\$&');
        result = result.replace(new RegExp(escaped, 'gi'), value);
      }

      // Clean redundant whitespaces while preserving purposeful linebreaks
      return result
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    /**
     * Pipeline lengkap format template:
     * 1. Spin sintaks bersarang
     * 2. Replace semua variabel produk & hashtag acak
     * 
     * @param {string} template - String template caption
     * @param {Object} [product={}] - Data produk
     * @param {Object} [options={}] - Opsi format
     * @returns {string}
     */
    formatTemplate(template, product = {}, options = {}) {
      let tpl = template;
      if (!tpl || typeof tpl !== 'string') {
        if (this.defaultTemplates && this.defaultTemplates.length > 0 && this.defaultTemplates[0].template) {
          tpl = this.defaultTemplates[0].template;
        } else {
          return '';
        }
      }

      // 1. Eksekusi Nested Spintax
      const spun = this.parseSpintax(tpl);

      // 2. Format variabel produk & hashtag
      return this.replaceVariables(spun, product, options);
    }

    /**
     * Generate caption siap pakai dengan dukungan berbagai signature argumen
     * @param {string} template - Template caption
     * @param {Object} [product={}] - Objek data produk
     * @param {Object|Array|string|number} [customHashtags=null] - Hashtag bank kustom atau count
     * @param {number} [hashtagCount=3] - Jumlah hashtag
     * @returns {string}
     */
    generateCaption(template, product = {}, customHashtags = null, hashtagCount = 3) {
      let count = hashtagCount;
      let customBank = customHashtags;

      if (typeof customHashtags === 'number') {
        count = customHashtags;
        customBank = null;
      }

      const options = {
        hashtagCount: typeof count === 'number' ? count : 3
      };

      if (typeof customBank === 'string') {
        options.randomHashtags = customBank;
      } else if (customBank && typeof customBank === 'object') {
        options.customBank = customBank;
      }

      return this.formatTemplate(template, product, options);
    }

    /**
     * Menghasilkan multiple preview caption untuk preview di UI popup/dashboard
     * @param {string} template - Template caption
     * @param {Object} [product={}] - Data produk
     * @param {number} [count=3] - Jumlah variasi preview
     * @param {Object} [options={}] - Opsi tambahan
     * @returns {Array<string>}
     */
    generatePreview(template, product = {}, count = 3, options = {}) {
      const dummyProduct = {
        title: 'TWS Bluetooth 5.3 Earphone Ultra Bass Wireless Earbuds Waterproof',
        price: 'Rp 89.000',
        diskon: 'Diskon 45%',
        rating: '⭐ 4.9',
        terjual: '10rb+ terjual',
        comm_rate: '12%',
        short_link: 'https://s.shopee.co.id/sample123',
        category: 'elektronik',
        ...product
      };

      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(this.formatTemplate(template, dummyProduct, options));
      }
      return results;
    }

    /**
     * Menghitung perkiraan total variasi unik yang dapat dihasilkan oleh template
     * @param {string} template
     * @returns {number}
     */
    calculateVariations(template) {
      if (!template || typeof template !== 'string') return 1;

      try {
        let temp = template;
        let totalCombinations = 1;
        const spintaxRegex = /\{([^{}]+)\}/;
        let match;
        let iterations = 0;

        while ((match = spintaxRegex.exec(temp)) !== null && iterations < 200) {
          iterations++;
          const content = match[1];
          if (content.includes('|')) {
            const options = content.split('|');
            totalCombinations *= options.length;
            temp = temp.slice(0, match.index) + options[0] + temp.slice(match.index + match[0].length);
          } else {
            temp = temp.slice(0, match.index) + content + temp.slice(match.index + match[0].length);
          }
        }

        return Math.max(1, totalCombinations);
      } catch (e) {
        return 1;
      }
    }

    /**
     * Mengembalikan daftar template preset default
     * @returns {Array<Object>}
     */
    getDefaultTemplates() {
      return JSON.parse(JSON.stringify(this.defaultTemplates));
    }

    /**
     * Mengembalikan daftar semua hashtag bank
     * @returns {Object}
     */
    getAllHashtagBank() {
      return JSON.parse(JSON.stringify(this.hashtagBank));
    }
  }

  // Create singleton instance
  const spintaxInstance = new SpintaxEngine();

  // Forward prototype methods to static methods for convenience
  Object.getOwnPropertyNames(SpintaxEngine.prototype).forEach(prop => {
    if (prop !== 'constructor' && typeof SpintaxEngine.prototype[prop] === 'function' && !SpintaxEngine[prop]) {
      SpintaxEngine[prop] = function (...args) {
        return spintaxInstance[prop](...args);
      };
    }
  });

  // Export for CommonJS (Node.js)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = spintaxInstance;
    module.exports.SpintaxEngine = SpintaxEngine;
    module.exports.SpintaxParser = spintaxInstance;
    module.exports.default = spintaxInstance;
  }

  // Export to Global Scope (Content Script, Popup, Dashboard, Service Worker)
  if (root) {
    root.SpintaxParser = spintaxInstance;
    root.SpintaxEngine = SpintaxEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof self !== 'undefined' ? self
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
