// Test script to verify the exact data format used by the store website
// Based on the _0x3faccf function in index_store.js

const crypto = require('crypto');

// The secret we found
const secret = 'frpSTDbHmApb4CyZ';

// Example values from the user's network request
const params = {
  game_id: '20121',
  language_code: 'EN',
  login_type: 'role_id',
  role_id: '100579922',
  ts: 1768157727890,
  webVersion: 'v1.7.2',
};

// The _0x3faccf function sorts keys and creates query string
// Let's replicate it exactly
function createQueryString(obj) {
  // Get sorted keys
  const sortedKeys = Object.keys(obj).sort();

  // Create query string: key=value&key=value
  const queryString = sortedKeys.map((key) => `${key}=${obj[key]}`).join('&');

  return queryString;
}

// Create the data string
const data = createQueryString(params);
console.log('📝 Data string:', data);

// Generate HMAC
const authToken = crypto.createHmac('sha256', secret).update(data).digest('base64');
console.log('🔑 Generated auth token:', authToken);

// Expected token from user's request
const expectedToken = 'MTJlOWRlYmQxZTg5NDM1YjM3MjVkZmEwNTQ5YzUwYTRjMmZlOWVmNmE5ZjBiMGU5MGJhZmY0MzliNDk0ZWY1OQ==';
console.log('✅ Expected token:', expectedToken);
console.log('🔍 Match:', authToken === expectedToken ? 'YES ✅' : 'NO ❌');

// If it doesn't match, let's try base64url encoding instead
if (authToken !== expectedToken) {
  console.log('\n🔄 Trying base64url encoding...');
  const authTokenUrl = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  console.log('🔑 Generated auth token (base64url):', authTokenUrl);
  console.log('🔍 Match:', authTokenUrl === expectedToken ? 'YES ✅' : 'NO ❌');

  // Also try hex encoding
  console.log('\n🔄 Trying hex encoding...');
  const authTokenHex = crypto.createHmac('sha256', secret).update(data).digest('hex');
  console.log('🔑 Generated auth token (hex):', authTokenHex);

  // Try base64 encoding of hex
  const authTokenHexBase64 = Buffer.from(authTokenHex, 'hex').toString('base64');
  console.log('🔑 Generated auth token (hex->base64):', authTokenHexBase64);
  console.log('🔍 Match:', authTokenHexBase64 === expectedToken ? 'YES ✅' : 'NO ❌');
}
