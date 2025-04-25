const fs = require('fs');
const path = require('path');

// Helper function to copy directories recursively
function copyDir(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    entries.forEach(entry => {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath); // Recursively copy subdirectories
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    console.log(`Copied directory: ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying directory ${src} to ${dest}:`, err);
  }
}

// Main function to copy public assets to output directory
function copyPublicAssets() {
  console.log('Starting asset copy process...');
  const publicDir = path.join(__dirname, 'public');
  const outDir = path.join(__dirname, 'out');
  
  // Create out directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log('Created output directory:', outDir);
  }
  
  // Ensure the public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error('Error: Public directory not found at', publicDir);
    return;
  }
  
  console.log('Copying public assets to output directory...');
  
  // Copy all files from public to out directory
  const entries = fs.readdirSync(publicDir);
  entries.forEach(entry => {
    const srcPath = path.join(publicDir, entry);
    const destPath = path.join(outDir, entry);
    
    try {
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied file: ${entry}`);
      }
    } catch (err) {
      console.error(`Error copying ${entry}:`, err);
    }
  });
  
  console.log('Asset copy complete!');
}

// Run the asset copy function
copyPublicAssets();