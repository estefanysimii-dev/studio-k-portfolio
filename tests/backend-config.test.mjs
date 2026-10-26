import test from 'node:test';
import assert from 'node:assert/strict';
import { gatewayForBackend } from '../infinityfree/backend-config.mjs';

const source = "<?php\nconst STUDIO_BACKEND = 'https://studiok-api.wisp.uno';\nconst STUDIO_ORIGIN = 'https://studiokatelier.infinityfreeapp.com';";

test('migration replaces only the backend origin and keeps the public portfolio', () => {
  const result = gatewayForBackend(source, 'https://api.studio.example/');
  assert.match(result, /const STUDIO_BACKEND = "https:\/\/api.studio.example";/);
  assert.match(result, /const STUDIO_ORIGIN = 'https:\/\/studiokatelier.infinityfreeapp.com';/);
  assert.doesNotMatch(result, /studiok-api\.wisp\.uno/);
  assert.equal(gatewayForBackend(source, ''), source);
});

test('migration rejects insecure origins, embedded credentials and URL suffixes', () => {
  for (const origin of ['http://api.studio.example', 'https://secret@api.studio.example', 'https://api.studio.example/path', 'https://api.studio.example/?secret=key', 'https://api.studio.example/#hash', 'broken']) {
    assert.throws(() => gatewayForBackend(source, origin), /STUDIO_BACKEND_URL/);
  }
});
