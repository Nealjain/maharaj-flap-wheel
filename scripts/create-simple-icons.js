// Create simple placeholder PNG icons
// These are base64 encoded 1x1 pixel PNGs that will be replaced with real icons

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Simple blue square PNG (base64)
const bluePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Write a simple 1x1 PNG (browsers will scale it)
  fs.writeFileSync(filepath, Buffer.from(bluePNG, 'base64'));
  console.log(`Created ${filename}`);
});

console.log('\n✅ Placeholder PNG icons created!');
console.log('\n📝 To use custom icons:');
console.log('1. Create your app icon/logo');
console.log('2. Use https://realfavicongenerator.net/ to generate all sizes');
console.log('3. Replace files in public/icons/');
