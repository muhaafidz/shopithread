/**
 * @file market-config.js
 * @description Central market configuration for ShopiThread.
 * Single source of truth for the target market: currency, locale, domains, and
 * content defaults. Switch market by editing this file only.
 *
 * Compatible across Chrome Extension MV3 contexts: Content Scripts, Popup,
 * Dashboard, Poster Panel, Service Worker, and Node.js.
 *
 * @license MIT
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShopiThreadMarket = factory();
    root.MARKET = root.ShopiThreadMarket;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    // Market identity
    country: 'MY',
    locale: 'ms-MY',

    // Currency
    currency: 'RM',

    // Shopee Malaysia domains
    shopeeDomain: 'shopee.com.my',
    affiliateOfferUrl: 'https://affiliate.shopee.com.my/offer/product_offer',

    // Affiliate shortlink hosts accepted/generated in this market
    shortlinkHosts: ['s.shopee.com.my', 'shope.ee'],
    fallbackShortlink: 'https://s.shopee.com.my',

    // Content generation defaults (Bahasa Melayu)
    defaultProductTitle: 'Produk Pilihan Shopee',
    defaultSold: '1k+ terjual',
    defaultRating: '4.9',
    discountLabel: 'Diskaun',
    soldLabel: 'terjual',

    // UI clock label
    timezoneLabel: 'MYT'
  };
});
