const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const querystring = require('querystring');
const WebSocket = require('ws');

const CURVE_NAME = 'prime256v1';
const CONFIG = require('./drawchat.config.json');
const GENERATE_UUID_FUSE = 120000;

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

// converts binary string to a base-N string
function binaryToBase(binStr, targetBase) {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
  if (targetBase > charset.length || targetBase < 2) {
    throw new Error('Unsupported base');
  }
  let number = binStr.split('').map((c) => parseInt(c, 10));
  let result = '';
  while (number.length > 0 && number.some((n) => n !== 0)) {
    let remainder = 0;
    let temp = [];

    for (let i = 0; i < number.length; i++) {
      let value = number[i] + remainder * 2;
      remainder = value % targetBase;
      let quotient = Math.floor(value / targetBase);

      if (temp.length > 0 || quotient > 0) {
        temp.push(quotient);
      }
    }
    result = charset[remainder] + result;
    number = temp;
  }
  return result || '0';
}

// generate a sha256 hash of a given data
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// convert a hex string to a binary string
function hexToBinary(hexStr) {
  let binaryStr = '';
  for (let i = 0; i < hexStr.length; i++) {
    const binSegment = parseInt(hexStr[i], 16).toString(2).padStart(4, '0');
    binaryStr += binSegment;
  }
  return binaryStr;
}

// validate a room token format using a list of validators
function validateRoomToken(token) {
  const tokenSha256 = sha256(`${CONFIG.globalPublicSalt}|${token}`);
  const tokenPath = `${token}~${tokenSha256}`;
  for (const validator of CONFIG.validTokens) {
    if (new RegExp(validator).test(tokenPath)) {
      return true;
    }
  }
  return false;
}

// returns a first valid room token for a given seed and prefix
// using a deterministic algorithm with a nonce
function generateValidRoomToken(seed, prefix) {
  let tokenProposal;
  let counter = 0;
  let nonce;
  let fuse = 0;
  do {
    fuse += 1;
    nonce = binaryToBase(counter.toString(2), 36);
    const str = `${seed}|${nonce}`;
    const seedSha256_bin = hexToBinary(sha256(str));
    const seedSha256_base36 = binaryToBase(seedSha256_bin, 36).substring(0, 27);
    tokenProposal = `${prefix}${seedSha256_base36}`;
    counter += 1;
  } while (!validateRoomToken(tokenProposal) && fuse < GENERATE_UUID_FUSE);
  if (fuse >= GENERATE_UUID_FUSE) {
    console.error('generateValidRoomToken fuse error', { seed, prefix });
    throw new Error('generateValidRoomToken fuse error, please report!');
  }
  return { token: tokenProposal, nonce };
}

function get_drawchat_room_valid_token_nonce(credentials) {
  const ecdsaSeed =
    credentials.public_key && credentials.bseed && `${credentials.public_key}|${credentials.bseed}`;
  const seed = ecdsaSeed || credentials.seed || `${Date.now()}${Math.random()}`; // do usuniecia
  const prefix = ecdsaSeed ? CONFIG.tokenPrefixECDSA : CONFIG.tokenPrefixDeterministic;
  const { token, nonce } = generateValidRoomToken(seed, prefix);
  const result = {
    token,
    nonce,
  };
  return result;
}

// returns a websocket server address for a given room token
function get_websocket_server_address(token) {
  const protocol = CONFIG.server.sketchpadProtocol || 'wss://';
  const serverPrefix = CONFIG.server.sketchpadServerPrefix || 'ws';
  const serverSuffix = CONFIG.server.sketchpadServerSuffix || '.draw.chat';
  const tokenSha256 = sha256(`${CONFIG.globalPublicSalt}|${token}`);
  const serverNo = tokenSha256.substring(0, 2); // first 2 chars
  const server = `${serverPrefix}0x${serverNo}${serverSuffix}`;
  const protocolServer = `${protocol}${server}`;
  const address = `${protocolServer}/${token}/ws`;
  return address;
}

/**
 * Calculate draw.chat credentials
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
function get_drawchat_credentials(
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
  return params;
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
  const credentials = get_drawchat_credentials(
    privateKeyPEM,
    publicKeyPEM,
    boardUniqueKey,
    username,
    permissions,
    config,
  );
  const query_params = querystring.stringify(credentials);
  const url = `${CONFIG.site.webAPIOpenURL}?${query_params}`;
  return url;
}

// returns a random number string of a given base and length
function randomBase(base, length) {
  const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += DIGITS.charAt(Math.floor(Math.random() * base));
  }
  return result;
}

// finds a nonce for a given challenge, difficulty and timetag
function find_challenge_nonce(challenge, difficulty, timetag) {
  let hash;
  let nonce;
  let i = 0;
  do {
    i += 1;
    nonce = randomBase(62, 50);
    hash = sha256(`${challenge}|${nonce}|${timetag}`);
  } while (hash.substring(0, difficulty.length) !== difficulty);
  return nonce;
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

/**
 * Execute draw.chat API call
 *
 * @param {string} privateKeyPEM - private key in PEM format
 * @param {string} publicKeyPEM - public key in PEM format
 * @param {string} boardUniqueKey - unique board key
 * @param {string} username - username
 * @param {string} action - 'reset' | 'update' (reset board or update board)
 * @param {object} config - draw.chat config
 * @param {array} commands - chat commands array
 */
function drawchat_api_call(
  privateKeyPEM,
  publicKeyPEM,
  boardUniqueKey,
  username = 'API_CALL',
  action = 'reset',
  config = null,
  commands = [],
) {
  const API_USERNAME = username;
  const API_PERMISSIONS = 'RDC___';
  const credentials = get_drawchat_credentials(
    privateKeyPEM,
    publicKeyPEM,
    boardUniqueKey,
    API_USERNAME,
    API_PERMISSIONS,
    config,
  );
  const room_token_nonce = get_drawchat_room_valid_token_nonce(credentials);
  const websocket_address = get_websocket_server_address(room_token_nonce.token);
  const ws = new WebSocket(websocket_address);
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.cmd === 'welcome') {
      const responses = [
        find_challenge_nonce(
          message.challenge,
          message.difficulty,
          Math.round(parseInt(message.ts, 10) / parseInt(message.crtr, 10)),
        ),
      ];
      const query = {
        cmd: 'setup',
        action,
        responses,
        user_name: API_USERNAME,
        user_signature: credentials.signature,
        room_token: room_token_nonce.token,
        room_public_key: credentials.public_key,
        room_nonce: room_token_nonce.nonce,
        room_seed: credentials.bseed,
        room_config: config,
      };
      ws.send(JSON.stringify(query));
    }
    if (message.cmd === 'pass-in') {
      if (commands.length > 0) {
        commands.forEach((command) => {
          ws.send(
            JSON.stringify({
              cmd: 'text-message',
              message: command,
            }),
          );
        });
        ws.close();
      }
    }
  });
}

Object.assign(exports, {
  get_drawchat_credentials,
  get_drawchat_link,
  get_websocket_server_address,
  get_drawchat_room_valid_token_nonce,
  drawchat_api_call,
  generateKeyPair,
});
