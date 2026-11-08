const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { log } = require('../utils/helpers');

class WhatsAppSender {
  constructor() {
    this.sock = null;
    this.groupId = process.env.WHATSAPP_GROUP_ID;
    this.isReady = false;
  }

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState('.whatsapp-session');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
    });

    this.sock.ev.on('creds.update', saveCreds);

    return new Promise((resolve, reject) => {
      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          log('📱 Escanea el código QR con WhatsApp:');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          const reason = lastDisconnect?.error?.output?.statusCode;
          if (reason !== DisconnectReason.loggedOut) {
            log('🔄 Reconectando WhatsApp...');
            this.connect().then(resolve).catch(reject);
          } else {
            log('❌ WhatsApp desconectado. Borra .whatsapp-session/ y vuelve a vincular.');
            reject(new Error('WhatsApp logged out'));
          }
        }

        if (connection === 'open') {
          log('✅ WhatsApp conectado');
          this.isReady = true;
          resolve();
        }
      });
    });
  }

  async sendSticker(webpPath, isAnimated = false) {
    if (!this.isReady) throw new Error('WhatsApp no está conectado');
    const buffer = fs.readFileSync(webpPath);
    await this.sock.sendMessage(this.groupId, {
      sticker: buffer,
      isAnimated: isAnimated,
    });
    log(`📤 Sticker enviado al grupo (animado: ${isAnimated})`);
  }

  async sendText(text) {
    if (!this.isReady) throw new Error('WhatsApp no está conectado');
    await this.sock.sendMessage(this.groupId, { text });
    log(`📤 Mensaje enviado: ${text}`);
  }
}

module.exports = WhatsAppSender;
