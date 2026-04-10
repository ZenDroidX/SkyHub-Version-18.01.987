const { execSync } = require('child_process');
try {
  console.log(execSync('find / -name layout.tsx 2>/dev/null').toString());
} catch (e) {
  console.log(e.stdout.toString());
}
