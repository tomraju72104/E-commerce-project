/**
 * ATELIER NOIR - Decoupled Client State & API Service Layer
 * Abstracts data access and persistence (currently LocalStorage + Mock DB,
 * cleanly prepared for 1:1 migration to Express REST endpoints).
 */

const STORAGE_KEYS = {
  CART: 'atelier_cart_v1',
  WISHLIST: 'atelier_wishlist_v1',
  ORDERS: 'atelier_orders_v1',
  PRODUCTS_OVERRIDE: 'atelier_products_custom_v1',
  PROMO: 'atelier_active_promo_v1'
};

const Store = {
  // --- Products & Catalog ---
  getProducts(filters = {}) {
    let customProducts = [];
    try {
      customProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS_OVERRIDE)) || [];
    } catch (e) {
      customProducts = [];
    }
    let list = [...APPAREL_PRODUCTS, ...customProducts];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
    }

    // Filter by department
    if (filters.department && filters.department !== 'all') {
      list = list.filter(p => p.department.toLowerCase() === filters.department.toLowerCase() || p.department === 'Unisex');
    }

    // Filter by size
    if (filters.size) {
      list = list.filter(p => p.sizes.some(s => s.size === filters.size && s.stock > 0));
    }

    // Filter by search query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }

    // Filter by max price
    if (filters.maxPrice) {
      list = list.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    // Filter by in-stock only
    if (filters.inStockOnly) {
      list = list.filter(p => p.sizes.some(s => s.stock > 0));
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
          // Keep current default order
          break;
      }
    }

    return list;
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

    const variant = product.sizes.find(s => s.sku === sku || s.size === size);
    if (!variant || variant.stock < quantity) {
      return { success: false, message: 'Requested size or stock unavailable' };
    }

    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.sku === sku);

    // Find image matching colorway if available
    const colorObj = product.colors.find(c => c.name === colorName);
    const itemImage = colorObj ? colorObj.image : product.images.primary;

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

    if (newQty > item.maxStock) {
      item.quantity = item.maxStock;
    } else {
      item.quantity = newQty;
    }

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
    
    // Free shipping threshold at $150
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

    // Flat estimated tax (8%)
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

  // --- Orders & Checkout ---
  createOrder(customerDetails, shippingMethod = 'standard') {
    const cart = this.getCart();
    if (cart.length === 0) return { success: false, message: 'Cart is empty' };

    const totals = this.getCartTotals();
    const orderNumber = 'ATN-' + Math.floor(100000 + Math.random() * 900000);
    
    const newOrder = {
      orderId: 'ord_' + Date.now(),
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      status: 'Processing', // Processing, Shipped, Delivered, Cancelled
      items: [...cart],
      customer: customerDetails,
      shippingMethod: shippingMethod,
      totals: totals,
      trackingNumber: 'TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    };

    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    } catch (e) {
      orders = [];
    }

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Clear cart after successful order
    this.clearCart();
    this.removePromo();

    return { success: true, order: newOrder };
  },

  getOrder(orderNumber) {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
      return orders.find(o => o.orderNumber === orderNumber || o.orderId === orderNumber) || null;
    } catch (e) {
      return null;
    }
  },

  getAllOrders() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
      // Provide some sample seeded orders if empty for admin preview
      if (stored.length === 0) {
        const sampleOrders = [
          {
            orderId: 'ord_sample_1',
            orderNumber: 'ATN-847291',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Shipped',
            customer: { firstName: 'Sarah', lastName: 'Vance', email: 'sarah.vance@example.com', city: 'New York' },
            totals: { total: 385.00, itemsCount: 1 },
            items: [{ title: 'Double-Breasted Cashmere-Wool Overcoat', size: 'M', colorName: 'Camel Tan', quantity: 1, price: 385.00 }]
          },
          {
            orderId: 'ord_sample_2',
            orderNumber: 'ATN-519344',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'Processing',
            customer: { firstName: 'Julian', lastName: 'Mercer', email: 'julian@example.com', city: 'London' },
            totals: { total: 290.00, itemsCount: 2 },
            items: [{ title: 'Heavyweight Loopback Fleece Hoodie (500 GSM)', size: 'L', colorName: 'Oatmeal Heather', quantity: 2, price: 145.00 }]
          }
        ];
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(sampleOrders));
        return sampleOrders;
      }
      return stored;
    } catch (e) {
      return [];
    }
  },

  updateOrderStatus(orderNumber, newStatus) {
    const orders = this.getAllOrders();
    const target = orders.find(o => o.orderNumber === orderNumber || o.orderId === orderNumber);
    if (target) {
      target.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return true;
    }
    return false;
  },

  // --- Admin Catalog Updates ---
  addCustomProduct(product) {
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS_OVERRIDE)) || [];
    } catch (e) {
      custom = [];
    }
    custom.unshift(product);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS_OVERRIDE, JSON.stringify(custom));
    return product;
  }
};

window.Store = Store;
