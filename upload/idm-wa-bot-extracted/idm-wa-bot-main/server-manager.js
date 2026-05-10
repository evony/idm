const { spawn } = require('child_process');
const fs = require('fs');
const logFile = '/tmp/next-dev.log';

function startServer() {
  const now = new Date().toISOString();
  fs.appendFileSync(logFile, `\n[${now}] Starting Next.js server...\n`);
  
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    fs.appendFileSync(logFile, data.toString());
  });

  child.stderr.on('data', (data) => {
    fs.appendFileSync(logFile, data.toString());
  });

  child.on('exit', (code, signal) => {
    const now2 = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${now2}] Server exited with code=${code} signal=${signal}\n`);
    // Restart after 3 seconds
    setTimeout(startServer, 3000);
  });

  child.on('error', (err) => {
    const now2 = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${now2}] Server error: ${err.message}\n`);
    setTimeout(startServer, 3000);
  });
}

startServer();
