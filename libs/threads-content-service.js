/**
 * @file threads-content-service.js
 * @description Threads Content Service for generating captions, managing spintax variations,
 * formatting clean text for Threads posts without broken icon characters. Pure modular utility with zero auto-loop/scheduler.
 * 
 * Target: Google Chrome Extension Manifest V3 (Content Script, Popup, Dashboard, Service Worker, Node.js)
 * @author sodikinnaa
 * @license MIT
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ThreadsContentService = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Default Threads Preset Templates - Clean Text Format (No broken icons/emojis)
   */
  const THREADS_TEMPLATES = [
    {
      id: 'racun_shopee',
      name: 'Gaya Santai / Racun Shopee (Clean)',
      category: 'viral',
      description: 'Gaya santai, menarik perhatian, dan mudah dibaca tanpa icon yang rusak.',
      template: `{Gila sih ini!|Keren banget!|Gak nyangka sebagus ini!|Wajib punya nih!}\n{Lagi viral banget|Banyak yang cari|Rekomendasi terbaik hari ini}: {nama_produk}\n\n{Harga cuma|Dapet harga|Cuma}: {harga} {diskon}\nRating: {rating}/5 | {terjual} terjual\n\n{Beli di sini yuk|Cek dan checkout di sini|Link official promo|Spill link tokonya}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'edukasi_review',
      name: 'Gaya Review Jujur / Honest Review (Clean)',
      category: 'home_living',
      description: 'Ulasan jujur, rapi, dan estetis dengan fokus keunggulan produk.',
      template: `{Review jujur produk ini:|Spill barang recommended:|Rekomendasi produk pilihan:}\n\n{nama_produk}\n\n{Bener-bener worth to buy|Kualitasnya di luar ekspektasi|Desain dan bahannya bagus banget}. Pas banget dipakai sehari-hari.\n\nHarga: {harga} {diskon}\nKepuasan pembeli: {rating}/5 ({terjual} terjual)\n\nLink pembelian resmi:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'promo_diskon',
      name: 'Gaya Promo Diskon / Flash Sale (Clean)',
      category: 'viral',
      description: 'Gaya promo berbatas waktu dan ajakan segera checkout.',
      template: `PROMO SHOPEE ALERT!\n{nama_produk}\n\n{Lagi diskon besar|Harga turun banget|Promo spesial hari ini}!\nSekarang cuma: {harga} {diskon}\nTotal terjual: {terjual} (Rating {rating}/5)\n\nKlik link di bawah ini sebelum kehabisan:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'solusi_praktis',
      name: 'Gaya Solusi Praktis & Lifehack (Clean)',
      category: 'elektronik',
      description: 'Menyajikan produk sebagai solusi masalah sehari-hari.',
      template: `{Solusi buat yang lagi cari barang ini:|Barang berguna yang bikin hidup makin praktis:|Rekomendasi barang fungsional:}\n\n{nama_produk}\n\n{Fungsinya ngebantu banget|Praktis, awet, dan harganya super terjangkau}.\n\nHarga: {harga} {diskon}\nRating: {rating}/5 ({terjual} terjual)\n\nTautan resmi promo:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'simple_direct',
      name: 'Gaya Singkat & To The Point (Clean)',
      category: 'viral',
      description: 'Singkat, padat, langsung menaruh link pembelian tanpa bertele-tele.',
      template: `{nama_produk}\n\n{Spill link belinya di sini:|Link pembelian produk original:|Langsung checkout sebelum kehabisan:}\n{link_affiliate}\n\nHarga: {harga} {diskon} | Rating {rating}/5 ({terjual} terjual)\n\n{hashtag_random}`
    }
  ];

  /**
   * Default Hashtag Pool
   */
  const HASHTAG_BANKS = {
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
      '#CasualLook', '#LocalBrandIndo', '#StreetwearIndo', '#DressViral'
    ],
    elektronik: [
      '#GadgetMurah', '#RacunGadget', '#SetupInspiration', '#DeskSetup',
      '#TechReviewID', '#ShopeeElektronik', '#SmartHomeID', '#AksesorisHP',
      '#GadgetViral', '#TWSMurah', '#PowerbankViral', '#ShopeeTech'
    ],
    home_living: [
      '#DekorasiKamar', '#HomeLiving', '#InspirasiRumah', '#RacunHomeDecor',
      '#PeralatanDapur', '#EstetikRumah', '#AestheticRoom', '#RumahMinimalis',
      '#DapurMinimalis', '#ShopeeHome', '#OrganizerMurah', '#PerabotRumah'
    ],
    beauty: [
      '#SkincareViral', '#RacunSkincare', '#MakeupTutorial', '#GlowUpTips',
      '#SkincareRoutine', '#BeautyHacks', '#ShopeeBeauty', '#LipstikViral'
    ]
  };

  /**
   * System variable identifiers
   */
  const SYSTEM_VARIABLES = new Set([
    'nama_produk', 'product_name', 'judul', 'title', 'name',
    'harga', 'price',
    'diskon', 'discount',
    'link_affiliate', 'short_link', 'shortlink', 'link', 'url', 'affiliate_link',
    'rating', 'stars', 'rate',
    'terjual', 'sold', 'sales',
    'komisi', 'comm_rate', 'commission', 'commrate', 'estimasi_komisi',
    'kategori', 'category',
    'hashtag_random', 'hashtags'
  ]);

  class ThreadsContentService {
    constructor() {
      this.templates = [...THREADS_TEMPLATES];
      this.hashtagBanks = { ...HASHTAG_BANKS };
      this.characterLimit = 500;
    }

    getTemplates() {
      return JSON.parse(JSON.stringify(this.templates));
    }

    getTemplateById(id) {
      return this.templates.find(t => t.id === id) || this.templates[0];
    }

    /**
     * Remove emojis and non-standard symbols to ensure clean plain text
     * @param {string} str 
     * @returns {string} Clean string
     */
    stripEmojis(str) {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/[\u200D\uFE0F]/g, '')
        .replace(/[^\x00-\x7F\u0080-\u00FF\s\r\n.,!?:;'"()\-_/#%@=+]/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
    }

    /**
     * Parse nested spintax {A|B|C}
     * Safe against system variables like {nama_produk}
     * @param {string} text 
     * @returns {string}
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

        // If system variable without pipe, preserve it
        if (!content.includes('|') && SYSTEM_VARIABLES.has(content.trim().toLowerCase())) {
          parsed = parsed.slice(0, match.index) + `___SYSVAR_${content}___` + parsed.slice(match.index + match[0].length);
          continue;
        }

        const options = content.split('|');
        const chosen = options[Math.floor(Math.random() * options.length)].trim();
        parsed = parsed.slice(0, match.index) + chosen + parsed.slice(match.index + match[0].length);
      }

      parsed = parsed.replace(/___SYSVAR_([a-zA-Z0-9_]+)___/g, '{$1}');
      return parsed;
    }

    /**
     * Pick N unique hashtags randomly from category
     * @param {string} category 
     * @param {number} count 
     * @returns {string}
     */
    getRandomHashtags(category = 'viral', count = 3) {
      const bank = this.hashtagBanks[category] || this.hashtagBanks.viral;
      const shuffled = [...bank].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length)).join(' ');
    }

    /**
     * Replace all variable placeholders in text with sanitized product details
     * @param {string} text 
     * @param {Object} product 
     * @param {Object} [options] 
     * @returns {string}
     */
    replaceVariables(text, product, options = {}) {
      if (!text || typeof text !== 'string') return '';

      const p = product || {};
      const category = options.category || p.category || p.kategori || 'viral';
      const hashtagCount = options.hashtagCount !== undefined ? options.hashtagCount : 3;

      const title = (p.title || p.rawTitle || p.name || p.product_name || 'Produk Rekomendasi Shopee').trim();

      let price = (p.price || p.harga || '-').toString().trim();
      if (price !== '-' && !price.toLowerCase().startsWith('rp')) {
        price = `Rp ${price}`;
      }

      let discount = (p.discount || p.diskon || '').toString().trim();
      if (discount && !discount.includes('%') && !discount.toLowerCase().includes('diskon')) {
        discount = `(Diskon ${discount}%)`;
      } else if (discount && !discount.startsWith('(') && !discount.endsWith(')')) {
        discount = `(${discount})`;
      }

      const shortLink = (p.shortLink || p.short_link || p.affiliate_link || p.link || p.url || '').trim();

      // Clean rating: remove any existing emoji symbol and format as pure number
      let rawRating = (p.rating || p.rating_star || '4.9').toString();
      let ratingNumber = rawRating.replace(/[^0-9.]/g, '').trim() || '4.9';

      // Clean sold: remove redundant word 'terjual' to prevent '510 terjual terjual'
      let rawSold = (p.sold || p.terjual || '1rb+').toString().trim();
      let cleanSold = rawSold.replace(/terjual/gi, '').trim();
      if (!cleanSold) cleanSold = '1rb+';

      const commission = (p.commission || p.comm_rate || p.komisi || '-').toString().trim();
      const categoryName = (p.category || p.kategori || 'Rekomendasi').toString().trim();

      const randomHashtags = typeof options.randomHashtags === 'string'
        ? options.randomHashtags
        : this.getRandomHashtags(category, hashtagCount);

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
        '{shortlink}': shortLink,
        '{link}': shortLink,
        '{url}': shortLink,
        '{affiliate_link}': shortLink,

        '{rating}': ratingNumber,
        '{stars}': ratingNumber,
        '{rate}': ratingNumber,

        '{terjual}': cleanSold,
        '{sold}': cleanSold,
        '{sales}': cleanSold,

        '{komisi}': commission,
        '{comm_rate}': commission,
        '{commission}': commission,

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

      return this.formatParagraphs(result);
    }

    /**
     * Clean and format paragraphs nicely for Threads
     * @param {string} text 
     * @returns {string}
     */
    formatParagraphs(text) {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    /**
     * Generate complete ready-to-use Threads post caption
     * @param {string|Object} templateInput 
     * @param {Object} product 
     * @param {Object} [options] 
     * @returns {string}
     */
    generateCaption(templateInput, product, options = {}) {
      let rawTemplate = '';
      if (typeof templateInput === 'string') {
        const found = this.getTemplateById(templateInput);
        rawTemplate = found ? found.template : templateInput;
      } else if (templateInput && typeof templateInput.template === 'string') {
        rawTemplate = templateInput.template;
      } else {
        rawTemplate = this.templates[0].template;
      }

      const spun = this.parseSpintax(rawTemplate);
      let filled = this.replaceVariables(spun, product, options);

      if (options.cleanOnly || options.noEmoji) {
        filled = this.stripEmojis(filled);
      }

      return filled;
    }

    /**
     * Get character count and limit stats
     * @param {string} text 
     * @returns {{ length: number, remaining: number, isOverLimit: boolean, max: number }}
     */
    getCharacterStats(text) {
      const length = (text || '').length;
      return {
        length,
        remaining: this.characterLimit - length,
        isOverLimit: length > this.characterLimit,
        max: this.characterLimit
      };
    }

    /**
     * Generate standard Threads web intent URL for 1-click opening with pre-filled text
     * @param {string} text 
     * @returns {string}
     */
    getThreadsIntentUrl(text) {
      const encoded = encodeURIComponent(text || '');
      return `https://www.threads.net/intent/post?text=${encoded}`;
    }
  }

  return new ThreadsContentService();
});
