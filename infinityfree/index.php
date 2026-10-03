<?php
declare(strict_types=1);
const STUDIO_BACKEND = 'https://studiokbot.up.railway.app';
const STUDIO_ORIGIN = 'https://studiokatelier.infinityfreeapp.com';
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
function fail(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE); exit;
}
function safe_next(mixed $next): string {
    return is_string($next) && preg_match('~^/(?!/)[^\\\\\x00-\x20]*$~', $next) ? $next : '/account';
}
function upstream(string $path, string $method = 'GET', ?string $body = null, array $headers = [], int $timeout = 25): array {
    $curl = curl_init(STUDIO_BACKEND . $path);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => $timeout, CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $type = (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    curl_close($curl);
    return [$status, $response === false ? '' : $response, $type];
}
function redirect(string $url): never { header('Cache-Control: no-store'); header('Location: ' . $url, true, 302); exit; }
function cookie_token(string $value, int $expires): void {
    setcookie('studio_web_token', $value, ['expires' => $expires, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
}
if (!in_array($method, ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'], true)) fail(405, 'Método não permitido.');
if (!in_array($method, ['GET', 'HEAD'], true)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== STUDIO_ORIGIN) fail(403, 'Origem não autorizada.');
}
if ($path === '/api/oauth/start') {
    if ($method !== 'GET') fail(405, 'Método não permitido.');
    redirect(STUDIO_BACKEND . '/api/portfolio/oauth/start?next=' . rawurlencode(safe_next($_GET['next'] ?? '/account')));
}
if ($path === '/api/portfolio/oauth/complete') {
    if ($method !== 'GET') fail(405, 'Método não permitido.');
    $token = $_GET['t'] ?? '';
    if (!is_string($token) || !preg_match('/^[A-Za-z0-9_-]{20,128}$/', $token)) redirect('/account?oauth=missing');
    [$status, $body] = upstream('/api/portfolio/oauth/exchange?t=' . rawurlencode($token));
    $data = json_decode($body, true);
    if ($status !== 200 || !isset($data['sessionToken']) || !preg_match('/^[a-f0-9]{64}$/', $data['sessionToken'])) redirect('/account?oauth=failed');
    cookie_token($data['sessionToken'], time() + 30 * 86400);
    redirect(safe_next($data['next'] ?? '/account'));
}
if ($path === '/api/logout') {
    if ($method !== 'POST') fail(405, 'Método não permitido.');
    cookie_token('', time() - 3600); header('Cache-Control: no-store'); header('Content-Type: application/json'); echo '{"ok":true}'; exit;
}
if (str_starts_with($path, '/api/studio/')) {
    $endpoint = substr($path, strlen('/api/studio/'));
    // Only the existing website API is available. OAuth exchange stays server-side.
    if (!preg_match('~^(?:public-state|radio|feedbacks|logout|me/orders(?:/[A-Za-z0-9_-]+/delivery)?|products/[A-Za-z0-9_-]+/order|control(?:/[A-Za-z0-9_/-]+)?)$~', $endpoint)
        || str_contains($endpoint, '..')) fail(404, 'Rota não encontrada.');
    $headers = ['Accept: application/json'];
    $token = $_COOKIE['studio_web_token'] ?? '';
    if (is_string($token) && preg_match('/^[a-f0-9]{64}$/', $token)) $headers[] = 'Authorization: Bearer ' . $token;
    if (!in_array($method, ['GET', 'HEAD'], true)) $headers[] = 'Origin: ' . STUDIO_ORIGIN;
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if ($type !== '' && !preg_match('/[\r\n]/', $type)) $headers[] = 'Content-Type: ' . $type;
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 2 * 1024 * 1024) fail(413, 'Use o envio direto de arquivos pela Central.');
    $query = $_SERVER['QUERY_STRING'] ?? '';
    $input = in_array($method, ['GET', 'HEAD'], true) ? null : file_get_contents('php://input', false, null, 0, 2 * 1024 * 1024 + 1);
    if ($input !== null && strlen($input) > 2 * 1024 * 1024) fail(413, 'Solicitação muito grande.');
    [$status, $body, $type] = upstream('/api/portfolio/' . $endpoint . ($query ? '?' . $query : ''), $method, $input, $headers);
    if ($status === 0) fail(502, 'Não foi possível conectar ao Studio K. Tente novamente.');
    http_response_code($status); header('Cache-Control: no-store');
    header('Content-Type: ' . (str_starts_with($type, 'application/json') ? $type : 'application/json; charset=utf-8'));
    if ($method !== 'HEAD') echo $body;
    exit;
}
if (str_starts_with($path, '/portfolio-assets/')) {
    if (!in_array($method, ['GET', 'HEAD'], true) || !preg_match('~^/portfolio-assets/[A-Za-z0-9_.-]+$~', $path) || str_contains($path, '..')) fail(404, 'Arquivo não encontrado.');
    header('Cache-Control: public, max-age=3600');
    $headers = [];
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    if (preg_match('/^bytes=\d*-\d*$/', $range)) $headers[] = 'Range: ' . $range;
    $curl = curl_init(STUDIO_BACKEND . $path);
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 60,
        CURLOPT_NOBODY => $method === 'HEAD', CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HEADERFUNCTION => function ($curl, string $line): int {
            if (preg_match('~^HTTP/\S+ (\d+)~', $line, $code)) http_response_code((int) $code[1]);
            elseif (preg_match('/^(?:Content-Type|Content-Length|Content-Range|Accept-Ranges):/i', $line)) header(trim($line));
            return strlen($line);
        }]);
    if (curl_exec($curl) === false && !headers_sent()) fail(502, 'Não foi possível carregar o arquivo.');
    curl_close($curl);
    exit;
}
if (str_starts_with($path, '/api/')) fail(404, 'Rota não encontrada.');
if (!in_array($method, ['GET', 'HEAD'], true)) fail(405, 'Método não permitido.');
$title = 'Studio K';
$description = 'Portfólio, produtos e experiências 3D do Studio K para GTA V / FiveM.';
$image = STUDIO_ORIGIN . '/studio-assets/studio-k-banner-hq.webp';
if (preg_match('~^/(portfolio|products)/([A-Za-z0-9_-]+)/?$~', $path, $match)) {
    [$status, $body] = upstream('/api/portfolio/public-state', 'GET', null, [], 5);
    $state = json_decode($body, true);
    if ($status === 200) {
        $found = false;
        foreach (($state[$match[1] === 'products' ? 'products' : 'items'] ?? []) as $item) {
            if (($item['id'] ?? '') !== $match[2]) continue;
            $found = true;
            $title = ($item['name'] ?? 'Projeto') . ' · Studio K';
            $description = $item['description'] ?? $description;
            $cover = $item['coverUrl'] ?? '';
            if (preg_match('~^https://~', $cover)) $image = $cover;
            elseif (str_starts_with($cover, '/') && !str_starts_with($cover, '//')) $image = STUDIO_ORIGIN . $cover;
            break;
        }
        if (!$found) http_response_code(404);
    }
} elseif (!in_array(rtrim($path, '/') ?: '/', ['/', '/portfolio', '/products', '/account', '/control', '/discord'], true)) http_response_code(404);
$escape = fn(string $text): string => htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$url = STUDIO_ORIGIN . $path;
$tags = '<title>' . $escape($title) . '</title><meta name="description" content="' . $escape($description) . '">';
$tags .= '<link rel="canonical" href="' . $escape($url) . '">';
foreach (['og:title' => $title, 'og:description' => $description, 'og:url' => $url, 'og:image' => $image, 'og:site_name' => 'Studio K', 'og:type' => 'website', 'og:locale' => 'pt_BR'] as $key => $value) $tags .= '<meta property="' . $key . '" content="' . $escape((string) $value) . '">';
$tags .= '<meta name="twitter:card" content="summary_large_image">';
header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store');
if ($method !== 'HEAD') echo str_replace('<!--STUDIO_METADATA-->', $tags, file_get_contents(__DIR__ . '/template.html'));
