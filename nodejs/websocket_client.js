const fs = require('fs');
const path = require('path');
const publicKeyPath = path.join(__dirname, '../keys/public.key');
const privateKeyPath = path.join(__dirname, '../keys/.private.key');
const $publicKey = fs.readFileSync(publicKeyPath, 'utf8');
const $privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const { get_drawchat_link, drawchat_api_call } = require('./lib/drawchat.lib.js');

const $boardUniqueKey = 'CustomBoardId125';

/**
 * "RDC___" - is an administrator (teacher), can draw and chat
 * "ADC___" - is a user (student), can access board, can draw and chat
 * "AD____" - is a user (student), can access board, can draw, but can't chat
 * "A_C___" - is a user (student), can access board, can chat, but can't draw
 * "A_____" - is a user (student), can access board, but can't draw and chat
 */
$permissions = 'ADC___';

const testBoardConfig = {
  // temporary: true, // temporary board - will be deleted after the last user leaves
  title: 'Example title',
  description: 'Example description',
  features: {
    displayChat: true,
    displayChatWebrtc: true,
    displayCrosshair: false,
    displayPages: true,
    displayToolbar: true,
    displayViewports: false,
  },
  toolbar: [
    // "sketchbook",
    // "share",
    'download',
    // "upload",
    'reset',
    'pen',
    // "autopen",
    // "crayon",
    // "smoothpen",
    'highlighter',
    // "feather",
    // "nib",
    // "rainbow",
    // "mandala",
    // "line",
    // "rectangle",
    // "ellipse",
    // "type",
    // "image",
    'colorpicker',
    'undo-redo',
    // "cutout",
    'eraser',
    'move-viewport',
    'rotate-viewport',
    'zoom',
    'center',
    // "layers-switcher",
    // "viewport-position",
    'connection-status',
    // 'fullscreen',
  ],
  defaultTool: 'pen',
  pages: {
    page1: {
      backgroundColor: 'black',
    },
    page2: {
      backgroundColor: '#FEF9E7',
      backgroundImage:
        'https://upload.wikimedia.org/wikipedia/commons/1/17/A-DNA_orbit_animated_small.gif',
    },
  },
};

const userLink = get_drawchat_link(
  $privateKey,
  $publicKey,
  $boardUniqueKey,
  'JohnDoe',
  $permissions,
  testBoardConfig,
);
console.log(`\n---\nUSER:\n${userLink}\n---`);

const bannedUserLink = get_drawchat_link(
  $privateKey,
  $publicKey,
  $boardUniqueKey,
  'BanMe',
  $permissions,
  testBoardConfig,
);
console.log(`\n---\nBANNED USER:\n${bannedUserLink}\n---`);

drawchat_api_call($privateKey, $publicKey, $boardUniqueKey, 'API', 'reset', testBoardConfig, [
  '/ban BanMe',
  '/play https://youtu.be/dQw4w9WgXcQ',
]);
