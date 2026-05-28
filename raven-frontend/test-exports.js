const fs = require('fs');

const files = [
  'src/pages/dashboard/Dashboard.tsx',
  'src/pages/leaderboard/Leaderboard.tsx',
  'src/pages/wallet/WalletPage.tsx',
  'src/pages/profile/ProfilePage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/RegisterPage.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasExport = content.includes('export default');
    const componentName = content.match(/const (\w+): React\.FC/) || content.match(/function (\w+)/);
    console.log(`${file}: ${hasExport ? '✓ Has export' : '✗ Missing export'} ${componentName ? `(${componentName[1]})` : ''}`);
  } else {
    console.log(`${file}: File not found`);
  }
});
