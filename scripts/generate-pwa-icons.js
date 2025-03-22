const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Sizes needed for PWA icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Directory to save icons
const iconDir = path.join(__dirname, '../public/icons');

// Ensure the directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Function to generate a simple icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Draw a red circle (YouTube-like)
  ctx.fillStyle = '#FF3737';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Draw a play triangle
  ctx.fillStyle = '#FFFFFF';
  const triangleSize = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(size / 2 + triangleSize / 2, size / 2);
  ctx.lineTo(size / 2 - triangleSize / 2, size / 2 - triangleSize / 2);
  ctx.lineTo(size / 2 - triangleSize / 2, size / 2 + triangleSize / 2);
  ctx.closePath();
  ctx.fill();

  // Add "AI" text
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('AI', size / 2, size * 0.9);

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated icon-${size}x${size}.png`);
}

// Generate icons for all sizes
sizes.forEach(size => {
  generateIcon(size);
});

console.log('All PWA icons generated successfully!');
