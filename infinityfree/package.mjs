import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
const output = new URL('../dist-infinityfree/', import.meta.url);
writeFileSync(new URL('template.html', output), readFileSync(new URL('index.html', output), 'utf8'));
for (const file of ['index.php', '.htaccess']) copyFileSync(new URL(file, import.meta.url), new URL(file, output));
unlinkSync(new URL('index.html', output));
