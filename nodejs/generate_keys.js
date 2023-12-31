const fs = require('fs');
const path = require('path');
const publicKeyPath = path.join(__dirname, '../keys/public.key');
const privateKeyPath = path.join(__dirname, '../keys/.private.key');
const { generateKeyPair } = require('./lib/drawchat.lib.js');

const keys = generateKeyPair();
fs.writeFileSync(publicKeyPath, keys.publicKey);
fs.writeFileSync(privateKeyPath, keys.privateKey);
console.log('New keys generated.');
