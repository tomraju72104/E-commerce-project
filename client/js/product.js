/**
 * ATELIER NOIR - Product Detail Page Controller
 * Handles image carousels, dynamic colorway switching, size matrix selection,
 * real-time inventory threshold badges, and add-to-bag operations.
 */

let currentProduct = null;
let selectedColor = null;
let selectedSizeObj = null;
let currentQuantity = 1;

function initPDP() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  currentProduct = Store.getProductBySlug(slug) || Store.getProducts({})[0];
  if (!currentProduct) {
    window.location.href = 'shop.html';
    return;
  }

  // Update Page Title
  document.title = `${currentProduct.title} | ATELIER NOIR`;

  // Update Breadcrumb & Header Info
  document.getElementById('pdpBreadcrumbTitle').textContent = currentProduct.title;
  document.getElementById('pdpCategory').textContent = `${currentProduct.department} • ${currentProduct.categoryName}`;
  document.getElementById('pdpTitle').textContent = currentProduct.title;
  document.getElementById('pdpDescription').textContent = currentProduct.description;
  document.getElementById('pdpFabricText').textContent = currentProduct.fabricDetails || 'Premium sustainable fibers.';
  document.getElementById('pdpCareText').textContent = currentProduct.careGuide || 'Professional garment care recommended.';

  // Pricing
  document.getElementById('pdpPrice').textContent = formatMoney(currentProduct.price);
  const compareEl = document.getElementById('pdpComparePrice');
  const saveBadge = document.getElementById('pdpSaveBadge');
  if (currentProduct.compareAtPrice && currentProduct.compareAtPrice > currentProduct.price) {
    compareEl.textContent = formatMoney(currentProduct.compareAtPrice);
    const saveAmt = currentProduct.compareAtPrice - currentProduct.price;
    saveBadge.textContent = `Save ${formatMoney(saveAmt)}`;
    saveBadge.style.display = 'inline-block';
  } else {
    compareEl.textContent = '';
    saveBadge.style.display = 'none';
  }

  // Badges
  const badgeContainer = document.getElementById('pdpBadgeContainer');
  if (currentProduct.badge && badgeContainer) {
    const bType = currentProduct.badgeType || 'new';
    const bClass = { 'new': 'badge-new', 'sale': 'badge-sale', 'low-stock': 'badge-low-stock', 'eco': 'badge-eco' }[bType] || 'badge-new';
    badgeContainer.innerHTML = `<span class="badge-atelier ${bClass}">${currentProduct.badge}</span>`;
  }

  // Gallery Setup
  setupGallery();

  // Colors & Swatches
  setupColorways();

  // Size Matrix
  setupSizeMatrix();

  // Quantity Stepper
  setupQuantityStepper();

  // Add to Cart
  setupAddToCart();

  // Wishlist Button state
  updateWishlistButton();
}

function setupGallery() {
  const mainImg = document.getElementById('pdpMainImage');
  const thumbList = document.getElementById('pdpThumbnails');
  if (!mainImg || !thumbList) return;

  const galleryImages = currentProduct.images.gallery || [currentProduct.images.primary];
  mainImg.src = galleryImages[0];

  thumbList.innerHTML = galleryImages.map((imgSrc, idx) => `
    <img src="${imgSrc}" 
         alt="${currentProduct.title} view ${idx + 1}" 
         class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" 
         onclick="switchMainGalleryImage('${imgSrc}', this)">
  `).join('');
}

function switchMainGalleryImage(src, thumbEl) {
  const mainImg = document.getElementById('pdpMainImage');
  if (mainImg) mainImg.src = src;

  document.querySelectorAll('.pdp-thumb-item').forEach(el => el.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function setupColorways() {
  const swatchesContainer = document.getElementById('pdpColorSwatches');
  const colorNameLabel = document.getElementById('pdpActiveColorName');
  if (!swatchesContainer) return;

  const colors = currentProduct.colors || [{ name: 'Standard', hex: '#111215', image: currentProduct.images.primary }];
  selectedColor = colors[0];
  if (colorNameLabel) colorNameLabel.textContent = selectedColor.name;

  swatchesContainer.innerHTML = colors.map((col, idx) => `
    <span class="swatch-pill ${idx === 0 ? 'active' : ''}" 
          style="background-color: ${col.hex}; width: 28px; height: 28px;" 
          title="${col.name}" 
          onclick="selectColorway(${idx}, this)">
    </span>
  `).join('');
}

function selectColorway(idx, swatchEl) {
  const colors = currentProduct.colors || [];
  if (!colors[idx]) return;

  selectedColor = colors[idx];
  document.getElementById('pdpActiveColorName').textContent = selectedColor.name;

  document.querySelectorAll('#pdpColorSwatches .swatch-pill').forEach(el => el.classList.remove('active'));
  if (swatchEl) swatchEl.classList.add('active');

  // Update main gallery image to colorway photo if available
  if (selectedColor.image) {
    const mainImg = document.getElementById('pdpMainImage');
    if (mainImg) mainImg.src = selectedColor.image;
  }
}

function setupSizeMatrix() {
  const container = document.getElementById('pdpSizeButtons');
  if (!container) return;

  const sizes = currentProduct.sizes || [];
  
  // Pick first available in-stock size as default
  selectedSizeObj = sizes.find(s => s.stock > 0) || sizes[0];

  container.innerHTML = sizes.map(sizeObj => {
    const isOut = sizeObj.stock <= 0;
    const isSelected = selectedSizeObj && selectedSizeObj.sku === sizeObj.sku;

    return `
      <button type="button" 
              class="size-btn px-3 py-2 ${isSelected ? 'active' : ''} ${isOut ? 'disabled' : ''}" 
              ${isOut ? 'disabled' : ''}
              onclick="selectSize('${sizeObj.sku}', this)">
        ${sizeObj.size}
      </button>
    `;
  }).join('');

  updateStockAlert();
}

function selectSize(sku, btnEl) {
  const sizeObj = (currentProduct.sizes || []).find(s => s.sku === sku);
  if (!sizeObj || sizeObj.stock <= 0) return;

  selectedSizeObj = sizeObj;
  document.querySelectorAll('#pdpSizeButtons .size-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  // Reset quantity if current is greater than stock
  currentQuantity = 1;
  document.getElementById('pdpQtyInput').value = 1;

  updateStockAlert();
}

function updateStockAlert() {
  const alertContainer = document.getElementById('pdpStockAlertContainer');
  if (!alertContainer || !selectedSizeObj) return;

  if (selectedSizeObj.stock <= 0) {
    alertContainer.innerHTML = `<span class="pdp-stock-alert urgent"><i class="bi bi-x-circle-fill"></i> Currently Out of Stock in this size</span>`;
    document.getElementById('pdpAddToCartBtn').disabled = true;
  } else if (selectedSizeObj.stock <= 3) {
    alertContainer.innerHTML = `<span class="pdp-stock-alert urgent"><i class="bi bi-exclamation-triangle-fill"></i> High Demand: Only ${selectedSizeObj.stock} units remaining in Size ${selectedSizeObj.size}!</span>`;
    document.getElementById('pdpAddToCartBtn').disabled = false;
  } else {
    alertContainer.innerHTML = `<span class="pdp-stock-alert available"><i class="bi bi-check-circle-fill"></i> In Stock & Ready for Immediate Dispatch</span>`;
    document.getElementById('pdpAddToCartBtn').disabled = false;
  }
}

function setupQuantityStepper() {
  const minus = document.getElementById('qtyMinusBtn');
  const plus = document.getElementById('qtyPlusBtn');
  const input = document.getElementById('pdpQtyInput');

  if (!minus || !plus || !input) return;

  minus.addEventListener('click', () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      input.value = currentQuantity;
    }
  });

  plus.addEventListener('click', () => {
    const max = selectedSizeObj ? selectedSizeObj.stock : 10;
    if (currentQuantity < max) {
      currentQuantity++;
      input.value = currentQuantity;
    } else {
      showToast(`Maximum ${max} units available in stock.`, 'warning');
    }
  });
}

function setupAddToCart() {
  const addBtn = document.getElementById('pdpAddToCartBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    if (!selectedSizeObj) {
      showToast('Please select a size first.', 'warning');
      return;
    }

    const result = Store.addToCart(
      currentProduct.id,
      selectedSizeObj.sku,
      selectedSizeObj.size,
      selectedColor ? selectedColor.name : 'Standard',
      selectedColor ? selectedColor.hex : '#111215',
      currentQuantity
    );

    if (result.success) {
      showToast(result.message);
      
      // Open the Offcanvas Mini-Cart drawer to show added item
      const offcanvasEl = document.getElementById('cartOffcanvas');
      if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
        bsOffcanvas.show();
      }
    } else {
      showToast(result.message, 'warning');
    }
  });

  // Wishlist Toggle
  const wishlistBtn = document.getElementById('pdpWishlistToggleBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const added = Store.toggleWishlist(currentProduct.id);
      updateWishlistButton();
      if (added) {
        showToast('Saved to your wishlist');
      } else {
        showToast('Removed from wishlist');
      }
    });
  }
}

function updateWishlistButton() {
  const btn = document.getElementById('pdpWishlistToggleBtn');
  if (!btn || !currentProduct) return;
  const inList = Store.isInWishlist(currentProduct.id);
  if (inList) {
    btn.innerHTML = `<i class="bi bi-heart-fill text-danger me-1"></i> Saved to Wishlist`;
    btn.classList.add('border-danger');
  } else {
    btn.innerHTML = `<i class="bi bi-heart me-1"></i> Add to Saved Wishlist`;
    btn.classList.remove('border-danger');
  }
}

window.switchMainGalleryImage = switchMainGalleryImage;
window.selectColorway = selectColorway;
window.selectSize = selectSize;

document.addEventListener('DOMContentLoaded', initPDP);
