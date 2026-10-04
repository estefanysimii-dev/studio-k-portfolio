import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
const php = process.env.PHP_BINARY || 'php';
const available = spawnSync(php, ['-v'], { windowsHide: true }).status === 0;
test('PHP gateway protects writes, hides OAuth exchange and bounds return URLs', { skip: !available }, async () => {
  const port = 19643;
  const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', resolve('dist-infinityfree'), resolve('dist-infinityfree/index.php')], { windowsHide: true, stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  try {
    for (let i = 0; i < 50; i++) {
      try { await fetch(base + '/api/unknown'); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    const hostile = await fetch(base + '/api/studio/control/site', { method: 'PUT', headers: { Origin: 'https://attacker.example' }, body: '{}' });
    assert.equal(hostile.status, 403);
    const exchange = await fetch(base + '/api/studio/oauth/exchange?t=hidden');
    assert.equal(exchange.status, 404);
    for (const next of ['//attacker.example', '/\\attacker.example', '/account\r\nLocation: https://attacker.example']) {
      const response = await fetch(base + '/api/oauth/start?next=' + encodeURIComponent(next), { redirect: 'manual' });
      const location = new URL(response.headers.get('location'));
      assert.equal(location.origin, 'https://studiokbot.up.railway.app');
      assert.equal(location.searchParams.get('next'), '/account');
    }
    const missing = await fetch(base + '/api/portfolio/oauth/complete', { redirect: 'manual' });
    assert.equal(missing.headers.get('location'), '/account?oauth=missing');
    const logout = await fetch(base + '/api/logout', { method: 'POST', headers: { Origin: 'https://studiokatelier.infinityfreeapp.com' } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /secure/i);
    assert.match(logout.headers.get('set-cookie'), /httponly/i);
    assert.match(logout.headers.get('set-cookie'), /samesite=Lax/i);
  } finally { server.kill(); }
});


test('InfinityFree gateway exposes Studio K ID ecosystem routes', () => {
  const gateway = readFileSync(resolve('dist-infinityfree/index.php'), 'utf8');
  for (const route of ['analytics/event', 'me/profile', 'me/ecosystem', 'me/favorites/']) {
    assert.match(gateway, new RegExp(route.replace('/', '\\/')));
  }
  assert.match(gateway, /me\/profile\(\?:\/title\)\?/);
});


test('InfinityFree gateway exposes Studio K commerce routes', () => {
  const gateway = readFileSync(resolve('dist-infinityfree/index.php'), 'utf8');
  for (const route of [
    'search',
    'me/cart',
    'me/notifications',
    'me/missions/',
    'me/leaderboard',
    'me/gallery',
    'me/tickets',
    'recommendations'
  ]) {
    assert.match(gateway, new RegExp(route.replace('/', '\\/')));
  }
  assert.match(gateway, /collections\/\[A-Za-z0-9-\]/);
});
