const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function processIcon() {
  const icoPath = path.join(__dirname, '../public/icon.ico');
  const extractedPath = path.join(__dirname, '../extracted_logo.png');

  if (!fs.existsSync(extractedPath)) {
    console.error('extracted_logo.png does not exist!');
    return;
  }

  // Load extracted logo
  const logoMeta = await sharp(extractedPath).metadata();
  console.log(`Loaded original logo: ${logoMeta.width}x${logoMeta.height}`);

  // Base canvas resolution for master icon is 512x512
  const masterSize = 512;
  const targetLogoSize = 420; // 82% scale for perfect inner margins

  const resizedLogo = await sharp(extractedPath)
    .resize(targetLogoSize, targetLogoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer();

  // Create a 512x512 white rounded card with smooth border-radius
  // 512x512 with 80px radius translates to:
  // 256x256 -> 40px radius
  // 64x64   -> 10px radius
  // 48x48   -> 7.5px radius (exactly 5-10px on Windows desktop icon view!)
  const masterRadius = 84;

  const cardSvg = Buffer.from(`
    <svg width="${masterSize}" height="${masterSize}">
      <rect x="0" y="0" width="${masterSize}" height="${masterSize}" rx="${masterRadius}" ry="${masterRadius}" fill="#ffffff"/>
    </svg>
  `);

  // Composite the logo in the center of the white background
  const compositeCard = await sharp({
    create: {
      width: masterSize,
      height: masterSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      {
        input: resizedLogo,
        gravity: 'center'
      }
    ])
    .png()
    .toBuffer();

  // Apply the rounded mask with transparent background outside
  const masterRoundedPng = await sharp(compositeCard)
    .composite([
      {
        input: cardSvg,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();

  // Generate multi-size resolutions for Windows Icon: 256, 128, 64, 48, 32, 16
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of sizes) {
    const resized = await sharp(masterRoundedPng)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    pngBuffers.push(resized);
  }

  // Convert all resolutions to Windows .ico
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Generated rounded public/icon.ico (${icoBuffer.length} bytes) with multi-resolution sizes:`, sizes);

  // Also save public/icon.png and public/icon-256.png
  fs.writeFileSync(path.join(__dirname, '../public/icon.png'), pngBuffers[0]); // 256x256
  fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), masterRoundedPng);

  // Clean up temporary extracted file
  if (fs.existsSync(extractedPath)) {
    fs.unlinkSync(extractedPath);
  }

  console.log('Icon processing completed successfully!');
}

processIcon().catch(console.error);

