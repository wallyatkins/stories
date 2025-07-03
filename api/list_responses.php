<?php
require_once __DIR__ . '/auth.php';
require_https();
require_login();
header('Content-Type: application/json');
$prompt = basename($_GET['prompt'] ?? '');
$metadataDir = __DIR__ . '/../metadata';
$responsesFile = "$metadataDir/$prompt.json";
if ($prompt === '' || !file_exists($responsesFile)) {
    echo '[]';
    exit;
}
$contents = file_get_contents($responsesFile);
if ($contents === false) {
    echo '[]';
    exit;
}
echo $contents;

