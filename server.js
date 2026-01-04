const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'database.json');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    // CORS headers for local development if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API Routes
    if (req.url.startsWith('/api/')) {
        handleApi(req, res);
        return;
    }

    // Static File Serving
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './app.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function handleApi(req, res) {
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const credentials = JSON.parse(body);
            const db = readDb();
            const user = db.users.find(u => u.username === credentials.username && u.password === credentials.password);
            if (user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: user }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
            }
        });
    } else if (req.url === '/api/messages' && req.method === 'GET') {
        const db = readDb();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.messages));
    } else if (req.url === '/api/messages' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const newMessage = JSON.parse(body);
            const db = readDb();
            // Simple ID generation
            newMessage.id = Date.now();
            db.messages.push(newMessage);
            writeDb(db);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Message sent' }));
        });
    } else if (req.url === '/api/users' && req.method === 'GET') {
        const db = readDb();
        // Return users without passwords if needed, but for admin users table we show it (as per requirement)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.users));
    } else if (req.url === '/api/users' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const newUser = JSON.parse(body);
            const db = readDb();
            db.users.push(newUser);
            writeDb(db);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'API Endpoint not found' }));
    }
}

function readDb() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { users: [], messages: [] };
    }
}

function writeDb(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('To access from other devices, use your IP address (e.g., http://192.168.1.X:3000)');
});
