<?php
// Remember to grant write permissions to the script in the directory.
if (@$_FILES['screenshot']) {
  move_uploaded_file($_FILES['screenshot']['tmp_name'], dirname(__FILE__) . '/last_screenshot.jpeg');
}
if (@$_FILES['video']) {
  move_uploaded_file($_FILES['video']['tmp_name'], dirname(__FILE__) . '/last_video.webm');
}
