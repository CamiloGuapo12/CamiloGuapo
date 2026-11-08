const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { log } = require('../utils/helpers');

async function isFileAnimated(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check for RIFF + WEBP + ANIM
    if (buffer.length > 30) {
      const riff = buffer.slice(0, 4).toString('ascii');
      const webp = buffer.slice(8, 12).toString('ascii');
      if (riff === 'RIFF' && webp === 'WEBP') {
        // Search for ANIM chunk
        for (let i = 12; i < Math.min(buffer.length - 4, 100); i++) {
          if (buffer.slice(i, i + 4).toString('ascii') === 'ANIM') {
            return true;
          }
        }
      }
    }
    // Check GIF frame count
    if (buffer.slice(0, 3).toString('ascii') === 'GIF') {
      let frames = 0;
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 0x00 && buffer[i + 1] === 0x21) frames++;
      }
      if (frames > 1) return true;
    }
    return false;
  } catch (err) {
    log(`Error checking animation: ${err.message}`);
    return false;
  }
}

async function convertToWebP(inputPath, outputPath) {
  const animated = await isFileAnimated(inputPath);
  log(`Converting sticker (animated: ${animated})`);

  try {
    if (animated) {
      await sharp(inputPath, { animated: true })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 50 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      if (stats.size > 500 * 1024) {
        log('Animated sticker too large, recompressing...');
        const tempPath = outputPath + '.tmp.webp';
        await sharp(outputPath, { animated: true })
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 30 })
          .toFile(tempPath);
        fs.renameSync(tempPath, outputPath);
      }
    } else {
      await sharp(inputPath)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      if (stats.size > 100 * 1024) {
        log('Static sticker too large, recompressing...');
        const tempPath = outputPath + '.tmp.webp';
        await sharp(outputPath)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 50 })
          .toFile(tempPath);
        fs.renameSync(tempPath, outputPath);
      }
    }

    return { success: true, animated };
  } catch (err) {
    if (animated) {
      log(`Animated conversion failed, trying static: ${err.message}`);
      try {
        await sharp(inputPath)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 80 })
          .toFile(outputPath);
        return { success: true, animated: false };
      } catch (err2) {
        log(`Static fallback also failed: ${err2.message}`);
        return { success: false, animated: false };
      }
    }
    log(`Conversion failed: ${err.message}`);
    return { success: false, animated: false };
  }
}

module.exports = { convertToWebP, isFileAnimated };
