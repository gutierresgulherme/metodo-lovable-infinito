import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Increment version (simple patch increment)
const parts = pkg.version.split('.');
parts[2] = parseInt(parts[2]) + 1;
pkg.version = parts.join('.');

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[VERSION] Bumped to ${pkg.version}`);

// Also update a version file for the frontend
const versionTsPath = path.resolve('src/version.ts');
fs.writeFileSync(versionTsPath, `export const APP_VERSION = '${pkg.version}';\nexport const BUILD_DATE = '${new Date().toISOString()}';\n`);
