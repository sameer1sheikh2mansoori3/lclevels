const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Checking for new LeetCode contest rating updates from upstream...');

try {
  execSync('curl -s https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/data.json -o lc_ratings.json', {
    stdio: 'inherit',
  });
  console.log('✅ Fetched latest upstream lc_ratings.json successfully.');

  // Run build-data.js
  execSync('node scripts/build-data.js', { stdio: 'inherit' });
  console.log('✅ Synchronized problems dataset.');
} catch (err) {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
}
