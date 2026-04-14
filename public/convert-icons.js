const sharp = require('sharp');

async function createIcons() {
  try {
    // 192x192
    await sharp('hhrp-original.webp')
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile('icon-192.png');
    
    // 512x512
    await sharp('hhrp-original.webp')
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile('icon-512.png');
    
    // Favicon
    await sharp('hhrp-original.webp')
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile('favicon.png');
    
    // Apple Touch Icon
    await sharp('hhrp-original.webp')
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile('apple-touch-icon.png');
    
    console.log('Icons created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createIcons();
