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
   * Preset Spintax Templates
   */
  const PRESET_TEMPLATES = [
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
   * Categorized Hashtag Bank
   */
  const HASHTAG_BANK = {
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
    QUEUE_COLUMNS
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
  }
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof self !== 'undefined' ? self
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
