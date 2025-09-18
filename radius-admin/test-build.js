const { exec } = require('child_process');

exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
    return;
  }
  console.log('Build output:', stdout);
});
