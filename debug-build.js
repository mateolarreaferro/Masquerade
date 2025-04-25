const fs = require('fs');
const path = require('path');

// Function to recursively list all files in a directory
function listFilesRecursively(directory, relativePath = '') {
  let results = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      results.push(`📁 ${relPath}/`);
      results = results.concat(listFilesRecursively(fullPath, relPath));
    } else {
      results.push(`📄 ${relPath}`);
    }
  }

  return results;
}

// Check if the /out directory exists
console.log('Checking build output...\n');

const outDir = path.join(__dirname, 'out');
const nextDir = path.join(__dirname, '.next');

console.log('Current directory:', __dirname);

if (fs.existsSync(outDir)) {
  console.log('\n✅ /out directory exists - static export successful');
  console.log('Contents of /out directory:');
  const outFiles = listFilesRecursively(outDir);
  outFiles.slice(0, 50).forEach(file => console.log(file)); // List first 50 files
  if (outFiles.length > 50) {
    console.log(`...and ${outFiles.length - 50} more files`);
  }
  console.log(`Total files in /out: ${outFiles.length}`);
} else {
  console.log('\n❌ /out directory does not exist - static export may have failed');
}

if (fs.existsSync(nextDir)) {
  console.log('\n/next directory exists - server-side rendering build may be present');
} else {
  console.log('\n/next directory does not exist');
}

console.log('\n--- Key files check ---');

// Check for specific files that should be generated
const keyFiles = [
  'out/index.html',
  'out/lobby/index.html',
  'out/_next/static'
];

keyFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
  }
});