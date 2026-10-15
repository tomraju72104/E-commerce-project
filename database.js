/**
 * ATELIER NOIR - SQLite3 Database & Domain Repository
 * Handles relational schema setup, atomic transactions, and auto-seeding.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'atelier.db');
const db = new sqlite3.Database(DB_PATH);

// Helper to run queries as Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDatabase() {
  console.log(`[Database] Initializing SQLite3 database at: ${DB_PATH}`);

  // Enable WAL mode for high concurrency
  await run('PRAGMA journal_mode = WAL;');

  // 1. Categories Table
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      count INT DEFAULT 0
    )
  `);

  // 2. Products Table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      department TEXT DEFAULT 'Unisex',
      price REAL NOT NULL,
      compare_at_price REAL,
      badge TEXT,
      badge_type TEXT,
      rating REAL DEFAULT 5.0,
      review_count INT DEFAULT 0,
      is_featured INT DEFAULT 0,
      is_trending INT DEFAULT 0,
      description TEXT,
      fabric_details TEXT,
      care_guide TEXT,
      fit_note TEXT,
      primary_image TEXT,
      hover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Product Gallery Images
  await run(`
    CREATE TABLE IF NOT EXISTS product_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // 4. Product Colorways
  await run(`
    CREATE TABLE IF NOT EXISTS product_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hex TEXT NOT NULL,
      image_url TEXT,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // 5. Product Variants (Size x Stock Matrix)
  await run(`
    CREATE TABLE IF NOT EXISTS product_variants (
      sku TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL,
      stock INT DEFAULT 0,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // 6. Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      customer_json TEXT,
      shipping_method TEXT,
      totals_json TEXT,
      tracking_number TEXT,
      estimated_delivery TEXT
    )
  `);

  // 7. Order Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      title TEXT NOT NULL,
      sku TEXT,
      size TEXT,
      color_name TEXT,
      quantity INT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    )
  `);

  // 8. User Profile Table
  await run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      fit_profile_json TEXT,
      addresses_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Auto-seed if database is empty
  await seedIfEmpty();
}

async function seedIfEmpty() {
  const countRow = await get('SELECT COUNT(*) as cnt FROM products');
  if (countRow && countRow.cnt > 0) {
    console.log(`[Database] Products table already contains ${countRow.cnt} items. Seeding skipped.`);
    return;
  }

  console.log('[Database] Seeding initial apparel catalog into SQLite3...');

  // Seed Categories
  const { APPAREL_CATEGORIES, APPAREL_PRODUCTS } = require('./client/js/data.js');

  for (const cat of APPAREL_CATEGORIES) {
    await run(`INSERT OR REPLACE INTO categories (id, name, slug, count) VALUES (?, ?, ?, ?)`,
      [cat.id, cat.name, cat.slug, cat.count || 0]
    );
  }

  // Seed Products and Variants
  for (const p of APPAREL_PRODUCTS) {
    await run(`
      INSERT INTO products (
        id, title, slug, category, category_name, department, price, compare_at_price,
        badge, badge_type, rating, review_count, is_featured, is_trending,
        description, fabric_details, care_guide, fit_note, primary_image, hover_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.id, p.title, p.slug, p.category, p.categoryName, p.department || 'Unisex',
      p.price, p.compareAtPrice || null, p.badge || null, p.badgeType || null,
      p.rating || 5.0, p.reviewCount || 0, p.isFeatured ? 1 : 0, p.isTrending ? 1 : 0,
      p.description, p.fabricDetails, p.careGuide, p.fitNote,
      p.images.primary, p.images.hover || p.images.primary
    ]);

    // Gallery
    if (p.images && p.images.gallery) {
      for (let i = 0; i < p.images.gallery.length; i++) {
        await run(`INSERT INTO product_gallery (product_id, image_url, sort_order) VALUES (?, ?, ?)`,
          [p.id, p.images.gallery[i], i]
        );
      }
    }

    // Colors
    if (p.colors) {
      for (const c of p.colors) {
        await run(`INSERT INTO product_colors (product_id, name, hex, image_url) VALUES (?, ?, ?, ?)`,
          [p.id, c.name, c.hex, c.image]
        );
      }
    }

    // Variants (Sizes & Stock)
    if (p.sizes) {
      for (const s of p.sizes) {
        await run(`INSERT INTO product_variants (sku, product_id, size, stock) VALUES (?, ?, ?, ?)`,
          [s.sku, p.id, s.size, s.stock]
        );
      }
    }
  }

  // Seed default sample order
  await run(`
    INSERT INTO orders (order_id, order_number, status, customer_json, shipping_method, totals_json, tracking_number, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ord_init_001',
    'ATN-847291',
    'Shipped',
    JSON.stringify({ firstName: 'Alexander', lastName: 'Wright', email: 'concierge.client@example.com', address: '742 Evergreen Terrace, Apt 4B', city: 'New York', state: 'NY', zip: '10001' }),
    'Carbon-Neutral Standard',
    JSON.stringify({ subtotal: 385.00, discountAmount: 0, shippingFee: 0, tax: 30.80, total: 415.80 }),
    'TRK-8491823',
    'In 2 business days'
  ]);

  await run(`
    INSERT INTO order_items (order_id, product_id, title, sku, size, color_name, quantity, price, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ord_init_001', 'prod_001', 'Double-Breasted Cashmere-Wool Overcoat', 'OC-CAM-M', 'M', 'Camel Tan', 1, 385.00,
    'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000'
  ]);

  console.log('[Database] Pre-seeding completed successfully!');
}

// Data Access API
const Database = {
  db,
  initDatabase,
  run,
  all,
  get,

  // Get all products with attached colors, gallery, and variants
  async getProducts(filters = {}) {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.category && filters.category !== 'all') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(filters.category);
    }

    if (filters.search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category_name) LIKE ?)';
      const q = `%${filters.search.toLowerCase()}%`;
      params.push(q, q, q);
    }

    if (filters.maxPrice) {
      sql += ' AND price <= ?';
      params.push(parseFloat(filters.maxPrice));
    }

    if (filters.sort) {
      if (filters.sort === 'price-low') sql += ' ORDER BY price ASC';
      else if (filters.sort === 'price-high') sql += ' ORDER BY price DESC';
      else if (filters.sort === 'rating') sql += ' ORDER BY rating DESC';
      else sql += ' ORDER BY created_at DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const products = await all(sql, params);

    // Hydrate each product with its gallery, colors, and variants
    for (const p of products) {
      p.categoryName = p.category_name;
      p.compareAtPrice = p.compare_at_price;
      p.badgeType = p.badge_type;
      p.fabricDetails = p.fabric_details;
      p.careGuide = p.care_guide;
      p.fitNote = p.fit_note;

      const galleryRows = await all('SELECT image_url FROM product_gallery WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
      p.images = {
        primary: p.primary_image,
        hover: p.hover_image,
        gallery: galleryRows.map(g => g.image_url)
      };

      p.colors = await all('SELECT name, hex, image_url as image FROM product_colors WHERE product_id = ?', [p.id]);
      p.sizes = await all('SELECT sku, size, stock FROM product_variants WHERE product_id = ?', [p.id]);
    }

    // Filter by size in memory if requested
    if (filters.size) {
      return products.filter(p => p.sizes.some(s => s.size === filters.size && s.stock > 0));
    }

    if (filters.inStockOnly === true || filters.inStockOnly === 'true') {
      return products.filter(p => p.sizes.some(s => s.stock > 0));
    }

    return products;
  },

  async getProductBySlug(slug) {
    const p = await get('SELECT * FROM products WHERE slug = ?', [slug]);
    if (!p) return null;

    p.categoryName = p.category_name;
    p.compareAtPrice = p.compare_at_price;
    p.badgeType = p.badge_type;
    p.fabricDetails = p.fabric_details;
    p.careGuide = p.care_guide;
    p.fitNote = p.fit_note;

    const galleryRows = await all('SELECT image_url FROM product_gallery WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
    p.images = {
      primary: p.primary_image,
      hover: p.hover_image,
      gallery: galleryRows.length > 0 ? galleryRows.map(g => g.image_url) : [p.primary_image]
    };

    p.colors = await all('SELECT name, hex, image_url as image FROM product_colors WHERE product_id = ?', [p.id]);
    p.sizes = await all('SELECT sku, size, stock FROM product_variants WHERE product_id = ?', [p.id]);

    return p;
  },

  async getCategories() {
    return await all('SELECT * FROM categories ORDER BY name ASC');
  },

  async createProduct(productData) {
    const id = productData.id || `prod_${Date.now()}`;
    const slug = productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    await run(`
      INSERT INTO products (
        id, title, slug, category, category_name, department, price, compare_at_price,
        badge, badge_type, rating, review_count, description, fabric_details, care_guide, primary_image, hover_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, productData.title, slug, productData.category,
      productData.categoryName || productData.category,
      productData.department || 'Unisex',
      parseFloat(productData.price),
      productData.compareAtPrice ? parseFloat(productData.compareAtPrice) : null,
      productData.badge || null,
      productData.badgeType || 'new',
      5.0, 1,
      productData.description || '',
      productData.fabricDetails || 'Luxury tailored specification.',
      productData.careGuide || 'Professional dry cleaning.',
      productData.imageUrl, productData.imageUrl
    ]);

    // Add primary gallery image
    await run(`INSERT INTO product_gallery (product_id, image_url, sort_order) VALUES (?, ?, 0)`, [id, productData.imageUrl]);

    // Add default color
    await run(`INSERT INTO product_colors (product_id, name, hex, image_url) VALUES (?, ?, ?, ?)`,
      [id, 'Standard Edition', '#111215', productData.imageUrl]
    );

    // Add sizes
    if (productData.sizes && Array.isArray(productData.sizes)) {
      for (const s of productData.sizes) {
        await run(`INSERT INTO product_variants (sku, product_id, size, stock) VALUES (?, ?, ?, ?)`,
          [s.sku || `SKU-${s.size}-${Date.now()}`, id, s.size, parseInt(s.stock) || 0]
        );
      }
    }

    return await this.getProductBySlug(slug);
  },

  // Atomic Order Creation with Stock Deduction
  async createOrder(orderData) {
    const orderNumber = 'ATN-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = 'ord_' + Date.now();
    const tracking = 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const estDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    // Run in transaction
    await run('BEGIN TRANSACTION');
    try {
      // 1. Insert order record
      await run(`
        INSERT INTO orders (order_id, order_number, status, customer_json, shipping_method, totals_json, tracking_number, estimated_delivery)
        VALUES (?, ?, 'Processing', ?, ?, ?, ?, ?)
      `, [
        orderId, orderNumber,
        JSON.stringify(orderData.customer),
        orderData.shippingMethod || 'Standard',
        JSON.stringify(orderData.totals),
        tracking, estDelivery
      ]);

      // 2. Insert items and decrement variant stock
      for (const item of orderData.items) {
        await run(`
          INSERT INTO order_items (order_id, product_id, title, sku, size, color_name, quantity, price, image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId, item.id, item.title, item.sku, item.size, item.colorName,
          item.quantity, item.price, item.image
        ]);

        // Decrement stock
        if (item.sku) {
          await run(`
            UPDATE product_variants
            SET stock = MAX(0, stock - ?)
            WHERE sku = ?
          `, [item.quantity, item.sku]);
        }
      }

      await run('COMMIT');

      return await this.getOrderByNumber(orderNumber);
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }
  },

  async getAllOrders() {
    const orders = await all('SELECT * FROM orders ORDER BY created_at DESC');
    for (const o of orders) {
      o.customer = JSON.parse(o.customer_json || '{}');
      o.totals = JSON.parse(o.totals_json || '{}');
      o.items = await all('SELECT * FROM order_items WHERE order_id = ?', [o.order_id]);
    }
    return orders;
  },

  async getOrderByNumber(orderNumber) {
    const o = await get('SELECT * FROM orders WHERE order_number = ? OR order_id = ?', [orderNumber, orderNumber]);
    if (!o) return null;
    o.customer = JSON.parse(o.customer_json || '{}');
    o.totals = JSON.parse(o.totals_json || '{}');
    o.items = await all('SELECT * FROM order_items WHERE order_id = ?', [o.order_id]);
    return o;
  },

  async updateOrderStatus(orderNumber, status) {
    await run('UPDATE orders SET status = ? WHERE order_number = ? OR order_id = ?', [status, orderNumber, orderNumber]);
    return await this.getOrderByNumber(orderNumber);
  },

  async getMetrics() {
    const orders = await this.getAllOrders();
    const grossVolume = orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);
    const lowStockRow = await get('SELECT COUNT(*) as cnt FROM product_variants WHERE stock > 0 AND stock <= 3');
    const totalSkusRow = await get('SELECT COUNT(*) as cnt FROM product_variants');

    return {
      grossVolume,
      activeOrders: orders.filter(o => o.status === 'Processing').length,
      totalOrders: orders.length,
      totalSkus: totalSkusRow ? totalSkusRow.cnt : 0,
      lowStockCount: lowStockRow ? lowStockRow.cnt : 0
    };
  }
};

module.exports = Database;
