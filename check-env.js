/**
 * Debug script to check environment variables
 * Run with: node check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Environment Variables Check ===\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  console.log('✓ .env file found\n');
  console.log('Contents:');
  lines.forEach((line, index) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        // Mask sensitive values
        const maskedValue = key.includes('KEY') || key.includes('SECRET')
          ? value.substring(0, 20) + '...[MASKED]'
          : value;
        console.log(`  ${key.trim()}: ${maskedValue}`);
      }
    }
  });

  // Check Supabase URL format
  const supabaseUrlLine = lines.find(l => l.startsWith('VITE_SUPABASE_URL='));
  if (supabaseUrlLine) {
    const url = supabaseUrlLine.split('=')[1];
    console.log('\n--- Supabase URL Validation ---');
    console.log(`URL: ${url}`);

    if (url.includes('dashboard')) {
      console.log('❌ ERROR: URL contains "dashboard" - this is wrong!');
      console.log('Expected format: https://[project-ref].supabase.co');

      // Try to extract project ref
      const match = url.match(/project\/([a-z0-9]+)/);
      if (match) {
        const projectRef = match[1];
        console.log(`\n✓ Detected project ref: ${projectRef}`);
        console.log(`Correct URL should be: https://${projectRef}.supabase.co`);
      }
    } else if (url.match(/https:\/\/[a-z0-9]+\.supabase\.co/)) {
      console.log('✓ URL format looks correct!');
    } else {
      console.log('⚠️  WARNING: URL format might be incorrect');
    }
  }

} else {
  console.log('❌ .env file not found!');
  console.log('Create a .env file in the project root with:');
  console.log('  VITE_SUPABASE_URL=https://[project-ref].supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=your-anon-key');
}

console.log('\n=== Next Steps ===');
console.log('1. Make sure the .env file has the correct Supabase URL');
console.log('2. Restart your dev server: npm run dev');
console.log('3. Reload the extension in Chrome');
console.log('4. Check the console for environment variable logs');
console.log('');
