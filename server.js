/**
 * ATELIER NOIR - Express Application Server
 * Decoupled Architecture: Serves static frontend client and static upload assets.
 * Ready to be extended with SQLite3 REST API in Phase 2.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure local upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`[Uploads] Created local upload directory: ${UPLOAD_DIR}`);
}

// Serve uploaded media files
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve decoupled frontend static assets
const CLIENT_DIR = path.join(__dirname, 'client');
app.use(express.static(CLIENT_DIR));

// Health / Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    phase: 'Phase 1 - Decoupled Frontend Active',
    nextPhase: 'Phase 2 - SQLite3 REST API Persistence',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for root navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// Start the Express server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`  ATELIER NOIR - Apparel E-Commerce Platform Server`);
  console.log(`  Decoupled Architecture (Express.js + Vanilla JS + Bootstrap 5)`);
  console.log('================================================================');
  console.log(`  > Storefront:  http://localhost:${PORT}`);
  console.log(`  > Catalog:     http://localhost:${PORT}/shop.html`);
  console.log(`  > Admin Hub:   http://localhost:${PORT}/admin.html`);
  console.log(`  > Health Check: http://localhost:${PORT}/api/health`);
  console.log('================================================================');
});
