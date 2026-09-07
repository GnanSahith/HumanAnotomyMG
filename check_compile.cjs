const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log("Build passed.");
} catch (e) {
  console.log("Build failed:\n" + e.stdout.toString() + "\n" + e.stderr.toString());
}
