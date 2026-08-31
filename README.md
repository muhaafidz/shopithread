# 🧵 ShopiThread MY — Shopee Affiliate & Threads AutoCraft (Malaysia Edition)

> [!NOTE]
> **Fork notice:** This is a Malaysia-localized fork of the original
> [**ShopiThread** by **sodikinnaa**](https://github.com/sodikinnaa/shopithread)
> (MIT License). All credit for the original architecture goes to the original
> creator — this fork adds Bahasa Melayu caption generation tuned for the
> Shopee Malaysia market (RM currency, MY hashtags, `shopee.com.my` wiring),
> an English interface, and several bug/security fixes.

[![CI/CD & Release Package](https://github.com/muhaafidz/shopithread/actions/workflows/ci-cd-release.yml/badge.svg)](https://github.com/muhaafidz/shopithread/actions/workflows/ci-cd-release.yml)
[![Latest Release](https://img.shields.io/github/v/release/muhaafidz/shopithread?color=orange&label=Release)](https://github.com/muhaafidz/shopithread/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Website-Landing%20Page-ff5722.svg)](https://muhaafidz.github.io/shopithread/)

> **ShopiThread** is an all-in-one Google Chrome extension for Shopee Malaysia affiliate creators & marketers: scrape original HD photos, auto-generate official shortlinks (`s.shopee.com.my`), manage a CSV database (RFC 4180), and generate viral Meta Threads captions in **Bahasa Melayu** — free of broken characters.

**Interface language:** English • **Generated caption language:** Bahasa Melayu (Malaysia market, RM currency)

---

## 📹 Video Tutorial & Usage Demo

`📹 Video tutorial: coming soon — will be linked here once published.`



> 💡 **Learn the full flow** from installation, multi-page Shopee scraping, CSV export, to generating ready-to-post Threads captions — see the guide below and the User Guide tab inside the dashboard.

---

## ✨ Key Features

### 1. 🔍 Multi-Page Scraper & HD Shopee Affiliate Photos
- **Auto Detect & Pagination**: Automatically browses up to 10 pages of Shopee Affiliate product offers ([https://affiliate.shopee.com.my/offer/product_offer](https://affiliate.shopee.com.my/offer/product_offer)).
- **Official Shortlink Extraction**: Clicks the *"Get Link"* button, grabs the `s.shopee.com.my` / `shope.ee` shortlink, and closes the modal automatically.
- **HD Photo Cleanup**: Downloads original full-resolution photos without `@resize` compression.

### 2. 📊 Dedicated Dashboard & CSV Management (RFC 4180)
- **Interactive Table**: Preview product photos, prices, commissions, total sold, and link status.
- **Flexible Export**: 1-click export to **CSV**, **TXT**, or a **ZIP** archive of product photos.
- **CSV Import**: Drag & drop a product CSV file into the dashboard database. Imports are **header-aware** (English & Indonesian column names) with full RFC 4180 support (quoted commas, escaped quotes, multi-line cells); falls back to positional columns for headerless files.
- **Full CRUD**: Add, edit product details, 1-click copy links, and delete data with anti-corruption storage protection.
- **Legacy price migration**: old rows with `Rp` prices are relabeled to `RM` on load (values kept as-is).

### 3. 🧵 Threads Content Generator (Clean & Non Auto-Posting)
- **Bahasa Melayu Copywriting Templates** (Malaysian casual "rojak" style):
  - *Casual / Racun Shopee (Rojak)*
  - *Honest Review (Rojak)*
  - *Flash Sale / Diskaun Alert*
  - *Practical & Lifehack*
  - *Short & Direct CTA*
  - *Jom Jimat / Budget Finds*
  - *Ramai Tanya / Restock Alert*
- **Malaysia Hashtag Banks**: Category-based hashtags used by real MY affiliates (#RacunShopee, #ShopeeMY, #MurahGila, #JomShopee, #FYP, ...).
- **Clean Text Format**: Free from the broken icon/emoji unicode that often fails to render on Threads web.
- **Spintax Engine**: Automatically randomizes words & hooks (`🎲 Spin Variation`).
- **Symbol Cleaner**: 1-click `🧹 Clean Symbols` button to keep captions 100% compatible.
- **Assisted Posting**: `📋 Copy Threads Caption`, `🔗 Open Threads.net`, and `✍️ Fill into Threads Tab` buttons (no auto-submit click, keeping full creator control).

---

## 🚀 How to Download & Install the Extension (Ready to Import)

### Method 1: Download the Ready-to-Import Release (Recommended)
1. Open the **[Latest Release](https://github.com/muhaafidz/shopithread/releases/latest)** page.
2. Download the **`shopee-affiliate-threads-extension-v1.1.1.zip`** asset file.
3. Extract the ZIP file to a folder on your computer.
4. Open Google Chrome and go to: `chrome://extensions`.
5. Enable **Developer mode** in the top-right corner.
6. Click **Load unpacked**, then select the extracted folder.
7. The extension is ready to use! 🎉

---

## 📁 Project Module Structure (Clean Architecture)

```
.
├── index.html                      # Official ShopiThread landing page
├── docs/                           # Documentation & GitHub Pages deployment
├── .github/workflows/
│   └── ci-cd-release.yml           # CI/CD pipeline & automated release zip packaging
├── libs/
│   ├── market-config.js            # Market configuration (currency, domains, content defaults)
│   ├── csv-service.js              # RFC 4180 CSV generator/parser, TXT & ZIP services
│   ├── storage-service.js          # chrome.storage.local abstraction with localStorage fallback
│   ├── shopee-scraper-service.js   # Multi-page DOM scraper & shortlink extractor
│   ├── threads-content-service.js  # Threads caption generator (BM), spintax, & text cleaner
│   ├── constants.js                # Central constants, presets, hashtag banks
│   ├── spintax.js                  # Nested spintax parser & dynamic caption engine
│   ├── db.js                       # Queue/settings/product database layer
│   └── jszip.min.js                # JSZip image compression library
├── dashboard/
│   ├── dashboard.html              # Dedicated Dashboard UI (Products Table, Threads Generator, CSV)
│   ├── dashboard.css               # Modern glassmorphism styling
│   └── dashboard.js                # Dashboard controller & event listeners
├── panel/
│   ├── poster-panel.html           # Threads single-post controller panel
│   ├── poster-panel.css            # Panel styling
│   └── poster-panel.js             # Poster panel controller & live debug console
├── popup/
│   ├── popup.html                  # Toolbar mini popup
│   ├── popup.css                   # Toolbar styling
│   └── popup.js                    # Quick trigger controller
├── content.js                      # In-page orchestrator & floating UI on Shopee
├── threads-content.js              # Threads auto-post engine (queue, composer injection)
├── content.css                     # Floating panel styling
├── background.js                   # Service Worker background message router
├── manifest.json                   # Chrome Extension Manifest V3
└── test-dashboard.js               # Unit & integration test suite
```

---

## 🧪 Syntax Validation & Testing

To run the automated tests:
```bash
npm test
# or
node -c libs/*.js content.js dashboard/dashboard.js popup/popup.js background.js && node test-dashboard.js
```

---

## 📄 License

Distributed under the MIT License. Free to use and develop for the affiliate marketing community.
