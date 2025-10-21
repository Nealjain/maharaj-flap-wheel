// Script to generate PWA icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">M</text>
</svg>
`;

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For now, save as SVG (you'll need to convert to PNG manually or use a library)
  const svgFilepath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgFilepath, svg.trim());
  console.log(`Created ${svgFilepath}`);
});

console.log('\n✅ Icon SVGs generated!');
console.log('\n📝 Next steps:');
console.log('1. Convert SVGs to PNGs using an online tool or ImageMagick');
console.log('2. Or use a proper logo/icon for your app');
console.log('3. Place PNG files in public/icons/');
