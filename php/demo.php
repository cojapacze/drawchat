<?php

/**
 * Path to directory where keys are stored, keep it in secret outside of public_html
 */
const KEYS_DIR = './'; // change it to secure directory outside of public_html
const FILENAME_PRIVATE_KEY = '../keys/.private.key';
const FILENAME_PUBLIC_KEY = '../keys/public.key';
require_once('lib/drawchat.lib.php');

/**
 * Generate ECDSA private and public key pair and save them to files if they don't exist
 */
if (!file_exists(KEYS_DIR . '/' . FILENAME_PRIVATE_KEY) && !file_exists(KEYS_DIR . '/' . FILENAME_PUBLIC_KEY)) {
  generateAndStoreKeys();
}

/**
 * Read ECDSA private and public key in PEM format
 * (!) In production you should use more advanced methods to store keys
 * (!) like environment variables or external secrets manager
 */
$privateKeyPEM = file_get_contents(KEYS_DIR . '/' . FILENAME_PRIVATE_KEY);
$publicKeyPEM = file_get_contents(KEYS_DIR . '/' . FILENAME_PUBLIC_KEY);

/**
 * Unique board identifier (eg. group_id + subject + lesson no)
 */
$boardUniqueKey = "GROUP_403_COURSE_2024_LESSON_18";

/**
 * Unique name identifier for both students and teachers on the board.
 * (!) If empty, then user will get random name and will be able to change it.
 */
$teacher_username = "Matéo";
$students_usernames = [
  "Sakura",
  "Nikolai",
  "Anika",
  "Kai",
  "Eshe",
  "Leilani",
  "Catalina",
  "Elio",
  "Lior",
  "Soren",
  "Elif",
];

/**
 * "RDC___" - is an administrator (teacher), can draw and chat
 * "A_____" - is a user (student), can access board, but can't draw and chat
 * "A_C___" - is a user (student), can access board, can chat, but can't draw
 * "AD____" - is a user (student), can access board, can draw, but can't chat
 * "ADC___" - is a user (student), can access board, can draw and chat
 */
$teacher_permissions = "RDC___"; // teacher permissions
$student_permissions = "ADC___"; // student permissions


/**
 * Display link lesson board
 */
echo "<h1>Lesson Board</h1>";
echo "<h3>Teacher link</h3>";
echo "<ul>";
$teacher_link = get_drawchat_link($privateKeyPEM, $publicKeyPEM, $boardUniqueKey, $teacher_username, $teacher_permissions);
echo "<a href='{$teacher_link}' target='_blank'>{$teacher_username}</a>";
echo "</ul>";
echo "<h3>Students entry links</h3>";
echo "<ul>";
foreach ($students_usernames as $student_username) {
  $student_link = get_drawchat_link($privateKeyPEM, $publicKeyPEM, $boardUniqueKey, $student_username, $student_permissions);
  echo "<li><a href='{$student_link}' target='_blank'>{$student_username}</a></li>";
}
echo "</ul>";


/**
 * Kolorowanka configuration
 */
$test_board_config = [
  'features' => [
    'displayChat' => false,
    'displayChatWebrtc' => false,
    'displayCrosshair' => false,
    'displayPages' => true,
    'displayToolbar' => true,
    'displayViewports' => false,
  ],
  'toolbar' => [
    // "sketchbook",
    // "share",
    "download",
    // "upload",
    // "reset",
    "pen",
    // "autopen",
    // "crayon",
    // "smoothpen",
    "highlighter",
    // "feather",
    // "nib",
    // "rainbow",
    // "mandala",
    // "line",
    // "rectangle",
    // "ellipse",
    // "type",
    // "image",
    "colorpicker",
    "undo-redo",
    // "cutout",
    "eraser",
    "move-viewport",
    "rotate-viewport",
    "zoom",
    "center",
    // "layers-switcher",
    // "viewport-position",
    "connection-status",
    // "fullscreen"
  ],
  'defaultTool' => 'pen',
  // 'title' => 'Example title',
  // 'description' => 'Example description',
  'pages' => [
    '1' => [
      'backgroundColor' => '#F9FEE7',
      'backgroundImage' => 'https://imagehost.pro/templates/grid_2000.svg',
      'foregroundImage' => 'https://imagehost.pro/templates/colouring_cat.svg'
    ],
    '2' => [
      'backgroundColor' => '#FEF9E7',
      'backgroundImage' => 'https://upload.wikimedia.org/wikipedia/commons/1/17/A-DNA_orbit_animated_small.gif'
    ],
    '3' => [
      'backgroundColor' => 'LightSeaGreen',
    ],
  ],
];


echo "<h2>Tests for students</h2>";
echo "<ul>";
foreach ($students_usernames as $student_username) {
  $boardTestKey = $boardUniqueKey . "_test_" . $student_username;
  $student_link = get_drawchat_link($privateKeyPEM, $publicKeyPEM, $boardTestKey, $student_username, $student_permissions, $test_board_config);
  $examiner_link = get_drawchat_link($privateKeyPEM, $publicKeyPEM, $boardTestKey, $teacher_username, $teacher_permissions, $test_board_config);
  echo "<li><a href='{$student_link}' target='_blank'>{$student_username}</a> (examiner: <a href='{$examiner_link}' target='_blank'>{$teacher_username}</a>)</li>";
}
echo "</ul>";
