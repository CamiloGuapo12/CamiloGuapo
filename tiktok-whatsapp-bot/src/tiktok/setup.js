const { chromium } = require('playwright');
const { log } = require('../utils/helpers');

async function setup() {
  log('🔧 Configuración de TikTok');
  log('Se abrirá un navegador. Inicia sesión en TikTok manualmente.');
  log('Cuando termines, cierra el navegador.');

  const browser = await chromium.launchPersistentContext('.tiktok-session', {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = browser.pages()[0] || await browser.newPage();
  await page.goto('https://www.tiktok.com/login');

  log('👆 Inicia sesión en TikTok en el navegador que se abrió.');
  log('   Después de iniciar sesión, ve a Mensajes para verificar.');
  log('   Cuando estés listo, cierra el navegador.');

  await new Promise((resolve) => {
    browser.on('close', resolve);
  });

  log('✅ Sesión de TikTok guardada en .tiktok-session/');
}

setup().catch(console.error);
