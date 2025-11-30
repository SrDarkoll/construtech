const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`Source dir not found: ${srcDir}`);
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir);
  for (const it of items) {
    const s = path.join(srcDir, it);
    const d = path.join(destDir, it);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      console.log(`Copied ${s} -> ${d}`);
    }
  }
}

const repoRoot = path.join(__dirname, '..');

// Copy img/ -> public/img/
copyDir(path.join(repoRoot, 'img'), path.join(repoRoot, 'public', 'img'));
// Copy js/firebaseConfig.js -> public/js/firebaseConfig.js
const srcFirebase = path.join(repoRoot, 'js', 'firebaseConfig.js');
const destFirebase = path.join(repoRoot, 'public', 'js', 'firebaseConfig.js');
if (fs.existsSync(srcFirebase)) {
  copyFile(srcFirebase, destFirebase);
} else {
  console.warn('firebaseConfig.js not found at', srcFirebase);
}

console.log('Asset copy complete.');
