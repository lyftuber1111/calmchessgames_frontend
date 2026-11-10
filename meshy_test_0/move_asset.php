<?php
/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Move / Deploy 3D Asset, Materials, Textures, and Colors API
 * 
 * Moves or copies a loaded 3D asset along with companion materials (.mtl, .bin),
 * textures (.png, .jpg, .webp), and material color specifications to user-approved
 * destination path(s) starting from calmchessgames.com root directory.
 */

if (file_exists(__DIR__ . '/../cors.php')) {
    require_once __DIR__ . '/../cors.php';
} else {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

header('Content-Type: application/json; charset=UTF-8');

$webRoot = realpath(__DIR__ . '/..');
if (!$webRoot) {
    $webRoot = dirname(__DIR__);
}

$allowedModelExts = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'usdz', 'dae'];
$allowedMaterialExts = ['mtl', 'bin', 'json'];
$allowedTextureExts = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tga', 'hdr', 'exr', 'svg'];
$allowedExts = array_merge($allowedModelExts, $allowedMaterialExts, $allowedTextureExts);

/**
 * Resolves a relative source path to an existing file on the server.
 */
function resolveServerFile($rawSource, $webRoot) {
    if (empty($rawSource)) return null;
    $clean = ltrim(str_replace('\\', '/', trim($rawSource)), '/');
    if (strpos($clean, '..') !== false || strpos($clean, "\0") !== false) {
        return null;
    }

    $candidates = [
        $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $clean),
        __DIR__ . DIRECTORY_SEPARATOR . basename($clean),
        __DIR__ . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . basename($clean),
        $webRoot . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . basename($clean),
        $webRoot . DIRECTORY_SEPARATOR . 'meshy_test_0' . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . basename($clean)
    ];

    foreach ($candidates as $cand) {
        if (file_exists($cand) && is_file($cand)) {
            return realpath($cand);
        }
    }
    return null;
}

/**
 * Discovers companion materials, textures, and configs for a given model file.
 */
function findCompanionFiles($modelFilePath) {
    if (!$modelFilePath || !file_exists($modelFilePath)) return [];
    
    $dir = dirname($modelFilePath);
    $baseName = pathinfo($modelFilePath, PATHINFO_FILENAME);
    $modelExt = strtolower(pathinfo($modelFilePath, PATHINFO_EXTENSION));
    
    $companions = [];
    $seen = [realpath($modelFilePath) => true];

    $addFile = function($path, $type) use (&$companions, &$seen) {
        if ($path && file_exists($path) && is_file($path)) {
            $real = realpath($path);
            if (!isset($seen[$real])) {
                $seen[$real] = true;
                $companions[] = [
                    'name' => basename($path),
                    'path' => $path,
                    'size' => filesize($path),
                    'type' => $type
                ];
            }
        }
    };

    // 1. If OBJ, inspect mtllib references
    if ($modelExt === 'obj') {
        $content = @file_get_contents($modelFilePath, false, null, 0, 8192);
        if ($content && preg_match_all('/^\s*mtllib\s+([^\r\n]+)/m', $content, $matches)) {
            foreach ($matches[1] as $mtlFile) {
                $mtlFile = trim($mtlFile);
                $addFile($dir . DIRECTORY_SEPARATOR . $mtlFile, 'material');
            }
        }
    }

    // 2. Check for companion MTL file with matching basename
    $addFile($dir . DIRECTORY_SEPARATOR . $baseName . '.mtl', 'material');

    // 3. Inspect any MTL files in the directory or companion list for texture references
    $mtlFilesToCheck = [];
    foreach ($companions as $c) {
        if (strtolower(pathinfo($c['name'], PATHINFO_EXTENSION)) === 'mtl') {
            $mtlFilesToCheck[] = $c['path'];
        }
    }
    if (file_exists($dir . DIRECTORY_SEPARATOR . $baseName . '.mtl')) {
        $mtlFilesToCheck[] = $dir . DIRECTORY_SEPARATOR . $baseName . '.mtl';
    }

    foreach (array_unique($mtlFilesToCheck) as $mtlPath) {
        if (file_exists($mtlPath)) {
            $lines = @file($mtlPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines) {
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (preg_match('/^(map_Kd|map_Ks|map_Ka|map_Bump|bump|map_d|map_Pr|map_Pm|norm|disp)\s+(.+)$/i', $trimmed, $m)) {
                        $texRef = trim($m[2]);
                        $parts = preg_split('/\s+/', $texRef);
                        $texName = end($parts);
                        $addFile($dir . DIRECTORY_SEPARATOR . basename($texName), 'texture');
                    }
                }
            }
        }
    }

    // 4. If GLTF, inspect buffers and images
    if ($modelExt === 'gltf') {
        $jsonStr = @file_get_contents($modelFilePath);
        $gltfData = json_decode($jsonStr, true);
        if (is_array($gltfData)) {
            if (!empty($gltfData['buffers'])) {
                foreach ($gltfData['buffers'] as $buf) {
                    if (!empty($buf['uri']) && strpos($buf['uri'], 'data:') !== 0) {
                        $addFile($dir . DIRECTORY_SEPARATOR . basename($buf['uri']), 'buffer');
                    }
                }
            }
            if (!empty($gltfData['images'])) {
                foreach ($gltfData['images'] as $img) {
                    if (!empty($img['uri']) && strpos($img['uri'], 'data:') !== 0) {
                        $addFile($dir . DIRECTORY_SEPARATOR . basename($img['uri']), 'texture');
                    }
                }
            }
        }
    }

    // 5. Look for matching companion files by basename and texture naming conventions
    $allInDir = @scandir($dir) ?: [];
    foreach ($allInDir as $file) {
        if ($file === '.' || $file === '..') continue;
        $filePath = $dir . DIRECTORY_SEPARATOR . $file;
        if (!is_file($filePath)) continue;

        $fileLower = strtolower($file);
        $fileExt = pathinfo($fileLower, PATHINFO_EXTENSION);
        $fileBase = pathinfo($file, PATHINFO_FILENAME);

        // Same base name with other extensions
        if (strtolower($fileBase) === strtolower($baseName)) {
            if ($fileExt === 'mtl' || $fileExt === 'bin') {
                $addFile($filePath, 'material');
            } elseif (in_array($fileExt, ['png', 'jpg', 'jpeg', 'webp'])) {
                $addFile($filePath, 'texture');
            }
            continue;
        }

        // Texture file matching patterns: texture_*, <basename>_*, or common texture suffixes
        $isTexturePattern = (
            strpos($fileLower, 'texture_') === 0 ||
            strpos($fileLower, strtolower($baseName) . '_') === 0 ||
            $fileLower === 'thumbnail.png' ||
            strpos($fileLower, 'base_color') !== false ||
            strpos($fileLower, 'metallic') !== false ||
            strpos($fileLower, 'normal') !== false ||
            strpos($fileLower, 'roughness') !== false ||
            strpos($fileLower, 'albedo') !== false ||
            strpos($fileLower, 'diffuse') !== false
        );

        if ($isTexturePattern && in_array($fileExt, ['png', 'jpg', 'jpeg', 'webp'])) {
            $addFile($filePath, 'texture');
        }
    }

    return $companions;
}

// =============================================================================
// ACTION: CHECK (Discover companion materials & textures on server)
// =============================================================================
if (isset($_GET['check']) || (isset($_POST['action']) && $_POST['action'] === 'check')) {
    $sourcePath = $_GET['source_path'] ?? $_POST['source_path'] ?? '';
    $resolved = resolveServerFile($sourcePath, $webRoot);
    if (!$resolved) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => "Model file not found on server for source path: {$sourcePath}"
        ]);
        exit;
    }

    $companions = findCompanionFiles($resolved);
    echo json_encode([
        'success' => true,
        'model_file' => basename($resolved),
        'base_name' => pathinfo($resolved, PATHINFO_FILENAME),
        'source_path' => $sourcePath,
        'resolved_path' => $resolved,
        'companion_count' => count($companions),
        'companions' => $companions
    ]);
    exit;
}

// =============================================================================
// ACTION: MOVE / DEPLOY ASSET, MATERIALS, TEXTURES, & COLORS
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Expected POST.']);
    exit;
}

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

// 2. Identify the primary asset: Either an uploaded file OR a source_path on server
$sourceTempFile = null;
$fileName = '';
$isUploaded = false;
$serverModelPath = null;

if (isset($_FILES['model_file']) && $_FILES['model_file']['error'] === UPLOAD_ERR_OK) {
    $uploaded = $_FILES['model_file'];
    $sourceTempFile = $uploaded['tmp_name'];
    $fileName = basename($uploaded['name']);
    $isUploaded = true;
} elseif (!empty($_POST['source_path'])) {
    $resolved = resolveServerFile($_POST['source_path'], $webRoot);
    if ($resolved) {
        $serverModelPath = $resolved;
        $sourceTempFile = $resolved;
        $fileName = basename($resolved);
    }
}

if (!$sourceTempFile || empty($fileName)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No valid asset found to move. Provide a model file or existing source_path.']);
    exit;
}

$baseName = pathinfo($fileName, PATHINFO_FILENAME);

// 3. Companion Materials and Textures options
$moveMaterialsTextures = true;
if (isset($_POST['move_materials_textures'])) {
    $val = $_POST['move_materials_textures'];
    $moveMaterialsTextures = ($val === '1' || $val === 'true' || $val === true);
}

$moveColorsJson = true;
if (isset($_POST['move_colors_json'])) {
    $val = $_POST['move_colors_json'];
    $moveColorsJson = ($val === '1' || $val === 'true' || $val === true);
}

// Extract materials JSON if passed from client
$materialsJsonStr = $_POST['materials_json'] ?? null;

// Determine companion files to move
$serverCompanions = [];
if ($moveMaterialsTextures && $serverModelPath) {
    $serverCompanions = findCompanionFiles($serverModelPath);
}

// Also check uploaded companion files
$uploadedCompanions = [];
if (isset($_FILES['companion_files']) && is_array($_FILES['companion_files']['name'])) {
    $countFiles = count($_FILES['companion_files']['name']);
    for ($i = 0; $i < $countFiles; $i++) {
        if ($_FILES['companion_files']['error'][$i] === UPLOAD_ERR_OK) {
            $cName = basename($_FILES['companion_files']['name'][$i]);
            $cExt = strtolower(pathinfo($cName, PATHINFO_EXTENSION));
            if (in_array($cExt, $allowedExts, true)) {
                $uploadedCompanions[] = [
                    'name' => $cName,
                    'tmp_name' => $_FILES['companion_files']['tmp_name'][$i],
                    'size' => $_FILES['companion_files']['size'][$i]
                ];
            }
        }
    }
}

if (empty($destPathsInput)) {
    $destPathsInput = ['wormhole0/warp_origin_images/' . $fileName];
}

$savedSummary = [];
$primarySavedFull = null;

foreach ($destPathsInput as $destRaw) {
    $destRaw = trim($destRaw);
    if (empty($destRaw)) continue;

    $cleanDest = ltrim(str_replace('\\', '/', $destRaw), '/');
    if (strpos($cleanDest, '..') !== false || strpos($cleanDest, "\0") !== false) {
        continue;
    }

    // Determine target directory and model file path
    $targetDir = '';
    $targetModelName = $fileName;

    if (substr($cleanDest, -1) === '/' || empty(pathinfo($cleanDest, PATHINFO_EXTENSION))) {
        // e.g. wormhole0/warp_origin_images/ or wormhole0/warp_origin_images
        $targetDir = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, rtrim($cleanDest, '/'));
        $targetModelFullPath = $targetDir . DIRECTORY_SEPARATOR . $fileName;
    } else {
        // e.g. wormhole0/warp_origin_images/red_race_car.glb
        $targetModelFullPath = $webRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanDest);
        $targetDir = dirname($targetModelFullPath);
        $targetModelName = basename($targetModelFullPath);
    }

    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            continue;
        }
    }

    // A. Move / Copy the primary 3D model
    $modelSuccess = false;
    if ($isUploaded) {
        if ($primarySavedFull === null) {
            $modelSuccess = move_uploaded_file($sourceTempFile, $targetModelFullPath);
            if ($modelSuccess) $primarySavedFull = $targetModelFullPath;
        } else {
            $modelSuccess = copy($primarySavedFull, $targetModelFullPath);
        }
    } else {
        $modelSuccess = copy($sourceTempFile, $targetModelFullPath);
    }

    if (!$modelSuccess) {
        continue;
    }

    $movedCompanions = [];

    // B. Move / Copy Server Companion Materials and Textures
    if ($moveMaterialsTextures && !empty($serverCompanions)) {
        foreach ($serverCompanions as $comp) {
            $compTarget = $targetDir . DIRECTORY_SEPARATOR . $comp['name'];
            if (@copy($comp['path'], $compTarget)) {
                $movedCompanions[] = [
                    'name' => $comp['name'],
                    'type' => $comp['type'],
                    'size' => $comp['size']
                ];
            }
        }
    }

    // C. Move / Copy Uploaded Companion Files
    if (!empty($uploadedCompanions)) {
        foreach ($uploadedCompanions as $uComp) {
            $uTarget = $targetDir . DIRECTORY_SEPARATOR . $uComp['name'];
            if (@copy($uComp['tmp_name'], $uTarget)) {
                $movedCompanions[] = [
                    'name' => $uComp['name'],
                    'type' => 'uploaded_companion',
                    'size' => $uComp['size']
                ];
            }
        }
    }

    // D. Write Material Colors & Properties Configuration JSON
    $materialsJsonSaved = null;
    if ($moveColorsJson) {
        $jsonPayload = null;
        if (!empty($materialsJsonStr)) {
            $decoded = json_decode($materialsJsonStr, true);
            $jsonPayload = is_array($decoded) ? $decoded : ['raw_materials' => $materialsJsonStr];
        } else {
            $jsonPayload = [
                'model' => $fileName,
                'baseName' => $baseName,
                'exported_at' => date('c'),
                'destination' => str_replace($webRoot, '', $targetDir),
                'companion_files' => array_column($movedCompanions, 'name')
            ];
        }

        $jsonFileName = $baseName . '_materials.json';
        $jsonFullPath = $targetDir . DIRECTORY_SEPARATOR . $jsonFileName;
        if (@file_put_contents($jsonFullPath, json_encode($jsonPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
            $materialsJsonSaved = $jsonFileName;
            $movedCompanions[] = [
                'name' => $jsonFileName,
                'type' => 'materials_colors_json',
                'size' => filesize($jsonFullPath)
            ];
        }
    }

    $destRel = str_replace([$webRoot, '\\'], ['', '/'], $targetModelFullPath);
    if (!str_starts_with($destRel, '/')) $destRel = '/' . $destRel;

    $savedSummary[] = [
        'destination_model' => $destRel,
        'destination_url' => 'https://calmchessgames.com' . $destRel,
        'folder' => str_replace([$webRoot, '\\'], ['', '/'], $targetDir),
        'model_name' => $targetModelName,
        'companion_count' => count($movedCompanions),
        'companion_files' => $movedCompanions,
        'materials_colors_config' => $materialsJsonSaved
    ];
}

if (empty($savedSummary)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to move asset or materials to destination path(s).']);
    exit;
}

$allCompanionNames = [];
foreach ($savedSummary as $s) {
    foreach ($s['companion_files'] as $cf) {
        if (!in_array($cf['name'], $allCompanionNames, true)) {
            $allCompanionNames[] = $cf['name'];
        }
    }
}

echo json_encode([
    'success' => true,
    'message' => "Asset '{$fileName}' plus " . count($allCompanionNames) . " material(s), texture(s), and color config(s) successfully moved to " . count($savedSummary) . " destination path(s).",
    'moved_count' => count($savedSummary),
    'file_name' => $fileName,
    'base_name' => $baseName,
    'primary_destination' => $savedSummary[0]['destination_model'],
    'primary_url' => $savedSummary[0]['destination_url'],
    'destination_paths' => array_column($savedSummary, 'destination_model'),
    'destination_folders' => array_column($savedSummary, 'folder'),
    'companion_files_moved' => $allCompanionNames,
    'companion_count' => count($allCompanionNames),
    'details' => $savedSummary
]);
