<?php
// Remember to grant write permissions to the script in the directory.
if (@$_FILES['screenshot']) {
  move_uploaded_file($_FILES['screenshot']['tmp_name'], dirname(__FILE__) . '/last_screenshot.jpeg');
}
