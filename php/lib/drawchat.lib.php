<?php
const PRIVATE_KEY_TYPE = OPENSSL_KEYTYPE_EC;
const ECC_KEYSIZE_BITS = 256;
const CURVE_NAME = 'prime256v1';
const SIGN_ALGO = OPENSSL_ALGO_SHA256;
const JS_ALGO_NAME = 'ECDSA';
const JS_NAMED_CURVE = 'P-256';
const DRAWCHAT_OPEN_URL = "https://api.draw.chat/v1/open";

if (!KEYS_DIR) {
  die('KEYS_DIR is not defined');
}
if (!FILENAME_PRIVATE_KEY) {
  die('FILENAME_PRIVATE_KEY is not defined');
}
if (!FILENAME_PUBLIC_KEY) {
  die('FILENAME_PUBLIC_KEY is not defined');
}

/**
 * Generate link to draw.chat board
 * 
 * @param $privateKeyPEM - private key in PEM format
 * @param $publicKeyPEM - public key in PEM format
 * @param $boardUniqueKey - unique board key (eg. group_id + subject + date + hour)
 * @param $username - username
 * @param $permissions - permissions:
 *        "RDC___" - is an administrator (teacher), can draw and chat
 *        "A_____" - is a user (student), can access board, but can't draw and chat
 *        "A_C___" - is a user (student), can access board, can chat, but can't draw
 *        "AD____" - is a user (student), can access board, can draw, but can't chat
 *        "ADC___" - is a user (student), can access board, can draw and chat
 * @return string - link to draw.chat board
 */
function get_drawchat_link($privateKeyPEM, $publicKeyPEM, $boardUniqueKey, $username, $permissions, $config = null)
{
  $board_seed = hash('sha256', $boardUniqueKey);
  $username = rawurlencode($username);
  $privateKey = openssl_pkey_get_private($privateKeyPEM);
  $message = "{$board_seed}|{$username}|{$permissions}";
  $signature = signMessage($privateKey, $message);
  $signature_base64_urlsafe = base64ToUrlSafeBase64(base64_encode(signatureFromDER($signature, ECC_KEYSIZE_BITS)));
  $publicKey_base64_urlsafe = base64ToUrlSafeBase64(pemKeyToBase64($publicKeyPEM));
  $params = [
    'public_key' => $publicKey_base64_urlsafe,
    'signature' => $signature_base64_urlsafe,
    'bseed' => $board_seed,
    'username' => ($username),
    'permissions' => $permissions,
  ];
  if ($config) {
    $config_json = json_encode($config);
    $config_zip = gzcompress($config_json);
    $config_signature = signMessage($privateKey, $config_zip);
    $config_signature_base64_urlsafe = base64ToUrlSafeBase64(base64_encode(signatureFromDER($config_signature, ECC_KEYSIZE_BITS)));
    $config_data_base64_urlsafe = base64ToUrlSafeBase64(base64_encode($config_zip));
    $params['config_data'] = $config_data_base64_urlsafe;
    $params['config_signature'] = $config_signature_base64_urlsafe;
  }
  $query_param = http_build_query($params);
  $url = DRAWCHAT_OPEN_URL . "?{$query_param}";
  return $url;
}


/**
 * Convert pem key to base64 string
 * 
 * @param $pem - pem key
 * @return string - base64 string
 */
function pemKeyToBase64($pem)
{
  // Remove the PEM delimiters and newlines
  $pattern = "/^-+[^-]+-+\r?\n|\r?\n-+[^-]+-+\$/";
  $base64 = preg_replace($pattern, '', $pem);
  // Remove any remaining newline characters
  return str_replace("\n", '', $base64);
}

/**
 * Convert base64 string to url safe base64 string
 * 
 * @param $base64String - base64 string
 * @return string - url safe base64 string
 */
function base64ToUrlSafeBase64($base64String)
{
  return rtrim(strtr($base64String, '+/', '-_'), '=');
}

/**
 * Sign message with private key
 * 
 * @param $privateKey - private key resource
 * @param $message - message to sign
 * @return string - signature
 */
function signMessage($privateKey, $message)
{
  if (!openssl_sign($message, $signature, $privateKey, SIGN_ALGO)) {
    // Handle error
    die('Error signing data: ' . openssl_error_string());
  }
  return $signature;
}

/**
 * Verify message with public key
 * 
 * @param $publicKeyPEM - public key in PEM format
 * @param $message - message to verify
 * @param $signature - signature
 * @return int - 1 if signature is valid, 0 if invalid, -1 on error
 */
function verifyMessage($publicKeyPEM, $message, $signature)
{
  return openssl_verify($message, $signature, $publicKeyPEM, SIGN_ALGO);
}

/**
 * Generate ECDSA private and public key pair
 * 
 * @return array - array with private and public key om PEM format
 */
function generateKeys()
{
  $config = array(
    "private_key_type" => PRIVATE_KEY_TYPE,
    "curve_name" => CURVE_NAME
  );

  // Generate the private and public key pair
  $res = openssl_pkey_new($config);

  if (!$res) {
    // Handle errors here
    die('Error generating key pair: ' . openssl_error_string());
  }

  // Extract the private key
  openssl_pkey_export($res, $privateKey);

  // Extract the public key
  $publicKeyDetails = openssl_pkey_get_details($res);
  $publicKey = $publicKeyDetails['key'];

  return array(
    'privateKeyPEM' => $privateKey,
    'publicKeyPEM' => $publicKey
  );
}

/**
 * Generate ECDSA private and public key pair and save them to files
 * 
 */
function generateAndStoreKeys()
{
  $keys = generateKeys();
  // Saving the keys to files
  file_put_contents(KEYS_DIR . '/' . FILENAME_PRIVATE_KEY, $keys['privateKeyPEM']);
  file_put_contents(KEYS_DIR . '/' . FILENAME_PUBLIC_KEY, $keys['publicKeyPEM']);
  echo "Keys generated and saved to files.\n";
  return $keys;
}

/**
 * ASN.1 <-> DER converter taken from https://github.com/firebase/php-jwt/blob/master/src/JWT.php
 * author   Neuman Vong <neuman@twilio.com>
 * author   Anant Narayanan <anant@php.net>
 * license  http://opensource.org/licenses/BSD-3-Clause 3-clause BSD
 */
const ASN1_INTEGER = 0x02;
const ASN1_SEQUENCE = 0x10;
const ASN1_BIT_STRING = 0x03;

/**
 * Convert an ECDSA signature to an ASN.1 DER sequence
 *
 * @param string $sig The ECDSA signature to convert
 * @return  string The encoded DER object
 */
function signatureToDER($sig)
{
  // Separate the signature into r-value and s-value
  list($r, $s) = \str_split($sig, (int)(\strlen($sig) / 2));

  // Trim leading zeros
  $r = \ltrim($r, "\x00");
  $s = \ltrim($s, "\x00");

  // Convert r-value and s-value from unsigned big-endian integers to
  // signed two's complement
  if (\ord($r[0]) > 0x7f) {
    $r = "\x00" . $r;
  }
  if (\ord($s[0]) > 0x7f) {
    $s = "\x00" . $s;
  }

  return encodeDER(
    ASN1_SEQUENCE,
    encodeDER(ASN1_INTEGER, $r) .
      encodeDER(ASN1_INTEGER, $s)
  );
}

/**
 * Encodes a value into a DER object.
 *
 * @param int $type DER tag
 * @param string $value the value to encode
 * @return  string  the encoded object
 */
function encodeDER($type, $value)
{
  $tag_header = 0;
  if ($type === ASN1_SEQUENCE) {
    $tag_header |= 0x20;
  }

  // Type
  $der = \chr($tag_header | $type);

  // Length
  $der .= \chr(\strlen($value));

  return $der . $value;
}

/**
 * Encodes signature from a DER object.
 *
 * @param string $der binary signature in DER format
 * @param int $keySize the number of bits in the key
 * @return  string  the signature
 */
function signatureFromDER($der, $keySize)
{
  // OpenSSL returns the ECDSA signatures as a binary ASN.1 DER SEQUENCE
  list($offset, $_) = readDER($der);
  list($offset, $r) = readDER($der, $offset);
  list($offset, $s) = readDER($der, $offset);

  // Convert r-value and s-value from signed two's compliment to unsigned
  // big-endian integers
  $r = \ltrim($r, "\x00");
  $s = \ltrim($s, "\x00");

  // Pad out r and s so that they are $keySize bits long
  $r = \str_pad($r, $keySize / 8, "\x00", STR_PAD_LEFT);
  $s = \str_pad($s, $keySize / 8, "\x00", STR_PAD_LEFT);

  return $r . $s;
}

/**
 * Reads binary DER-encoded data and decodes into a single object
 *
 * @param string $der the binary data in DER format
 * @param int $offset the offset of the data stream containing the object
 * to decode
 * @return array [$offset, $data] the new offset and the decoded object
 */
function readDER($der, $offset = 0)
{
  $pos = $offset;
  $size = \strlen($der);
  $constructed = (\ord($der[$pos]) >> 5) & 0x01;
  $type = \ord($der[$pos++]) & 0x1f;
  // Length
  $len = \ord($der[$pos++]);
  if ($len & 0x80) {
    $n = $len & 0x1f;
    $len = 0;
    while ($n-- && $pos < $size) {
      $len = ($len << 8) | \ord($der[$pos++]);
    }
  }
  // Value
  if ($type == ASN1_BIT_STRING) {
    $pos++; // Skip the first contents octet (padding indicator)
    $data = \substr($der, $pos, $len - 1);
    $pos += $len - 1;
  } elseif (!$constructed) {
    $data = \substr($der, $pos, $len);
    $pos += $len;
  } else {
    $data = null;
  }

  return array($pos, $data);
}
