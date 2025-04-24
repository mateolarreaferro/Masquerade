// Container startup script for Masquerade game
// This file is used to properly bootstrap the application in a container environment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get environment variables with defaults
const SERVER_PORT = process.env.SERVER_PORT || 3001;
console.log(`Server port set to: ${SERVER_PORT}`);

// Mark that we're in the container environment
process.env.CONTAINER_ENV = 'true';

// Ensure the public directory exists in the Next.js output
try {
  const frontendPath = path.join(__dirname, '.next/standalone');
  const publicPath = path.join(__dirname, 'public');
  const outputPublicPath = path.join(frontendPath, 'public');
  
  console.log('Checking paths...');
  console.log('- Frontend path:', frontendPath);
  console.log('- Public path:', publicPath);
  console.log('- Output public path:', outputPublicPath);
  
  // Ensure output directories exist
  if (!fs.existsSync(frontendPath)) {
    console.log('Creating frontend path directory');
    fs.mkdirSync(frontendPath, { recursive: true });
  }
  
  if (!fs.existsSync(outputPublicPath)) {
    console.log('Creating output public directory');
    fs.mkdirSync(outputPublicPath, { recursive: true });
  }
  
  // Copy public files if they exist
  if (fs.existsSync(publicPath)) {
    console.log('Copying public files to output directory...');
    copyDirectory(publicPath, outputPublicPath);
    console.log('Public files copied successfully');
  } else {
    console.warn('Warning: Public directory does not exist');
  }
} catch (err) {
  console.error('Error setting up directories:', err);
}

// Start the server
console.log('Starting server...');
const server = spawn('node', ['backend/server.js'], { 
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT: SERVER_PORT,
    CONTAINER_ENV: 'true'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill();
  process.exit(0);
});

// Helper function to copy directories recursively
function copyDirectory(source, destination) {
  // Check if source exists
  if (!fs.existsSync(source)) {
    console.warn(`Source directory does not exist: ${source}`);
    return;
  }
  
  // Create destination if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // Read directory contents
  const entries = fs.readdirSync(source);
  
  entries.forEach(entry => {
    const sourcePath = path.join(source, entry);
    const destPath = path.join(destination, entry);
    
    try {
      const stats = fs.statSync(sourcePath);
      
      if (stats.isDirectory()) {
        // Recursively copy subdirectories
        copyDirectory(sourcePath, destPath);
      } else {
        // Copy individual files
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${entry}`);
      }
    } catch (err) {
      console.warn(`Error copying ${entry}: ${err.message}`);
    }
  });
}