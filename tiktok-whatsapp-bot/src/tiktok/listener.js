const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { log, ensureDir, sleep, humanDelay } = require('../utils/helpers');

const STATE_FILE = '.sticker-state.json';
const MAX_TRACKED = 500;

class TikTokListener {
  constructor(username) {
    this.username = username;
    this.browser = null;
    this.page = null;
    this.processedIds = new Set();
    this.keepaliveInterval = null;
    this._loadState();
  }

  _loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (data.processedIds && Array.isArray(data.processedIds)) {
          this.processedIds = new Set(data.processedIds);
          log(`📂 Estado cargado: ${this.processedIds.size} stickers procesados anteriormente`);
        }
      }
    } catch (err) {
      log(`⚠️ Error cargando estado: ${err.message}`);
    }
  }

  _saveState() {
    try {
      const ids = Array.from(this.processedIds).slice(-MAX_TRACKED);
      fs.writeFileSync(STATE_FILE, JSON.stringify({ processedIds: ids }, null, 2));
    } catch (err) {
      log(`⚠️ Error guardando estado: ${err.message}`);
    }
  }

  async init() {
    log('🌐 Abriendo TikTok...');

    this.browser = await chromium.launchPersistentContext('.tiktok-session', {
      headless: false,
      viewport: { width: 1280, height: 800 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-hang-monitor',
      ],
    });

    this.page = this.browser.pages()[0] || await this.browser.newPage();

    // Navigate to DMs
    await this.page.goto('https://www.tiktok.com/messages', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);

    // Start keepalive to prevent tab throttling
    this.keepaliveInterval = setInterval(async () => {
      try {
        await this.page.evaluate(() => window.__keepalive = Date.now());
      } catch (e) {}
    }, 5000);

    log('✅ TikTok DMs abierto');
  }

  async _openConversation() {
    try {
      // Get all conversation items in sidebar
      const conversations = await this.page.$$('[data-e2e="dm-new-conversation-item"]');

      if (conversations.length < 2) {
        // Only one conversation, just click it
        if (conversations.length === 1) {
          await conversations[0].click();
          await sleep(2000);
        }
        return;
      }

      // Click second conversation first to force reload
      await conversations[1].click();
      await sleep(1500);

      // Now click the first (target) conversation
      await conversations[0].click();
      await sleep(2000);
    } catch (err) {
      log(`⚠️ Error abriendo conversación: ${err.message}`);
    }
  }

  async _getStickersWithMsgId() {
    try {
      return await this.page.evaluate(() => {
        const results = [];
        const chatItems = document.querySelectorAll('[data-e2e="dm-new-chat-item"]');

        chatItems.forEach(item => {
          const stickerImg = item.querySelector('img[alt="sticker"]');
          if (stickerImg) {
            // Get the data-index from the parent message container
            let parent = item;
            let msgId = null;
            while (parent) {
              if (parent.getAttribute && parent.getAttribute('data-index')) {
                msgId = parent.getAttribute('data-index');
                break;
              }
              parent = parent.parentElement;
            }

            // Fallback: use the item's own data-index
            if (!msgId) {
              msgId = item.getAttribute('data-index');
            }

            if (msgId && stickerImg.src) {
              results.push({
                msgId,
                src: stickerImg.src,
              });
            }
          }
        });

        return results;
      });
    } catch (err) {
      log(`⚠️ Error obteniendo stickers: ${err.message}`);
      return [];
    }
  }

  async checkNewStickers() {
    // Force conversation reload
    await this._openConversation();

    const stickers = await this._getStickersWithMsgId();
    const newStickers = [];

    for (const sticker of stickers) {
      if (!this.processedIds.has(sticker.msgId)) {
        newStickers.push(sticker);
        this.processedIds.add(sticker.msgId);
      }
    }

    if (newStickers.length > 0) {
      this._saveState();
      log(`🔍 Encontrados ${newStickers.length} sticker(s) nuevo(s)`);
    }

    return newStickers;
  }

  async downloadSticker(url, outputPath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(outputPath);

      protocol.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return this.downloadSticker(response.headers.location, outputPath).then(resolve).catch(reject);
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      }).on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });
  }

  async close() {
    if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
    if (this.browser) await this.browser.close();
  }
}

module.exports = TikTokListener;
