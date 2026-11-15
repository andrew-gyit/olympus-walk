/**
 * Package a Vite production build into one HTML file for offline demonstration.
 * This does not replace normal hosting, and assumes a single JS/CSS entry asset.
 * Use: npm run build:singlefile
 */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const index = path.join(dist, 'index.html');
if (!fs.existsSync(index)) throw new Error('Run npm run build first.');
const assets = path.join(dist, 'assets');
const list = fs.readdirSync(assets);
const scripts = list.filter((name) => name.endsWith('.js'));
const styles = list.filter((name) => name.endsWith('.css'));
if (scripts.length !== 1 || styles.length !== 1) {
  throw new Error(`Expected one JS and one CSS asset, got ${scripts.length} JS and ${styles.length} CSS. Review the bundler output.`);
}
let html = fs.readFileSync(index, 'utf8');
const js = fs.readFileSync(path.join(assets, scripts[0]), 'utf8');
const css = fs.readFileSync(path.join(assets, styles[0]), 'utf8');
const scriptPattern = new RegExp(`<script[^>]+src=["'](?:\./)?/?assets/${scripts[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*></script>`);
const cssPattern = new RegExp(`<link[^>]+href=["'](?:\./)?/?assets/${styles[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`);
html = html.replace(scriptPattern, '');
html = html.replace(cssPattern, '');
if (/src=["'](?:\.\/)?\/?assets\//.test(html) || /href=["'](?:\.\/)?\/?assets\//.test(html)) {
  throw new Error('Asset links remain; refusing to generate a falsely standalone file.');
}
html = html.replace('</head>', `<style>
${css}
</style>
</head>`);
html = html.replace('</body>', `<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
</body>`);
const dest = path.join(root, 'OLYMPUS-WALK.html');
fs.writeFileSync(dest, html);
console.log(`Created ${dest} (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
