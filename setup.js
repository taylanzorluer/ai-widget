#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up AI Chat Widget...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  if (fs.existsSync('env.example')) {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created! Please edit it with your API keys.\n');
  } else {
    console.log('❌ env.example not found. Please create a .env file manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Install server dependencies
console.log('📦 Installing server dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Server dependencies installed!\n');
} catch (error) {
  console.log('❌ Failed to install server dependencies.\n');
  process.exit(1);
}

// Install client dependencies
console.log('📦 Installing client dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Client dependencies installed!\n');
} catch (error) {
  console.log('❌ Failed to install client dependencies.\n');
  process.exit(1);
}

// Build client
console.log('🔨 Building React client...');
try {
  execSync('npm run build-client', { stdio: 'inherit' });
  console.log('✅ Client built successfully!\n');
} catch (error) {
  console.log('❌ Failed to build client.\n');
  process.exit(1);
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env file with your API keys');
console.log('2. Run "npm start" to start the server');
console.log('3. Open example.html in your browser to test');
console.log('4. Add <script src="http://localhost:3001/widget.js"></script> to any website');
console.log('\n📚 For more information, see README.md'); 