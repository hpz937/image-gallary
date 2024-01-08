<?php
require_once('.config.inc.php');

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$subdir = isset($_GET['subdir']) ? $_GET['subdir'] : '';
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'date'; // Default sort by name
$order = isset($_GET['order']) ? $_GET['order'] : 'desc'; // Default order ascending

$imagesPerPage = 36;

// Define the base directory for images
$baseDir = "images";
if (!empty($subdir)) {
    $subdirPath = $baseDir . "/" . $subdir;
    if (is_dir($subdirPath)) {
        $baseDir = $subdirPath;
    }
}

// Get sub-directories
$subdirs = array_filter(glob("$baseDir/*", GLOB_ONLYDIR), 'is_dir');
$subdirNames = array_map('basename', $subdirs);

// Find all image files in the directory
$images = glob("$baseDir/*.{jpg,jpeg,webp,png,gif}", GLOB_BRACE);

// Sorting
if ($sort == 'date') {
    usort($images, function($a, $b) use ($order) {
        $timeA = fileModifiedTime($a);
        $timeB = fileModifiedTime($b);
        return ($order === 'asc') ? ($timeA - $timeB) : ($timeB - $timeA);
    });
} else {
    // Sort by name
    if ($order === 'asc') {
        sort($images);
    } else {
        rsort($images);
    }
}

// Pagination logic
$totalPages = ceil(count($images) / $imagesPerPage);
if ($page > $totalPages) {
    $page = $totalPages;
}
$start = ($page - 1) * $imagesPerPage;
$images = array_slice($images, $start, $imagesPerPage);

// Prepare the image URLs
$imageList = array_map(function($image) {
    $format = 'rs:fill:300:300:0:1';
    $encodedUrl = signUrl(IMAGE_URL . dirname($image) . "/" . basename($image), $format, 'webp');
    return [
        'thumbnail' => IMGPROXY_URL . $encodedUrl,
        'fullsize' => IMAGE_URL . dirname($image) . "/" . basename($image),
    ];
}, $images);

// Output the JSON
echo json_encode([
    'images' => $imageList,
    'subdirectories' => $subdirNames, // Add the list of subdirectories
    'currentPage' => $page,
    'totalPages' => $totalPages
]);

// Function to get file creation time
function fileCreationTime($file) {
    return filectime($file);
}
function fileModifiedTime($file) {
    return filemtime($file);
}
function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function signUrl($image_url, $imgproxy_format, $file_extension = 'jpg') {
    $keyBin = pack("H*" , IMGPROXY_KEY);
    if(empty($keyBin)) {
        die('Key expected to be hex-encoded string');
    }

    $saltBin = pack("H*" , IMGPROXY_SALT);
    if(empty($saltBin)) {
        die('Salt expected to be hex-encoded string');
    }

    $encodedUrl = rtrim(strtr(base64_encode($image_url), '+/', '-_'), '=');

    $path = "/{$imgproxy_format}/{$encodedUrl}.{$file_extension}";

    $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $saltBin.$path, $keyBin, true)), '+/', '-_'), '=');

    return sprintf("/%s%s", $signature, $path);
}
?>

