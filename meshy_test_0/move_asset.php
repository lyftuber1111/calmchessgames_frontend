<?php
/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Move / Deploy 3D Asset API
 * 
 * Moves or copies a loaded 3D asset (from meshy_test_0 root or meshy_test_0/models,
 * or from uploaded file) to user-approved destination path(s) starting from
 * calmchessgames.com root directory.
 */

require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Expected POST.']);
    exit;
}

$webRoot = realpath(__DIR__ . '/..');
if (!$webRoot) {
    $webRoot = dirname(__DIR__);
}

$allowedExts = ['glb', 'gltf', 'obj', 'mtl', 'bin', 'fbx', 'stl', 'png', 'jpg', 'jpeg', 'webp', 'json'];

// 1. Determine destination paths
$destPathsInput = [];
if (isset($_POST['destination_paths'])) {
    if (is_array($_POST['destination_paths'])) {
        $destPathsInput = $_POST['destination_paths'];
    } else {
        $decoded = json_decode($_POST['destination_paths'], true);
        $destPathsInput = is_array($decoded) ? $decoded : explode(',', $_POST['destination_paths']);
    }
} elseif (!empty($_POST['destination_path'])) {
    $destPathsInput = [$_POST['destination_path']];
}

// 2. Identify the asset: Either an uploaded file OR a source_path on server
$sourceTempFile = null;
$fileName = '';
$isUploaded = false;

if (isset($_FILES['model_file']) && $_FILES['model_file']['error'] === UPLOAD_ERR_OK) {
    $uploaded = $_FILES['model_file'];
    $sourceTempFile = $uploaded['tmp_name'];
    $fileName = basename($uploaded['name']);
    $isUploaded = true;
} elseif (!empty($_POST['source_path'])) {
    $rawSource = ltrim(str_replace('\\', '/', trim($_POST['source_path'])), '/');
    if (strpos($rawSource, '..') !== false || strpos($rawSource, "\0") !== false) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Security error: directory traversal prohibited in source_path.']);
        exit;
    }

    $candidates = [
        $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rawSource),
        __DIR__ . DIRECTORY_SEPARATOR . basename($rawSource),
        __DIR__ . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . basename($rawSource),
        $webRoot . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . basename($rawSource),
        $webRoot . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . basename($rawSource)
    ];

    foreach ($candidates as $cand) {
        if (file_exists($cand) && is_file($cand)) {
            $sourceTempFile = $cand;
            $fileName = basename($cand);
            break;
        }
    }
}

if (!$sourceTempFile || empty($fileName)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No valid asset found to move. Provide a model file or existing source_path in meshy_test_0 or meshy_test_0/models.']);
    exit;
}

if (empty($destPathsInput)) {
    $destPathsInput = ['wormhole0/warp_origin_images/' . $fileName];
}

$savedPaths = [];
$firstSavedFull = null;

foreach ($destPathsInput as $destRaw) {
    $destRaw = trim($destRaw);
    if (empty($destRaw)) continue;

    $cleanDest = ltrim(str_replace('\\', '/', $destRaw), '/');
    if (strpos($cleanDest, '..') !== false || strpos($cleanDest, "\0") !== false) {
        continue;
    }

    // If destination path is a directory, append original filename
    if (substr($cleanDest, -1) === '/' || empty(pathinfo($cleanDest, PATHINFO_EXTENSION))) {
        $cleanDest = rtrim($cleanDest, '/') . '/' . $fileName;
    }

    $ext = strtolower(pathinfo($cleanDest, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExts, true)) {
        continue;
    }

    $targetFullPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanDest);
    $targetDir = dirname($targetFullPath);

    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            continue;
        }
    }

    $success = false;
    if ($isUploaded) {
        if ($firstSavedFull === null) {
            $success = move_uploaded_file($sourceTempFile, $targetFullPath);
            if ($success) $firstSavedFull = $targetFullPath;
        } else {
            $success = copy($firstSavedFull, $targetFullPath);
        }
    } else {
        $success = copy($sourceTempFile, $targetFullPath);
    }

    if ($success) {
        $savedPaths[] = '/' . $cleanDest;
    }
}

if (empty($savedPaths)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to move asset to destination path(s).']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => "Asset successfully approved and moved to " . count($savedPaths) . " destination path(s).",
    'moved_count' => count($savedPaths),
    'destination_paths' => $savedPaths,
    'primary_destination' => $savedPaths[0],
    'primary_url' => 'https://calmchessgames.com' . $savedPaths[0],
    'file_name' => $fileName
]);
