const fs = require('fs');
const path = require('path');
const publicKeyPath = path.join(__dirname, '../keys/public.key');
const privateKeyPath = path.join(__dirname, '../keys/.private.key');
const $publicKey = fs.readFileSync(publicKeyPath, 'utf8');
const $privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const { get_drawchat_link } = require('./lib/drawchat.lib.js');

const $boardUniqueKey = 'CustomBoardId123';
const $userName = 'JohnDoe';

/**
 * "RDC___" - is an administrator (teacher), can draw and chat
 * "ADC___" - is a user (student), can access board, can draw and chat
 * "AD____" - is a user (student), can access board, can draw, but can't chat
 * "A_C___" - is a user (student), can access board, can chat, but can't draw
 * "A_____" - is a user (student), can access board, but can't draw and chat
 */
$permissions = 'RDC___';

const testBoardConfig = {
  //timestamp: Date.now(),
  features: {
    displayChat: false,
    displayChatWebrtc: false,
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
    // "reset",
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
  // 'title': 'Example title',
  // 'description': 'Example description',
  pages: {
    1: {
      backgroundColor: '#F9FEE7',
      backgroundImage: 'https://imagehost.pro/templates/grid_2000.svg',
      foregroundImage: 'https://imagehost.pro/templates/colouring_cat.svg',
    },
    2: {
      backgroundColor: '#FEF9E7',
      backgroundImage:
        'https://upload.wikimedia.org/wikipedia/commons/1/17/A-DNA_orbit_animated_small.gif',
    },
    3: {
      backgroundColor: 'LightSeaGreen',
    },
  },
};

const link = get_drawchat_link(
  $privateKey,
  $publicKey,
  $boardUniqueKey,
  $userName,
  $permissions,
  testBoardConfig,
);

console.log({ link });
