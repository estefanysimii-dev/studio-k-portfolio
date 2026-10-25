export function gatewayForBackend(source, origin) {
  if (!origin) return source;
  let url;
  try { url = new URL(origin); } catch { throw new Error('STUDIO_BACKEND_URL deve ser uma origem HTTPS válida.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('STUDIO_BACKEND_URL deve conter somente a origem HTTPS, sem credenciais, caminho ou parâmetros.');
  }
  const declaration = /^const STUDIO_BACKEND = '[^']+';/m;
  if (!declaration.test(source)) throw new Error('A declaração STUDIO_BACKEND não foi encontrada no gateway.');
  // JSON encodes the origin safely as a PHP double-quoted literal; URL origins contain no dollar signs.
  return source.replace(declaration, `const STUDIO_BACKEND = ${JSON.stringify(url.origin)};`);
}
