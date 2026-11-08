require('dotenv').config();
const path = require('path');
const fs = require('fs');
const WhatsAppSender = require('./whatsapp/sender');
const TikTokListener = require('./tiktok/listener');
const { convertToWebP } = require('./converter/sticker');
const { log, ensureDir, sleep } = require('./utils/helpers');

const POLLING_INTERVAL = (parseInt(process.env.POLLING_INTERVAL) || 15) * 1000;
const TEMP_DIR = process.env.TEMP_DIR || './temp';

let isProcessing = false;
let whatsapp;
let tiktok;

async function processStickers() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const newStickers = await tiktok.checkNewStickers();

    for (const sticker of newStickers) {
      try {
        ensureDir(TEMP_DIR);
        const timestamp = Date.now();
        const downloadPath = path.join(TEMP_DIR, `sticker_${timestamp}.webp`);
        const outputPath = path.join(TEMP_DIR, `sticker_${timestamp}_out.webp`);

        log(`⬇️ Descargando sticker: ${sticker.msgId}`);
        await tiktok.downloadSticker(sticker.src, downloadPath);

        const result = await convertToWebP(downloadPath, outputPath);

        if (result.success) {
          await whatsapp.sendSticker(outputPath, result.animated);
        } else {
          log(`❌ Error convirtiendo sticker ${sticker.msgId}`);
        }

        // Cleanup temp files
        try { fs.unlinkSync(downloadPath); } catch (e) {}
        try { fs.unlinkSync(outputPath); } catch (e) {}

      } catch (err) {
        log(`❌ Error procesando sticker ${sticker.msgId}: ${err.message}`);
      }
    }
  } catch (err) {
    log(`❌ Error en ciclo de polling: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

async function main() {
  log('🚀 Iniciando bot de stickers TikTok → WhatsApp');

  // Connect WhatsApp
  whatsapp = new WhatsAppSender();
  await whatsapp.connect();

  // Send startup message
  await whatsapp.sendText('🟢 Bot de stickers activado ✅');

  // Init TikTok listener
  tiktok = new TikTokListener(process.env.TIKTOK_USERNAME);
  await tiktok.init();

  // Polling loop
  log(`⏱️ Polling cada ${POLLING_INTERVAL / 1000} segundos`);
  setInterval(processStickers, POLLING_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log('🛑 Apagando bot...');
    try {
      await whatsapp.sendText('🔴 Bot de stickers desactivado ❌');
      await sleep(1000);
    } catch (e) {}
    try { await tiktok.close(); } catch (e) {}
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('🛑 Apagando bot...');
    try {
      await whatsapp.sendText('🔴 Bot de stickers desactivado ❌');
      await sleep(1000);
    } catch (e) {}
    try { await tiktok.close(); } catch (e) {}
    process.exit(0);
  });
}

main().catch((err) => {
  log(`💥 Error fatal: ${err.message}`);
  process.exit(1);
});
