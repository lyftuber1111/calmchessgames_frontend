<?php
/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Centralized Model Storage & Destination API
 * 
 * Allows saving .glb, .gltf, .obj, and associated 3D assets to user-approved
 * destination paths starting from the calmchessgames.com root directory.
 */

require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed. Expected POST.'
    ]);
    exit;
}

if (!isset($_FILES['model_file']) || $_FILES['model_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $err = $_FILES['model_file']['error'] ?? 'no_file_uploaded';
    echo json_encode([
        'success' => false,
        'error' => 'No valid model file received. Error code: ' . $err
    ]);
    exit;
}

$uploadedFile = $_FILES['model_file'];
$fileName = basename($uploadedFile['name']);
$destPathRaw = trim($_POST['destination_path'] ?? '');

if (empty($destPathRaw)) {
    $destPathRaw = 'meshy_test_0/models/' . $fileName;
}

// Clean and normalize destination path
$cleanDestPath = ltrim(str_replace('\\', '/', $destPathRaw), '/');

// Security check: Directory traversal prevention
if (strpos($cleanDestPath, '..') !== false || strpos($cleanDestPath, "\0") !== false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Security Error: Directory traversal sequences are strictly prohibited.'
    ]);
    exit;
}

// If destination path is a directory, append the original filename
if (substr($cleanDestPath, -1) === '/' || empty(pathinfo($cleanDestPath, PATHINFO_EXTENSION))) {
    $cleanDestPath = rtrim($cleanDestPath, '/') . '/' . $fileName;
}

// Validate file extension against allowed 3D and texture asset formats
$ext = strtolower(pathinfo($cleanDestPath, PATHINFO_EXTENSION));
$allowedExts = ['glb', 'gltf', 'obj', 'mtl', 'bin', 'fbx', 'stl', 'png', 'jpg', 'jpeg', 'webp', 'json'];

if (!in_array($ext, $allowedExts, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Unsupported file extension .' . $ext . '. Supported formats: ' . implode(', ', $allowedExts)
    ]);
    exit;
}

// 100MB File Size Limit
$maxFileSize = 100 * 1024 * 1024;
if ($uploadedFile['size'] > $maxFileSize) {
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'error' => 'File size exceeds 100MB limit.'
    ]);
    exit;
}

// Resolve web root directory (parent of meshy_test_0)
$webRoot = realpath(__DIR__ . '/..');
if (!$webRoot) {
    $webRoot = dirname(__DIR__);
}

$targetFullPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanDestPath);
$targetDir = dirname($targetFullPath);

// Ensure destination directory exists
if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create destination folder on server: ' . dirname($cleanDestPath)
        ]);
        exit;
    }
}

// Move uploaded file to approved destination
if (!move_uploaded_file($uploadedFile['tmp_name'], $targetFullPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to write file to approved destination path.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Model successfully approved and saved to destination.',
    'destination_path' => '/' . $cleanDestPath,
    'full_url' => 'https://calmchessgames.com/' . $cleanDestPath,
    'file_name' => basename($cleanDestPath),
    'size' => $uploadedFile['size']
]);
