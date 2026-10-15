/**
 * ATELIER NOIR - Decoupled Client State & API Service Layer
 * Fully wired to Express.js REST API with SQLite3 backend persistence and local storage synchronization.
 */

const STORAGE_KEYS = {
  CART: 'atelier_cart_v1',
  WISHLIST: 'atelier_wishlist_v1',
  ORDERS_CACHE: 'atelier_orders_cache_v1',
  PRODUCTS_CACHE: 'atelier_products_cache_v1',
  PROMO: 'atelier_active_promo_v1'
};

const Store = {
  // --- Products & Catalog (SQLite3 REST API) ---
  getProducts(filters = {}) {
    // Return cached/seeded products synchronously for fast initial render
    let list = [];
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHE));
      if (cached && cached.length > 0) {
        list = cached;
      }
    } catch (e) {}

    if (list.length === 0) {
      list = [...APPAREL_PRODUCTS];
    }

    // Apply Client-Side Filters
    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.department && filters.department !== 'all') {
      list = list.filter(p => p.department.toLowerCase() === filters.department.toLowerCase() || p.department === 'Unisex');
    }
    if (filters.size) {
      list = list.filter(p => (p.sizes || []).some(s => s.size === filters.size && s.stock > 0));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      );
    }
    if (filters.maxPrice) {
      list = list.filter(p => p.price <= parseFloat(filters.maxPrice));
    }
    if (filters.inStockOnly) {
      list = list.filter(p => (p.sizes || []).some(s => s.stock > 0));
    }

    // Sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price-low':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          list.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
        default:
          break;
      }
    }

    return list;
  },

  // Asynchronous fetch directly from SQLite3 Backend
  async fetchProductsFromAPI(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHE, JSON.stringify(json.data));
        return json.data;
      }
    } catch (e) {
      console.warn('[Store] API fetch failed, falling back to local dataset:', e);
    }
    return this.getProducts(filters);
  },

  getProductBySlug(slug) {
    const all = this.getProducts();
    return all.find(p => p.slug === slug) || null;
  },

  getProductById(id) {
    const all = this.getProducts();
    return all.find(p => p.id === id) || null;
  },

  getCategories() {
    return APPAREL_CATEGORIES;
  },

  // Upload image to local /uploads/ directory via Multer API
  async uploadLocalImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        return data.url;
      }
    } catch (err) {
      console.error('[Store] Local image upload failed:', err);
    }
    return null;
  },

  // Publish new product to SQLite3 API
  async addProductToAPI(productData) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const result = await res.json();
      if (result.success) {
        await this.fetchProductsFromAPI();
        return result.data;
      }
    } catch (err) {
      console.error('[Store] Failed to create product via API:', err);
    }
    return null;
  },

  // --- Cart Management ---
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
  },

  addToCart(productId, sku, size, colorName, colorHex, quantity = 1) {
    const product = this.getProductById(productId);
    if (!product) return { success: false, message: 'Product not found' };

    const variant = (product.sizes || []).find(s => s.sku === sku || s.size === size);
    if (!variant || variant.stock < quantity) {
      return { success: false, message: 'Requested size or stock unavailable' };
    }

    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.sku === sku);

    const colorObj = (product.colors || []).find(c => c.name === colorName);
    const itemImage = colorObj ? colorObj.image : (product.images ? product.images.primary : '');

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + quantity;
      if (newQty > variant.stock) {
        return { success: false, message: `Only ${variant.stock} units available in stock.` };
      }
      cart[existingIndex].quantity = newQty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        slug: product.slug,
        sku: variant.sku,
        size: size,
        colorName: colorName,
        colorHex: colorHex,
        price: product.price,
        image: itemImage,
        quantity: quantity,
        maxStock: variant.stock
      });
    }

    this.saveCart(cart);
    return { success: true, message: `Added ${product.title} (${size}) to bag.` };
  },

  updateCartQty(sku, newQty) {
    const cart = this.getCart();
    const item = cart.find(i => i.sku === sku);
    if (!item) return;

    if (newQty <= 0) {
      this.removeFromCart(sku);
      return;
    }

    item.quantity = Math.min(newQty, item.maxStock);
    this.saveCart(cart);
  },

  removeFromCart(sku) {
    const cart = this.getCart().filter(item => item.sku !== sku);
    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },

  getCartTotals(promoCode = null) {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const FREE_SHIPPING_THRESHOLD = 150.00;
    let shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 15.00;
    let discountAmount = 0;
    let appliedPromo = null;

    const activeCode = promoCode || localStorage.getItem(STORAGE_KEYS.PROMO);
    if (activeCode && PROMO_CODES[activeCode.toUpperCase()]) {
      const rule = PROMO_CODES[activeCode.toUpperCase()];
      if (subtotal >= rule.minOrder) {
        appliedPromo = { code: activeCode.toUpperCase(), ...rule };
        if (rule.discountPercent) {
          discountAmount = (subtotal * rule.discountPercent) / 100;
        } else if (rule.discountAmount) {
          discountAmount = rule.discountAmount;
        } else if (rule.freeShipping) {
          shippingFee = 0;
        }
      }
    }

    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const tax = taxableSubtotal * 0.08;
    const total = taxableSubtotal + shippingFee + tax;
    const progressToFreeShipping = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

    return {
      subtotal,
      shippingFee,
      discountAmount,
      tax,
      total,
      appliedPromo,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      progressToFreeShipping,
      amountNeededForFreeShipping
    };
  },

  applyPromo(code) {
    const normalized = (code || '').toUpperCase().trim();
    if (!PROMO_CODES[normalized]) {
      return { success: false, message: 'Invalid or expired promotional code.' };
    }
    const rule = PROMO_CODES[normalized];
    const subtotal = this.getCartTotals().subtotal;
    if (subtotal < rule.minOrder) {
      return { success: false, message: `Promo requires minimum subtotal of $${rule.minOrder}.` };
    }

    localStorage.setItem(STORAGE_KEYS.PROMO, normalized);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: this.getCart() }));
    return { success: true, message: `Promo "${normalized}" applied: ${rule.label}` };
  },

  removePromo() {
    localStorage.removeItem(STORAGE_KEYS.PROMO);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: this.getCart() }));
  },

  // --- Wishlist Management ---
  getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST)) || [];
    } catch (e) {
      return [];
    }
  },

  toggleWishlist(productId) {
    let list = this.getWishlist();
    const exists = list.includes(productId);
    if (exists) {
      list = list.filter(id => id !== productId);
    } else {
      list.push(productId);
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: list }));
    return !exists;
  },

  isInWishlist(productId) {
    return this.getWishlist().includes(productId);
  },

  // --- Orders & SQLite3 Checkout Integration ---
  async createOrder(customerDetails, shippingMethod = 'standard') {
    const cart = this.getCart();
    if (cart.length === 0) return { success: false, message: 'Cart is empty' };

    const totals = this.getCartTotals();
    const payload = {
      customer: customerDetails,
      items: cart,
      totals: totals,
      shippingMethod: shippingMethod
    };

    try {
      // Post to Express + SQLite3 backend
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        this.clearCart();
        this.removePromo();
        
        // Cache order locally
        let cached = this.getAllOrders();
        cached.unshift(data.data);
        localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(cached));
        
        // Refresh product inventory cache
        this.fetchProductsFromAPI();

        return { success: true, order: data.data };
      }
    } catch (err) {
      console.warn('[Store] Remote order post failed, creating local offline order:', err);
    }

    // Fallback local order creation if offline
    const orderNumber = 'ATN-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      orderId: 'ord_' + Date.now(),
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Processing',
      items: [...cart],
      customer: customerDetails,
      shippingMethod: shippingMethod,
      totals: totals,
      trackingNumber: 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };

    let orders = this.getAllOrders();
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(orders));
    this.clearCart();
    this.removePromo();
    return { success: true, order: newOrder };
  },

  getAllOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS_CACHE)) || [];
    } catch (e) {
      return [];
    }
  },

  async fetchOrdersFromAPI() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(data.data));
        return data.data;
      }
    } catch (err) {
      console.warn('[Store] Orders API fetch failed:', err);
    }
    return this.getAllOrders();
  },

  getOrder(orderNumber) {
    const orders = this.getAllOrders();
    return orders.find(o => o.orderNumber === orderNumber || o.orderId === orderNumber) || null;
  },

  async updateOrderStatus(orderNumber, newStatus) {
    try {
      const res = await fetch(`/api/orders/${orderNumber}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        await this.fetchOrdersFromAPI();
        return true;
      }
    } catch (err) {
      console.warn('[Store] Status update API failed:', err);
    }

    const orders = this.getAllOrders();
    const target = orders.find(o => o.orderNumber === orderNumber || o.orderId === orderNumber);
    if (target) {
      target.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(orders));
      return true;
    }
    return false;
  }
};

// Initial background sync with SQLite3 API on load
if (typeof window !== 'undefined') {
  window.Store = Store;
  document.addEventListener('DOMContentLoaded', () => {
    Store.fetchProductsFromAPI();
    Store.fetchOrdersFromAPI();
  });
}
