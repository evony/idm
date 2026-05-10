const { spawn } = require('child_process');
const fs = require('fs');

const LOG = '/tmp/next-server.log';
let restartCount = 0;

function start() {
  restartCount++;
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG, `\n[${ts}] Starting server (attempt #${restartCount})...\n`);
  
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (d) => fs.appendFileSync(LOG, d.toString()));
  child.stderr.on('data', (d) => fs.appendFileSync(LOG, d.toString()));
  
  child.on('exit', (code, sig) => {
    const ts2 = new Date().toISOString();
    fs.appendFileSync(LOG, `\n[${ts2}] EXIT code=${code} signal=${sig}\n`);
    setTimeout(start, 2000);
  });
  
  child.on('error', (err) => {
    const ts2 = new Date().toISOString();
    fs.appendFileSync(LOG, `\n[${ts2}] ERROR: ${err.message}\n`);
    setTimeout(start, 2000);
  });
}

start();
// Keep process alive
setInterval(() => {}, 60000);
