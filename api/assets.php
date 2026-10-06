<?php

/*
|--------------------------------------------------------------------------
| Static asset lambda
|--------------------------------------------------------------------------
|
| Vercel serves files it collected at build time straight from the CDN, but
| anything produced after that collection (Vite's public/build output) is not
| reachable as a static file. When that happens vercel.json rewrites /build/*
| here instead of the application, so the asset is streamed from disk.
|
| Only whitelisted asset extensions are ever served and every path is resolved
| with realpath() before it is touched, so PHP entry points such as
| public/index.php can never be downloaded as source code.
|
*/

$root = realpath(__DIR__.'/../public');

$requestPath = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));

$extensions = [
    'avif' => 'image/avif',
    'css'  => 'text/css; charset=utf-8',
    'eot'  => 'application/vnd.ms-fontobject',
    'gif'  => 'image/gif',
    'ico'  => 'image/x-icon',
    'jpeg' => 'image/jpeg',
    'jpg'  => 'image/jpeg',
    'js'   => 'text/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'map'  => 'application/json; charset=utf-8',
    'mjs'  => 'text/javascript; charset=utf-8',
    'mp3'  => 'audio/mpeg',
    'mp4'  => 'video/mp4',
    'otf'  => 'font/otf',
    'pdf'  => 'application/pdf',
    'png'  => 'image/png',
    'svg'  => 'image/svg+xml',
    'ttf'  => 'font/ttf',
    'txt'  => 'text/plain; charset=utf-8',
    'wasm' => 'application/wasm',
    'wav'  => 'audio/wav',
    'webm' => 'video/webm',
    'webp' => 'image/webp',
    'woff' => 'font/woff',
    'woff2'=> 'font/woff2',
    'xml'  => 'application/xml; charset=utf-8',
];

$notFound = static function (): void {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not Found';
};

if ($root === false || $requestPath === '' || str_contains($requestPath, '..') || ! str_starts_with($requestPath, '/')) {
    $notFound();
    exit;
}

$file = realpath($root.$requestPath);

if ($file === false || ! str_starts_with($file, $root.DIRECTORY_SEPARATOR) || ! is_file($file)) {
    $notFound();
    exit;
}

$extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

if (! array_key_exists($extension, $extensions)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Forbidden';
    exit;
}

$immutable = str_starts_with(str_replace('\\', '/', $requestPath), '/build/');

header('Content-Type: '.$extensions[$extension]);
header('Content-Length: '.filesize($file));
header('X-Content-Type-Options: nosniff');
header($immutable
    ? 'Cache-Control: public, max-age=31536000, immutable'
    : 'Cache-Control: public, max-age=3600, must-revalidate');

readfile($file);
