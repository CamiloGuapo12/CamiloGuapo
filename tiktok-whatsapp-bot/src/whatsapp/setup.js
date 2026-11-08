require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { log } = require('../utils/helpers');

async function setup() {
  log('🔧 Configuración de WhatsApp');
  const { state, saveCreds } = await useMultiFileAuthState('.whatsapp-session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      log('📱 Escanea este QR con WhatsApp (Dispositivos vinculados > Vincular dispositivo):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      log('✅ WhatsApp conectado exitosamente!');
      log('');
      log('📋 Tus grupos:');

      // Wait for groups to load
      await new Promise(r => setTimeout(r, 3000));

      const groups = await sock.groupFetchAllParticipating();
      for (const [id, group] of Object.entries(groups)) {
        log(`  - ${group.subject} → ${id}`);
      }

      log('');
      log('📝 Copia el ID del grupo y ponlo en .env como WHATSAPP_GROUP_ID');
      log('');
      process.exit(0);
    }
  });
}

setup().catch(console.error);
