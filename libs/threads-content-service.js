/**
 * @file threads-content-service.js
 * @description Threads Content Service for generating captions, managing spintax variations,
 * formatting clean text for Threads posts without broken icon characters.
 * Copy is native Bahasa Melayu (casual rojak style) tuned for the Malaysia market.
 * Pure modular utility with zero auto-loop/scheduler.
 *
 * Target: Google Chrome Extension Manifest V3 (Content Script, Popup, Dashboard, Service Worker, Node.js)
 * @license MIT
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let market = null;
    try { market = require('./market-config.js'); } catch (_) {}
    module.exports = factory(market);
  } else {
    root.ThreadsContentService = factory(root.ShopiThreadMarket || null);
  }
})(typeof self !== 'undefined' ? self : this, function (MARKET) {
  'use strict';

  // Market defaults (override via libs/market-config.js)
  MARKET = MARKET || {
    currency: 'RM',
    defaultProductTitle: 'Produk Pilihan Shopee',
    defaultSold: '1k+ terjual',
    defaultRating: '4.9',
    discountLabel: 'Diskaun',
    soldLabel: 'terjual'
  };

  /**
   * Default Threads Preset Templates - Clean Text Format (No broken icons/emojis)
   * Tone: casual rojak Bahasa Melayu (Malaysian affiliate style)
   */
  const THREADS_TEMPLATES = [
    {
      id: 'racun_shopee',
      name: 'Casual / Racun Shopee (Rojak)',
      category: 'viral',
      description: 'Hook-first casual style, the highest engagement format for Malaysian affiliate posts.',
      template: `{Gila best barang ni!|Memang wajib ada!|Tak sangka sebagus ni!|Cantik sangat sampai nak share!}\n{Dah viral sekarang|Ramai yang cari|Pilihan paling hot masa ni}: {nama_produk}\n\n{Harga cuma|Dapat harga murah|Cuma}: {harga} {diskon}\nRating {rating}/5 | {terjual} terjual\n\n{Jom checkout kat sini|Link kat sini, jangan tak tahu|Sini saya kongsi linknya}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'edukasi_review',
      name: 'Honest Review (Rojak)',
      category: 'home_living',
      description: 'Conversational first-person review that feels like a real recommendation, not an ad.',
      template: `{Pendapat jujur pasal barang ni|Dah try sendiri, ni review jujur|Ni bukan iklan, review betul-betul}\n\n{nama_produk}\n\n{Memang berbaloi, kualiti lebih dari harga|Kualiti cantik, harga jimat|Sangat berbaloi, guna hari-hari}. {Tak menyesal beli|Repeat order pun ok}.\n\nHarga: {harga} {diskon}\nRating {rating}/5 ({terjual} terjual)\n\n{Nak beli? Link rasmi kat sini|Sesiapa nak link, sini saya letak}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'promo_diskon',
      name: 'Flash Sale / Diskaun Alert',
      category: 'viral',
      description: 'Urgency-driven promo style for limited-time discounts and campaigns.',
      template: `PROMO SHOPEE MALAYSIA!\n{nama_produk}\n\n{Diskaun besar tengah jalan|Harga dah jatuh gila murah|Promo terhad masa je ni}!\nSekarang cuma: {harga} {diskon}\n{terjual} terjual | Rating {rating}/5\n\n{Jom grab sebelum habis|Checkout laju-laju sebelum balik ke harga asal|Jangan tunggu lama-lama, klik sini}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'solusi_praktis',
      name: 'Practical & Lifehack',
      category: 'elektronik',
      description: 'Positions the product as a everyday problem solver worth the money.',
      template: `{Barang ni memang selesaikan hidup|Lifehack: barang wajib ada kat rumah|Penyelesaian untuk masalah harian korang}\n\n{nama_produk}\n\n{Fungsinya memang membantu, guna setiap hari|Praktikal, tahan lama & harga berbaloi}.\n\nHarga: {harga} {diskon}\nRating {rating}/5 ({terjual} terjual)\n\n{Nak tengok detail? Kat sini|Pautan produk kat bawah}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'simple_direct',
      name: 'Short & Direct CTA',
      category: 'viral',
      description: 'Short, punchy, link-first. Best for reply-style Threads posts.',
      template: `{nama_produk}\n\n{Ramai tanya link ni - sini saya kongsi|Link beli kat sini|Checkout terus sebelum habis}:\n{link_affiliate}\n\nHarga: {harga} {diskon} | Rating {rating}/5 ({terjual} terjual)\n\n{hashtag_random}`
    },
    {
      id: 'jimat_budget',
      name: 'Jom Jimat / Budget Finds',
      category: 'viral',
      description: 'Budget-hunter angle: cheap but good, perfect for murah-gila audience.',
      template: `{Jom jimat! Barang cantik harga murah|Belanja sikit, dapat barang best|Murah tapi bukan murahan}\n\n{nama_produk}\n\n{Harga sejimat ni memang taknak lepas|Singgah je Shopee, terserempak barang ni - tak rugi beli}.\n\nHarga cuma: {harga} {diskon}\nRating {rating}/5 | {terjual} terjual\n\n{Korang pun boleh jimat, link kat sini|Sini link untuk yang nak jimat sama}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'restock_alert',
      name: 'Ramai Tanya / Restock Alert',
      category: 'viral',
      description: 'Restock / "many asked for the link" format that drives fast clicks.',
      template: `{RESTOCK ALERT!|Stok dah masuk balik!|Yang tanya link tu, stok baru dah ada ni}\n\n{nama_produk}\n\n{Sebelum ni sold out, sekarang dah balik|Ramai tunggu barang ni, cepat grab}.\n\nHarga sekarang: {harga} {diskon}\n{terjual} terjual | Rating {rating}/5\n\n{Link restock kat sini|Jangan cakap takde link, sini}:\n{link_affiliate}\n\n{hashtag_random}`
    }
  ];

  /**
   * Default Hashtag Pool - Malaysia market
   */
  const HASHTAG_BANKS = {
    viral: [
      '#RacunShopee', '#RacunShopeeMY', '#ShopeeMY', '#ShopeeMalaysia',
      '#ShopeeHaul', '#ShopeeCheck', '#ShopeeLook', '#JomShopee',
      '#MurahGila', '#BorongShopee', '#DiskaunShopee', '#BarangViral',
      '#RacunBelanja', '#JomBeli', '#PromoShopee', '#ShopeeFinds',
      '#FYP', '#TikTokMalaysia'
    ],
    fashion: [
      '#OOTDMalaysia', '#BajuMurah', '#FesyenMurah', '#FesyenViral',
      '#HijabStyle', '#TudungViral', '#LocalBrandMY', '#DressViral',
      '#BajuViral', '#KasutViral', '#TasViral', '#OutfitInspo',
      '#StreetwearMY', '#KoreanStyleMY', '#BajuKekinian', '#ShoppingShopee'
    ],
    elektronik: [
      '#GadgetMurah', '#GadgetViral', '#TechMY', '#AksesoriPhone',
      '#PhoneCaseMurah', '#TWSMurah', '#PowerbankViral', '#MechanicalKeyboard',
      '#GamingSetup', '#SmartHomeMY', '#DeskSetup', '#EarphoneWireless',
      '#GadgetMY', '#BarangGuna'
    ],
    home_living: [
      '#DekorRumah', '#HomeLivingMY', '#InspirasiRumah', '#DapurCantik',
      '#RumahCantik', '#AestheticRoom', '#OrganizerMurah', '#PerabotMurah',
      '#RumahMinimalis', '#MakeoverRumah', '#BarangDapur', '#RumahImpian'
    ],
    beauty: [
      '#SkincareViral', '#RacunSkincare', '#MakeupViral', '#BeautyMY',
      '#GlowUpTips', '#SkincareRoutine', '#LipstikViral', '#SunscreenReview',
      '#SkincareMurah', '#CushionViral', '#TipsCantik', '#GlowingSkin'
    ],
    food_snack: [
      '#MakananViral', '#SnekViral', '#SnackMurah', '#FoodieMY',
      '#JajanViral', '#MakananPedas', '#FrozenFood', '#KuihViral',
      '#MakananEnak', '#JajanShopee', '#SnekMurah', '#MukbangMY'
    ]
  };

  /**
   * System variable identifiers
   */
  const SYSTEM_VARIABLES = new Set([
    'nama_produk', 'product_name', 'judul', 'title', 'name',
    'harga', 'price',
    'diskon', 'discount', 'diskaun',
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

      const title = (p.title || p.rawTitle || p.name || p.product_name || MARKET.defaultProductTitle).trim();

      const currency = MARKET.currency || 'RM';
      let price = (p.price || p.harga || '-').toString().trim();
      if (price !== '-' && !price.toLowerCase().startsWith(currency.toLowerCase())) {
        price = `${currency} ${price.replace(/^Rp\s*/i, '')}`;
      }

      const discountLabel = MARKET.discountLabel || 'Diskaun';
      let discount = (p.discount || p.diskon || p.diskaun || '').toString().trim();
      if (discount && !discount.includes('%') && !/disk[oa]n/i.test(discount)) {
        discount = `(${discountLabel} ${discount}%)`;
      } else if (discount && !discount.startsWith('(') && !discount.endsWith(')')) {
        discount = `(${discount})`;
      }

      const shortLink = (p.shortLink || p.short_link || p.affiliate_link || p.link || p.url || '').trim();

      // Clean rating: remove any existing emoji symbol and format as pure number
      let rawRating = (p.rating || p.rating_star || MARKET.defaultRating).toString();
      let ratingNumber = rawRating.replace(/[^0-9.]/g, '').trim() || (MARKET.defaultRating || '4.9');

      // Clean sold: remove redundant word 'terjual' to prevent '510 terjual terjual'
      let rawSold = (p.sold || p.terjual || MARKET.defaultSold).toString().trim();
      let cleanSold = rawSold.replace(/terjual/gi, '').replace(/\bjuta\b/gi, '').trim() || '1k+';

      const commission = (p.commission || p.comm_rate || p.komisi || '-').toString().trim();
      const categoryName = (p.category || p.kategori || 'Pilihan').toString().trim();

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
        '{diskaun}': discount,
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
        const found = this.templates.find(t => t.id === templateInput);
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
