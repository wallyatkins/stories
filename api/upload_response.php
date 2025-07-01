<?php
header('Content-Type: application/json');
$prompt = $_GET['prompt'] ?? '';
if ($prompt === '' || $_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['video'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}
$uploadsDir = __DIR__ . '/../uploads';
$metadataDir = __DIR__ . '/../metadata';
foreach ([$uploadsDir, $metadataDir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}
$filename = time() . '-' . basename($_FILES['video']['name']);
move_uploaded_file($_FILES['video']['tmp_name'], "$uploadsDir/$filename");
$responsesFile = "$metadataDir/$prompt.json";
$responses = file_exists($responsesFile) ? json_decode(file_get_contents($responsesFile), true) : [];
$responses[] = ['filename' => $filename];
file_put_contents($responsesFile, json_encode($responses, JSON_PRETTY_PRINT));
echo json_encode(['filename' => $filename]);

