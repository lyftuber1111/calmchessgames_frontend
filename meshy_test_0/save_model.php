<?php
/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Centralized Model Storage & Destination API
 * 
 * Allows saving .glb, .gltf, .obj, and associated 3D assets to one or more user-approved
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

// Handle multiple or single destination paths
$destPathsInput = [];
if (isset($_POST['destination_paths'])) {
    if (is_array($_POST['destination_paths'])) {
        $destPathsInput = $_POST['destination_paths'];
    } else {
        $decoded = json_decode($_POST['destination_paths'], true);
        if (is_array($decoded)) {
            $destPathsInput = $decoded;
        } else {
            $destPathsInput = explode(',', $_POST['destination_paths']);
        }
    }
} elseif (!empty($_POST['destination_path'])) {
    $destPathsInput = [$_POST['destination_path']];
}

if (empty($destPathsInput)) {
    $destPathsInput = ['wormhole0/warp_origin_images/' . $fileName];
}

$webRoot = realpath(__DIR__ . '/..');
if (!$webRoot) {
    $webRoot = dirname(__DIR__);
}

$allowedExts = ['glb', 'gltf', 'obj', 'mtl', 'bin', 'fbx', 'stl', 'png', 'jpg', 'jpeg', 'webp', 'json'];
$maxFileSize = 100 * 1024 * 1024; // 100MB

if ($uploadedFile['size'] > $maxFileSize) {
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'error' => 'File size exceeds 100MB limit.'
    ]);
    exit;
}

$savedPaths = [];
$firstSavedFull = null;

foreach ($destPathsInput as $destPathRaw) {
    $destPathRaw = trim($destPathRaw);
    if (empty($destPathRaw)) continue;

    $cleanDestPath = ltrim(str_replace('\\', '/', $destPathRaw), '/');

    // Security check: Directory traversal prevention
    if (strpos($cleanDestPath, '..') !== false || strpos($cleanDestPath, "\0") !== false) {
        continue;
    }

    // If destination path is a directory, append original filename
    if (substr($cleanDestPath, -1) === '/' || empty(pathinfo($cleanDestPath, PATHINFO_EXTENSION))) {
        $cleanDestPath = rtrim($cleanDestPath, '/') . '/' . $fileName;
    }

    $ext = strtolower(pathinfo($cleanDestPath, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExts, true)) {
        continue;
    }

    $targetFullPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanDestPath);
    $targetDir = dirname($targetFullPath);

    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            continue;
        }
    }

    if ($firstSavedFull === null) {
        if (move_uploaded_file($uploadedFile['tmp_name'], $targetFullPath)) {
            $firstSavedFull = $targetFullPath;
            $savedPaths[] = '/' . $cleanDestPath;
        }
    } else {
        if (copy($firstSavedFull, $targetFullPath)) {
            $savedPaths[] = '/' . $cleanDestPath;
        }
    }
}

if (empty($savedPaths)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save uploaded file to any approved destination path.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Model successfully approved and saved to ' . count($savedPaths) . ' destination(s).',
    'saved_count' => count($savedPaths),
    'destination_paths' => $savedPaths,
    'primary_destination' => $savedPaths[0],
    'primary_url' => 'https://calmchessgames.com' . $savedPaths[0],
    'file_name' => $fileName,
    'size' => $uploadedFile['size']
]);
