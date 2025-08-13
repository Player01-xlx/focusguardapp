
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up FocusGuard Backend...');

// Copy backend package.json to root
if (fs.existsSync('package-backend.json')) {
  const backendPackage = JSON.parse(fs.readFileSync('package-backend.json', 'utf8'));
  const frontendPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Merge dependencies
  const mergedPackage = {
    ...frontendPackage,
    dependencies: {
      ...frontendPackage.dependencies,
      ...backendPackage.dependencies
    },
    devDependencies: {
      ...frontendPackage.devDependencies,
      ...backendPackage.devDependencies
    },
    scripts: {
      ...frontendPackage.scripts,
      "start": "node server.js",
      "backend": "nodemon server.js",
      "build-and-start": "npm run build && npm start"
    }
  };
  
  fs.writeFileSync('package.json', JSON.stringify(mergedPackage, null, 2));
  console.log('📦 Updated package.json with backend dependencies');
  
  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('✅ Backend setup complete!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm start');
  console.log('3. Your app will be available with authentication!');
} else {
  console.error('❌ package-backend.json not found');
}
