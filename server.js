import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLeaderboard, addLeaderboardEntry, exportLeaderboard } from './src/leaderboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check CLI export flag: <run_cmd> --export-leaderboard out.json
let exportPath = null;
const exportIdx = process.argv.indexOf('--export-leaderboard');
if (exportIdx !== -1 && exportIdx + 1 < process.argv.length) {
  exportPath = process.argv[exportIdx + 1];
} else if (process.env.npm_config_export_leaderboard) {
  // Handles npm start --export-leaderboard <path>
  exportPath = process.argv[2] || process.env.npm_config_export_leaderboard;
}

if (exportPath) {
  try {
    exportLeaderboard(exportPath);
    console.log(`Leaderboard successfully exported to ${exportPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to export leaderboard: ${err.message}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // API Endpoints for Leaderboard
  if (reqPath === '/api/leaderboard') {
    if (req.method === 'GET') {
      const entries = loadLeaderboard();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ entries }));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const entries = addLeaderboardEntry(payload);
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: true, entries }));
        } catch (err) {
          res.writeHead(400, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

  if (reqPath === '/') reqPath = '/index.html';

  let filePath;
  if (reqPath.startsWith('/src/')) {
    filePath = path.join(__dirname, reqPath);
  } else if (reqPath === '/game.contract.json') {
    filePath = path.join(__dirname, 'game.contract.json');
  } else {
    filePath = path.join(PUBLIC_DIR, reqPath);
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Đảo Đèn Lồng 3D Game Server running at: http://localhost:${PORT}`);
});
