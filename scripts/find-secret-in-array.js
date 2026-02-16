// Script to find the secret in the string array
// Run this in the browser console after finding the a27_0x4f9e function

// The secret we're looking for
const SECRET = 'frpSTDbHmApb4CyZ';

// Get the array
const stringArray = a27_0x4f9e();

console.log('🔍 Searching for secret in array...');
console.log('📊 Array length:', stringArray.length);

// Search for the secret directly
const directIndex = stringArray.indexOf(SECRET);
if (directIndex !== -1) {
  console.log(`✅ Found secret at index ${directIndex} (0x${directIndex.toString(16)})`);
} else {
  console.log('❌ Secret not found directly in array');
}

// Check index 0x5bd (1469 in decimal) - this was the index we saw in the HMAC call
const index0x5bd = 0x5bd; // 1469
console.log(`\n🔍 Checking index 0x5bd (${index0x5bd}):`);
if (stringArray[index0x5bd]) {
  console.log(`Value at 0x5bd: "${stringArray[index0x5bd]}"`);
  if (stringArray[index0x5bd] === SECRET) {
    console.log('✅ THIS IS THE SECRET!');
  }
} else {
  console.log('❌ No value at index 0x5bd');
}

// Search for partial matches or similar strings
console.log('\n🔍 Searching for similar strings...');
const similar = stringArray.filter((str, idx) =>
  str && (str.includes('frp') || str.includes('STD') || str.includes('HmAp') || str.includes('b4CyZ'))
);
if (similar.length > 0) {
  console.log('Found similar strings:');
  similar.forEach((str, idx) => {
    const originalIdx = stringArray.indexOf(str);
    console.log(`  Index ${originalIdx} (0x${originalIdx.toString(16)}): "${str}"`);
  });
}

// Also check if there's a function that maps 0x5bd to the secret
console.log('\n🔍 Checking for mapping function...');
// Look for functions that might access this array
console.log('Try checking the function that calls a27_0x4f9e()');
console.log('Look for something like: a27_0x4f9e()[0x5bd]');
