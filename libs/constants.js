/**
 * @file constants.js
 * @description Centralized Constants for Shopee Affiliate Downloader & Threads Auto-Poster
 * Compatible across Chrome Extension MV3 contexts: Content Scripts, Popup, Dashboard, Service Worker, and Node.js.
 * 
 * @author sodikinnaa
 * @license MIT
 */

(function (root) {
  'use strict';

  /**
   * Runtime Message Action Types
   * Used for communication between Content Scripts, Popup, Dashboard, and Service Worker.
   */
  const ACTIONS = {
    // Queue Operations
    ADD_TO_QUEUE: 'ADD_TO_QUEUE',
    ADD_BATCH_TO_QUEUE: 'ADD_BATCH_TO_QUEUE',
    GET_QUEUE: 'GET_QUEUE',
    UPDATE_QUEUE_ITEM: 'UPDATE_QUEUE_ITEM',
    DELETE_QUEUE_ITEM: 'DELETE_QUEUE_ITEM',
    CLEAR_QUEUE: 'CLEAR_QUEUE',
    GET_QUEUE_STATS: 'GET_QUEUE_STATS',
    POST_SINGLE_ITEM: 'POST_SINGLE_ITEM',
    POST_NEXT_ITEM: 'POST_NEXT_ITEM',
    EXECUTE_POST_NOW: 'EXECUTE_POST_NOW',

    // Queue Alarm & Scheduler Controls
    START_QUEUE: 'START_QUEUE',
    START_QUEUE_ALARM: 'START_QUEUE_ALARM',
    STOP_QUEUE: 'STOP_QUEUE',
    STOP_QUEUE_ALARM: 'STOP_QUEUE_ALARM',
    PAUSE_QUEUE: 'PAUSE_QUEUE',
    GET_QUEUE_STATUS: 'GET_QUEUE_STATUS',

    // Threads Composer & Injection & Widget
    INJECT_POST_PAYLOAD: 'INJECT_POST_PAYLOAD',
    FOCUS_OR_OPEN_THREADS: 'FOCUS_OR_OPEN_THREADS',
    OPEN_THREADS_WIDGET: 'OPEN_THREADS_WIDGET',

    // Broadcast Events & Desktop Notifications
    QUEUE_UPDATED: 'QUEUE_UPDATED',
    QUEUE_STATUS_CHANGED: 'QUEUE_STATUS_CHANGED',
    POST_COMPLETED: 'POST_COMPLETED',
    POST_FAILED: 'POST_FAILED',
    NOTIFY_POST_SUCCESS: 'NOTIFY_POST_SUCCESS',
    NOTIFY_POST_FAILED: 'NOTIFY_POST_FAILED',

    // Activity & Debug Logs
    GET_LOGS: 'GET_LOGS',
    ADD_LOG: 'ADD_LOG',
    DELETE_LOG: 'DELETE_LOG',
    CLEAR_LOGS: 'CLEAR_LOGS',
    DEBUG_LOG_STREAM: 'DEBUG_LOG_STREAM',

    // Settings
    GET_SETTINGS: 'GET_SETTINGS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',

    // Navigation & Window
    OPEN_DASHBOARD: 'OPEN_DASHBOARD',
    OPEN_POSTER_PANEL: 'OPEN_POSTER_PANEL',

    // Scraper & Affiliate Actions
    SCRAPE_PRODUCT_DATA: 'SCRAPE_PRODUCT_DATA',
    GENERATE_SHORTLINK: 'GENERATE_SHORTLINK',
    DOWNLOAD_IMAGES: 'DOWNLOAD_IMAGES',
    DOWNLOAD_ZIP: 'DOWNLOAD_ZIP'
  };

  /**
   * Chrome Storage Keys
   */
  const STORAGE_KEYS = {
    QUEUE: 'threads_queue',
    LOGS: 'threads_logs',
    HISTORY: 'threads_history', // Alias for backwards compatibility
    SETTINGS: 'threads_settings',
    TEMPLATES: 'threads_templates',
    PRODUCTS: 'threads_products'
  };

  /**
   * Queue Item Statuses
   */
  const QUEUE_STATUS = {
    PENDING: 'PENDING',
    POSTING: 'POSTING',
    PROCESSING: 'POSTING', // Alias
    POSTED: 'POSTED',
    FAILED: 'FAILED'
  };

  /**
   * Default Extension Settings
   */
  const DEFAULT_SETTINGS = {
    intervalMinutes: 15,
    interval_minutes: 15,
    jitterSeconds: 60,
    jitter_seconds: 60,
    dailyLimit: 25,
    daily_post_limit: 25,
    isQueueRunning: false,
    activeTemplateId: 'preset_racun_viral',
    active_template_id: 'preset_racun_viral',
    hashtagCategory: 'viral',
    hashtag_category: 'viral',
    hashtagCount: 4,
    hashtag_count: 4,
    customHashtagBanks: null,
    autoRetry: true,
    auto_retry: true,
    maxRetries: 3,
    max_retries: 3,
    workingHoursEnabled: false,
    working_hours_enabled: false,
    workingHoursStart: '08:00',
    working_hours_start: '08:00',
    workingHoursEnd: '22:00',
    working_hours_end: '22:00',
    subId1: 'threads',
    sub_id_1: 'threads',
    subId2: 'autopost',
    sub_id_2: 'autopost',
    subId3: '',
    sub_id_3: '',
    autoStart: false,
    notification: true
  };

  /**
   * Preset Spintax Templates - Bahasa Melayu (Malaysia market, casual rojak)
   */
  const PRESET_TEMPLATES = [
    {
      id: 'preset_racun_viral',
      name: 'Racun Shopee Viral (Rojak)',
      category: 'viral',
      isDefault: true,
      is_default: true,
      template: `{Gila best barang ni!|Memang wajib ada!|Tak sangka sebagus ni!|Cantik sangat sampai nak share!}\n{Dah viral sekarang|Ramai yang cari|Pilihan paling hot masa ni}: {nama_produk}\n\nHarga: {harga} {diskon}\nRating {rating}/5 | {terjual} terjual\n\n{Jom checkout kat sini|Link kat sini, jangan tak tahu|Sini saya kongsi linknya}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_aesthetic_review',
      name: 'Honest Review (Rojak)',
      category: 'home_living',
      isDefault: false,
      is_default: false,
      template: `{Pendapat jujur pasal barang ni|Dah try sendiri, ni review jujur|Ni bukan iklan, review betul-betul}\n\n{nama_produk}\n\n{Memang berbaloi, kualiti lebih dari harga|Kualiti cantik, harga jimat|Sangat berbaloi, guna hari-hari}. {Tak menyesal beli|Repeat order pun ok}.\n\nHarga: {harga} {diskon}\nRating {rating}/5 ({terjual} terjual)\n\n{Nak beli? Link rasmi kat sini|Sesiapa nak link, sini saya letak}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_diskon_promo',
      name: 'Flash Sale & Diskaun Alert',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `PROMO SHOPEE MALAYSIA!\n{nama_produk}\n\n{Diskaun besar tengah jalan|Harga dah jatuh gila murah|Promo terhad masa je ni}!\nSekarang cuma: {harga} {diskon}\n{terjual} terjual | Rating {rating}/5\n\n{Jom grab sebelum habis|Checkout laju-laju sebelum balik ke harga asal}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_solusi_lifehack',
      name: 'Practical & Lifehack',
      category: 'elektronik',
      isDefault: false,
      is_default: false,
      template: `{Barang ni memang selesaikan hidup|Lifehack: barang wajib ada kat rumah|Penyelesaian untuk masalah harian korang}\n\n{nama_produk}\n\n{Fungsinya memang membantu, guna setiap hari|Praktikal, tahan lama & harga berbaloi}.\n\nHarga: {harga} {diskon}\nRating {rating}/5 ({terjual} terjual)\n\n{Nak tengok detail? Kat sini|Pautan produk kat bawah}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_simple_direct',
      name: 'Short & Direct CTA',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `{nama_produk}\n\n{Ramai tanya link ni - sini saya kongsi|Link beli kat sini|Checkout terus sebelum habis}:\n{link_affiliate}\n\nHarga: {harga} {diskon} | Rating {rating}/5 ({terjual} terjual)\n\n{hashtag_random}`
    },
    {
      id: 'preset_jimat_budget',
      name: 'Jom Jimat / Budget Finds',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `{Jom jimat! Barang cantik harga murah|Belanja sikit, dapat barang best|Murah tapi bukan murahan}\n\n{nama_produk}\n\n{Harga sejimat ni memang taknak lepas|Singgah je Shopee, terserempak barang ni - tak rugi beli}.\n\nHarga cuma: {harga} {diskon}\nRating {rating}/5 | {terjual} terjual\n\n{Korang pun boleh jimat, link kat sini|Sini link untuk yang nak jimat sama}:\n{link_affiliate}\n\n{hashtag_random}`
    },
    {
      id: 'preset_restock_alert',
      name: 'Ramai Tanya / Restock Alert',
      category: 'viral',
      isDefault: false,
      is_default: false,
      template: `{RESTOCK ALERT!|Stok dah masuk balik!|Yang tanya link tu, stok baru dah ada ni}\n\n{nama_produk}\n\n{Sebelum ni sold out, sekarang dah balik|Ramai tunggu barang ni, cepat grab}.\n\nHarga sekarang: {harga} {diskon}\n{terjual} terjual | Rating {rating}/5\n\n{Link restock kat sini|Jangan cakap takde link, sini}:\n{link_affiliate}\n\n{hashtag_random}`
    }
  ];

  /**
   * Categorized Hashtag Bank - Malaysia market
   */
  const HASHTAG_BANK = {
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
   * Standard Column Mapping for CSV Exports/Imports
   */
  const QUEUE_COLUMNS = [
    { key: 'id', header: 'id', label: 'id' },
    { key: 'title', header: 'nama_produk', label: 'nama_produk' },
    { key: 'price', header: 'harga', label: 'harga' },
    { key: 'discount', header: 'diskon', label: 'diskon' },
    { key: 'rating', header: 'rating', label: 'rating' },
    { key: 'sold', header: 'terjual', label: 'terjual' },
    { key: 'commission', header: 'estimasi_komisi', label: 'estimasi_komisi' },
    { key: 'shortLink', header: 'link_affiliate', label: 'link_affiliate' },
    { key: 'primaryImage', header: 'foto_produk', label: 'foto_produk' },
    { key: 'imageUrls', header: 'url_foto_hd', label: 'url_foto_hd' },
    { key: 'caption', header: 'caption_threads', label: 'caption_threads' },
    { key: 'status', header: 'status', label: 'status' },
    { key: 'scheduleTime', header: 'waktu_jadwal', label: 'waktu_jadwal' },
    { key: 'postedAt', header: 'waktu_post', label: 'waktu_post' },
    { key: 'threadsUrl', header: 'link_post_threads', label: 'link_post_threads' },
    { key: 'createdAt', header: 'waktu_dibuat', label: 'waktu_dibuat' }
  ];

  /**
   * Market Configuration (synced with libs/market-config.js)
   */
  const MARKET = {
    country: 'MY',
    locale: 'ms-MY',
    currency: 'RM',
    shopeeDomain: 'shopee.com.my',
    affiliateOfferUrl: 'https://affiliate.shopee.com.my/offer/product_offer',
    shortlinkHosts: ['s.shopee.com.my', 'shope.ee'],
    fallbackShortlink: 'https://s.shopee.com.my',
    defaultProductTitle: 'Produk Pilihan Shopee',
    defaultSold: '1k+ terjual',
    defaultRating: '4.9',
    discountLabel: 'Diskaun',
    soldLabel: 'terjual',
    timezoneLabel: 'MYT'
  };

  /**
   * Unified Constants Container
   */
  const CONSTANTS = {
    ACTIONS,
    MESSAGE_ACTIONS: ACTIONS,
    STORAGE_KEYS,
    QUEUE_STATUS,
    DEFAULT_SETTINGS,
    DEFAULT_TEMPLATES: PRESET_TEMPLATES,
    PRESET_TEMPLATES,
    HASHTAG_BANK,
    DEFAULT_HASHTAGS: HASHTAG_BANK,
    QUEUE_COLUMNS,
    MARKET,
    Market: MARKET
  };

  // Export for CommonJS (Node.js)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
    module.exports.CONSTANTS = CONSTANTS;
    module.exports.ExtensionConstants = CONSTANTS;
    module.exports.ACTIONS = ACTIONS;
    module.exports.MESSAGE_ACTIONS = ACTIONS;
    module.exports.STORAGE_KEYS = STORAGE_KEYS;
    module.exports.QUEUE_STATUS = QUEUE_STATUS;
    module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    module.exports.DEFAULT_TEMPLATES = PRESET_TEMPLATES;
    module.exports.PRESET_TEMPLATES = PRESET_TEMPLATES;
    module.exports.HASHTAG_BANK = HASHTAG_BANK;
    module.exports.DEFAULT_HASHTAGS = HASHTAG_BANK;
    module.exports.QUEUE_COLUMNS = QUEUE_COLUMNS;
    module.exports.MARKET = MARKET;
    module.exports.Market = MARKET;
  }

  // Export to global scope (Browser Window, Content Script, Service Worker)
  if (root) {
    root.CONSTANTS = CONSTANTS;
    root.ExtensionConstants = CONSTANTS;
    root.ACTIONS = ACTIONS;
    root.MESSAGE_ACTIONS = ACTIONS;
    root.STORAGE_KEYS = STORAGE_KEYS;
    root.QUEUE_STATUS = QUEUE_STATUS;
    root.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    root.DEFAULT_TEMPLATES = PRESET_TEMPLATES;
    root.PRESET_TEMPLATES = PRESET_TEMPLATES;
    root.HASHTAG_BANK = HASHTAG_BANK;
    root.DEFAULT_HASHTAGS = HASHTAG_BANK;
    root.QUEUE_COLUMNS = QUEUE_COLUMNS;
    root.MARKET = MARKET;
    root.Market = MARKET;
  }
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof self !== 'undefined' ? self
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
