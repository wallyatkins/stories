<?php
header('Content-Type: application/json');
$prompt = $_GET['prompt'] ?? '';
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

