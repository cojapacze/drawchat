const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const querystring = require('querystring');

const CURVE_NAME = 'prime256v1';
const DRAWCHAT_OPEN_URL = 'https://api.draw.chat/v1/open';

function exportPEMKeyToBase64(keyPem) {
  const base64Key = keyPem
    .replace(/-----BEGIN (.*)-----/, '')
    .replace(/-----END (.*)-----/, '')
    .replace(/\r\n/g, '')
    .replace(/\n/g, '');
  return base64Key;
}

function signMessage(privateKey, message) {
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  sign.end();
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return signature;
}

function toUrlSafeBase64(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Calculate link to draw.chat board
 *
 * @param {string} privateKeyPEM - private key in PEM format
 * @param {string} publicKeyPEM - public key in PEM format
 * @param {string} boardUniqueKey - unique board key
 * @param {string} username - username
 * @param {string} permissions - permissions
 * @param {object} config - optional config
 *
 * Permissions:
 * "RDC___" - is an administrator (teacher), can draw and chat
 * "ADC___" - is a user (student), can access board, can draw and chat
 * "AD____" - is a user (student), can access board, can draw, but can't chat
 * "A_C___" - is a user (student), can access board, can chat, but can't draw
 * "A_____" - is a user (student), can access board, but can't draw and chat
 */
function get_drawchat_link(
  privateKeyPEM,
  publicKeyPEM,
  boardUniqueKey,
  username,
  permissions,
  config = null,
) {
  const publicKeyB64 = exportPEMKeyToBase64(publicKeyPEM);
  const bseed = crypto.createHash('sha256').update(boardUniqueKey).digest('hex');
  username = encodeURIComponent(username);
  const privateKey = crypto.createPrivateKey(privateKeyPEM);
  const message = `${bseed}|${username}|${permissions}`;
  const signature = signMessage(privateKey, message);
  const signature_base64_urlsafe = toUrlSafeBase64(signature.toString('base64'));
  const publicKey_base64_urlsafe = toUrlSafeBase64(publicKeyB64);
  const params = {
    public_key: publicKey_base64_urlsafe,
    signature: signature_base64_urlsafe,
    bseed,
    username,
    permissions,
  };
  if (config) {
    const config_json = JSON.stringify(config);
    const config_zip = zlib.deflateSync(config_json);
    const config_signature = signMessage(privateKey, config_zip);
    const config_signature_base64_urlsafe = toUrlSafeBase64(config_signature.toString('base64'));
    const config_data_base64_urlsafe = toUrlSafeBase64(config_zip.toString('base64'));
    Object.assign(params, {
      config_data: config_data_base64_urlsafe,
      config_signature: config_signature_base64_urlsafe,
    });
  }
  const query_params = querystring.stringify(params);
  const url = `${DRAWCHAT_OPEN_URL}?${query_params}`;
  return url;
}

function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: CURVE_NAME,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  return { privateKey, publicKey };
}

Object.assign(exports, {
  get_drawchat_link,
  generateKeyPair,
});
