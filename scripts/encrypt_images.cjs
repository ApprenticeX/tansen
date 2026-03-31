const fs = require('fs');
const path = require('path');

const keyArg = process.argv[2];
const XOR_KEY = keyArg ? parseInt(keyArg, 10) : 63;

if (isNaN(XOR_KEY) || XOR_KEY < 0 || XOR_KEY > 255) {
  console.error('Please provide a valid XOR key (0 - 255). Example: node encrypt_images.cjs 123');
  process.exit(1);
}

// Input directory is now OUTSIDE of public, so raw images are never exposed to the web build
const inputDir = path.join(__dirname, '../pictures_raw');
const outputDir = path.join(__dirname, '../public/pictures');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(inputDir)) {
  console.log(`Please place your private raw pictures (.png, .jpg) and text notes (.txt) in ${inputDir} and run this script again.`);
  fs.mkdirSync(inputDir, { recursive: true });
  process.exit(0);
}

// Get only non-text files to act as the primary images
const files = fs.readdirSync(inputDir).filter(f => !f.endsWith('.txt') && !f.startsWith('.'));
// Sort them so the sequence is predictable (e.g. alphabetically by original filename)
files.sort();

let count = 0;
const manifest = [];
let sequenceId = 1;

for (const file of files) {
  const filePath = path.join(inputDir, file);
  if (fs.statSync(filePath).isFile()) {
    const data = fs.readFileSync(filePath);
    
    // Encrypt pixel by pixel
    for (let i = 0; i < data.length; i++) {
        data[i] ^= XOR_KEY;
    }

    const baseName = file.substring(0, file.lastIndexOf('.'));
    // Sequential naming: 1.enc, 2.enc, etc.
    const newFileName = `${sequenceId}.enc`;
    fs.writeFileSync(path.join(outputDir, newFileName), data);
    
    // Check if an associated .txt file exists in raw folder
    const txtName = baseName + '.txt';
    let textFileName = null;
    if (fs.existsSync(path.join(inputDir, txtName))) {
       textFileName = `${sequenceId}.txt`;
       fs.copyFileSync(path.join(inputDir, txtName), path.join(outputDir, textFileName));
    }

    manifest.push({ image: newFileName, txt: textFileName });
    console.log(`Encrypted ${file} -> ${newFileName}` + (textFileName ? ` (with note: ${textFileName})` : ''));
    count++;
    sequenceId++;
  }
}

// Write the manifest so the frontend knows what to fetch dynamically
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`\nSuccessfully encrypted ${count} files with XOR Key [${XOR_KEY}].`);
console.log(`Manifest saved! Sequence naming (1.enc, 2.enc) complete.`);
