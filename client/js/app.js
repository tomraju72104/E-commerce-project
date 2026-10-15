/**
 * ATELIER NOIR - Global Application & UI Controller
 * Manages Navigation, Cart Offcanvas Drawer, Toasts, Search Modal & Global Utilities.
 */

// Utility: Currency Formatter
function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

// Global Toast Notification Helper
function showToast(message, type = 'dark') {
  let container = document.getElementById('atelierToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'atelierToastContainer';
    container.className = 'atelier-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `atelier-toast toast-${type}`;
  toast.innerHTML = `
    <i class="bi bi-check2-circle fs-5 text-warning"></i>
    <div class="flex-grow-1">${message}</div>
    <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Close"></button>
  `;

  toast.querySelector('.btn-close').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Renders an individual product card (used across Home, Shop, Recommendations)
function renderProductCardHTML(product) {
  const isWishlisted = Store.isInWishlist(product.id);
  const oldPriceHTML = product.compareAtPrice 
    ? `<span class="product-old-price">${formatMoney(product.compareAtPrice)}</span>` 
    : '';

  const badgeClass = {
    'new': 'badge-new',
    'sale': 'badge-sale',
    'low-stock': 'badge-low-stock',
    'eco': 'badge-eco'
  }[product.badgeType] || 'badge-new';

  const swatchesHTML = (product.colors || []).map((col, idx) => `
    <span class="swatch-pill ${idx === 0 ? 'active' : ''}" 
          style="background-color: ${col.hex};" 
          title="${col.name}"
          data-image="${col.image}"
          onclick="event.preventDefault(); switchCardImage(this, '${col.image}')">
    </span>
  `).join('');

  return `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-card-media">
          <div class="product-badge-stack">
            ${product.badge ? `<span class="badge-atelier ${badgeClass}">${product.badge}</span>` : ''}
          </div>
          <button class="product-quick-wishlist ${isWishlisted ? 'active' : ''}" 
                  onclick="handleWishlistClick(event, '${product.id}')" 
                  aria-label="Save to Wishlist">
            <i class="bi ${isWishlisted ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
          </button>
          <a href="product.html?slug=${product.slug}">
            <img src="${product.images.primary}" alt="${product.title}" class="product-card-img primary-img" loading="lazy">
            <img src="${product.images.hover || product.images.primary}" alt="${product.title}" class="product-card-img hover-img" loading="lazy">
          </a>
        </div>
        <div class="product-card-body">
          <div class="product-category-sub">${product.categoryName}</div>
          <a href="product.html?slug=${product.slug}" class="product-card-title text-truncate-2">
            ${product.title}
          </a>
          <div class="product-color-swatches">
            ${swatchesHTML}
          </div>
          <div class="product-price-row">
            <span class="product-current-price">${formatMoney(product.price)}</span>
            ${oldPriceHTML}
            <div class="ms-auto text-muted small">
              <i class="bi bi-star-fill text-warning"></i> ${product.rating}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Swatch preview click on card
function switchCardImage(swatchEl, imageSrc) {
  const card = swatchEl.closest('.product-card');
  if (!card) return;
  card.querySelectorAll('.swatch-pill').forEach(el => el.classList.remove('active'));
  swatchEl.classList.add('active');
  const primaryImg = card.querySelector('.primary-img');
  if (primaryImg) {
    primaryImg.src = imageSrc;
  }
}

// Wishlist click handler
function handleWishlistClick(e, productId) {
  e.preventDefault();
  e.stopPropagation();
  const added = Store.toggleWishlist(productId);
  const btn = e.currentTarget;
  const icon = btn.querySelector('i');
  
  if (added) {
    btn.classList.add('active');
    icon.className = 'bi bi-heart-fill text-danger';
    showToast('Saved to your wishlist');
  } else {
    btn.classList.remove('active');
    icon.className = 'bi bi-heart';
    showToast('Removed from wishlist');
  }
}

// Mini-Cart Drawer Rendering
function updateMiniCartUI() {
  const cart = Store.getCart();
  const totals = Store.getCartTotals();
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const wishlistCountBadges = document.querySelectorAll('.wishlist-count-badge');
  const cartItemsContainer = document.getElementById('cartDrawerItems');
  const cartSubtotalEl = document.getElementById('cartDrawerSubtotal');
  const cartShippingBar = document.getElementById('cartShippingProgressBar');
  const cartShippingMsg = document.getElementById('cartShippingMsg');

  // Update badge counters
  const totalCount = Store.getCartCount();
  cartCountBadges.forEach(b => {
    b.textContent = totalCount;
    b.style.display = totalCount > 0 ? 'flex' : 'none';
  });

  const wishlistCount = Store.getWishlist().length;
  wishlistCountBadges.forEach(b => {
    b.textContent = wishlistCount;
    b.style.display = wishlistCount > 0 ? 'flex' : 'none';
  });

  if (!cartItemsContainer) return;

  // Render Shipping Progress
  if (cartShippingBar && cartShippingMsg) {
    cartShippingBar.style.width = `${totals.progressToFreeShipping}%`;
    if (totals.amountNeededForFreeShipping === 0) {
      cartShippingMsg.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> You unlocked complimentary standard shipping!</span>';
    } else {
      cartShippingMsg.innerHTML = `Add <strong>${formatMoney(totals.amountNeededForFreeShipping)}</strong> more to enjoy Free Shipping`;
    }
  }

  // Render Cart Items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-bag-x text-muted" style="font-size: 3.5rem;"></i>
        <h5 class="mt-3 font-heading">Your bag is empty</h5>
        <p class="text-muted small">Discover our newest luxury arrivals and timeless wardrobe staples.</p>
        <a href="shop.html" class="btn btn-atelier-dark btn-sm mt-2">Explore Catalog</a>
      </div>
    `;
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(0);
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item-row" data-sku="${item.sku}">
      <img src="${item.image}" alt="${item.title}" class="cart-item-thumb">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="mb-1 font-heading small fw-bold">${item.title}</h6>
          <button class="btn btn-link text-muted p-0 ms-2" onclick="Store.removeFromCart('${item.sku}')" title="Remove">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
        <div class="text-muted small mb-2">
          <span>Size: <strong>${item.size}</strong></span> | 
          <span>Color: <strong>${item.colorName}</strong></span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <div class="cart-qty-control">
            <button class="cart-qty-btn" onclick="Store.updateCartQty('${item.sku}', ${item.quantity - 1})">-</button>
            <span class="cart-qty-value">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="Store.updateCartQty('${item.sku}', ${item.quantity + 1})">+</button>
          </div>
          <span class="fw-bold">${formatMoney(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  `).join('');

  if (cartSubtotalEl) {
    cartSubtotalEl.textContent = formatMoney(totals.subtotal);
  }
}

// Injects the common Header, Footer, and Cart Offcanvas HTML dynamically if placeholders exist
function initLayout() {
  // Listen for storage events
  window.addEventListener('cart:updated', () => updateMiniCartUI());
  window.addEventListener('wishlist:updated', () => updateMiniCartUI());

  // Search form handler
  const globalSearchForm = document.getElementById('globalSearchForm');
  if (globalSearchForm) {
    globalSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('globalSearchInput').value.trim();
      if (q) {
        window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
      }
    });
  }

  updateMiniCartUI();
}

document.addEventListener('DOMContentLoaded', initLayout);
