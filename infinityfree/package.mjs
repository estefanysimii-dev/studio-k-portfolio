import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { gatewayForBackend } from './backend-config.mjs';
const output = new URL('../dist-infinityfree/', import.meta.url);
const gateway = gatewayForBackend(readFileSync(new URL('index.php', import.meta.url), 'utf8'), process.env.STUDIO_BACKEND_URL);
writeFileSync(new URL('template.html', output), readFileSync(new URL('index.html', output), 'utf8'));
writeFileSync(new URL('index.php', output), gateway);
copyFileSync(new URL('.htaccess', import.meta.url), new URL('.htaccess', output));
unlinkSync(new URL('index.html', output));
