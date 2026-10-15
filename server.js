/**
 * ATELIER NOIR - Decoupled Express.js & SQLite3 Server
 * Exposes full RESTful API for Catalog, Orders, Admin Metrics, and Local File Uploads (Multer).
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup local uploads storage with Multer
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'garment-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Serve uploaded media
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve decoupled frontend static assets
const CLIENT_DIR = path.join(__dirname, 'client');
app.use(express.static(CLIENT_DIR));

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Health & Architecture Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    phase: 'Phase 2 - Decoupled Express + SQLite3 REST API Active',
    database: 'SQLite3 (atelier.db)',
    uploadStorage: 'Local Filesystem (./uploads)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 2. Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Database.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Products (with multi-attribute filters)
app.get('/api/products', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      size: req.query.size,
      search: req.query.search,
      maxPrice: req.query.maxPrice,
      sort: req.query.sort,
      inStockOnly: req.query.inStockOnly
    };
    const products = await Database.getProducts(filters);
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Product by Slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const product = await Database.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Garment not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Create Product (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const created = await Database.createProduct(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Local File Upload (Multer)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  const relativeUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    filename: req.file.filename,
    url: relativeUrl,
    size: req.file.size
  });
});

// 7. Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Database.getAllOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const order = await Database.getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Order (Atomic Transaction with Inventory Lock/Deduction)
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, totals, shippingMethod } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bag is empty' });
    }

    const order = await Database.createOrder({
      customer,
      items,
      totals,
      shippingMethod
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Order Status
app.put('/api/orders/:orderNumber/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const updated = await Database.updateOrderStatus(req.params.orderNumber, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Admin Operations Metrics
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const metrics = await Database.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize database and boot server
Database.initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(`  ATELIER NOIR - Apparel Platform (Decoupled Node + Express + SQLite3)`);
    console.log('================================================================');
    console.log(`  > Storefront:  http://localhost:${PORT}`);
    console.log(`  > Catalog:     http://localhost:${PORT}/shop.html`);
    console.log(`  > Profile:     http://localhost:${PORT}/profile.html`);
    console.log(`  > Admin Hub:   http://localhost:${PORT}/admin.html`);
    console.log(`  > API Root:    http://localhost:${PORT}/api/products`);
    console.log(`  > Health:      http://localhost:${PORT}/api/health`);
    console.log('================================================================');
  });
}).catch(err => {
  console.error('[Database Error] Failed to initialize SQLite3 database:', err);
});
