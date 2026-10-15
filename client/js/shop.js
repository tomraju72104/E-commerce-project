/**
 * ATELIER NOIR - Catalog & Faceted Search Page Controller
 */

let currentFilters = {
  category: 'all',
  size: null,
  maxPrice: 600,
  inStockOnly: true,
  sort: 'newest',
  search: '',
  wishlistOnly: false
};

function initShop() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('category')) {
    currentFilters.category = urlParams.get('category');
  }
  if (urlParams.has('search')) {
    currentFilters.search = urlParams.get('search');
    const input = document.getElementById('globalSearchInput');
    if (input) input.value = currentFilters.search;
  }
  if (urlParams.has('wishlist')) {
    currentFilters.wishlistOnly = true;
  }

  // Populate categories list
  renderCategoriesFilter();

  // Attach event listeners
  setupFilterEvents();

  // Run initial render
  applyFiltersAndRender();
}

function renderCategoriesFilter() {
  const listContainer = document.getElementById('categoryFilterList');
  if (!listContainer) return;

  const categories = Store.getCategories();
  const allProducts = Store.getProducts({});
  
  const countAll = document.getElementById('countAll');
  if (countAll) countAll.textContent = allProducts.length;

  const html = categories.map(cat => {
    const count = allProducts.filter(p => p.category.toLowerCase() === cat.slug.toLowerCase()).length;
    const isActive = currentFilters.category === cat.slug;
    return `
      <a href="#" class="list-group-item list-group-item-action border-0 px-0 py-1 d-flex justify-content-between ${isActive ? 'fw-bold text-dark' : 'text-muted'}" data-category="${cat.slug}">
        <span>${cat.name}</span>
        <span class="badge bg-light text-dark rounded-pill">${count}</span>
      </a>
    `;
  }).join('');

  listContainer.innerHTML = `
    <a href="#" class="list-group-item list-group-item-action border-0 px-0 py-1 d-flex justify-content-between ${currentFilters.category === 'all' ? 'fw-bold text-dark' : 'text-muted'}" data-category="all">
      <span>All Categories</span>
      <span class="badge bg-light text-dark rounded-pill">${allProducts.length}</span>
    </a>
    ${html}
  `;

  // Attach click events
  listContainer.querySelectorAll('a[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.category = link.getAttribute('data-category');
      currentFilters.wishlistOnly = false;
      renderCategoriesFilter();
      applyFiltersAndRender();
    });
  });
}

function setupFilterEvents() {
  // Size buttons
  const sizeGrid = document.getElementById('sizeFilterGrid');
  if (sizeGrid) {
    sizeGrid.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size');
        if (currentFilters.size === size) {
          currentFilters.size = null;
          btn.classList.remove('active');
        } else {
          sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          currentFilters.size = size;
          btn.classList.add('active');
        }
        applyFiltersAndRender();
      });
    });
  }

  // Price range slider
  const priceInput = document.getElementById('priceRangeInput');
  const priceLabel = document.getElementById('priceValueLabel');
  if (priceInput && priceLabel) {
    priceInput.addEventListener('input', (e) => {
      const val = e.target.value;
      priceLabel.textContent = `$${val}`;
      currentFilters.maxPrice = parseFloat(val);
      applyFiltersAndRender();
    });
  }

  // In-Stock toggle
  const inStockToggle = document.getElementById('inStockToggle');
  if (inStockToggle) {
    inStockToggle.addEventListener('change', (e) => {
      currentFilters.inStockOnly = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Reset Button
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

function resetAllFilters() {
  currentFilters = {
    category: 'all',
    size: null,
    maxPrice: 600,
    inStockOnly: false,
    sort: 'newest',
    search: '',
    wishlistOnly: false
  };

  const priceInput = document.getElementById('priceRangeInput');
  if (priceInput) priceInput.value = 600;
  const priceLabel = document.getElementById('priceValueLabel');
  if (priceLabel) priceLabel.textContent = '$600';

  const inStockToggle = document.getElementById('inStockToggle');
  if (inStockToggle) inStockToggle.checked = false;

  const sizeGrid = document.getElementById('sizeFilterGrid');
  if (sizeGrid) sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));

  renderCategoriesFilter();
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let products = Store.getProducts(currentFilters);

  // If in wishlist view
  if (currentFilters.wishlistOnly) {
    const savedIds = Store.getWishlist();
    products = products.filter(p => savedIds.includes(p.id));
    const title = document.getElementById('catalogTitle');
    if (title) title.textContent = 'Your Saved Wishlist';
  } else if (currentFilters.search) {
    const title = document.getElementById('catalogTitle');
    if (title) title.textContent = `Search Results: "${currentFilters.search}"`;
  } else if (currentFilters.category !== 'all') {
    const cat = Store.getCategories().find(c => c.slug === currentFilters.category);
    const title = document.getElementById('catalogTitle');
    if (title) title.textContent = cat ? cat.name : 'Category Collection';
  } else {
    const title = document.getElementById('catalogTitle');
    if (title) title.textContent = 'All Garments & Silhouettes';
  }

  // Update Count
  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = products.length;

  // Render Active Chips
  renderFilterChips();

  // Render Grid or Empty state
  const grid = document.getElementById('shopProductsGrid');
  const empty = document.getElementById('shopEmptyState');

  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('d-none');
  } else {
    if (empty) empty.classList.add('d-none');
    grid.innerHTML = products.map(renderProductCardHTML).join('');
  }
}

function renderFilterChips() {
  const container = document.getElementById('activeFilterChips');
  if (!container) return;

  let chips = [];

  if (currentFilters.category !== 'all') {
    chips.push(`<span class="badge bg-dark py-2 px-3">Category: ${currentFilters.category} <i class="bi bi-x-circle ms-1 cursor-pointer" onclick="removeChip('category')"></i></span>`);
  }
  if (currentFilters.size) {
    chips.push(`<span class="badge bg-dark py-2 px-3">Size: ${currentFilters.size} <i class="bi bi-x-circle ms-1 cursor-pointer" onclick="removeChip('size')"></i></span>`);
  }
  if (currentFilters.search) {
    chips.push(`<span class="badge bg-dark py-2 px-3">"${currentFilters.search}" <i class="bi bi-x-circle ms-1 cursor-pointer" onclick="removeChip('search')"></i></span>`);
  }
  if (currentFilters.wishlistOnly) {
    chips.push(`<span class="badge bg-danger py-2 px-3">Wishlist Only <i class="bi bi-x-circle ms-1 cursor-pointer" onclick="removeChip('wishlist')"></i></span>`);
  }
  if (currentFilters.maxPrice < 600) {
    chips.push(`<span class="badge bg-dark py-2 px-3">Under $${currentFilters.maxPrice} <i class="bi bi-x-circle ms-1 cursor-pointer" onclick="removeChip('price')"></i></span>`);
  }

  if (chips.length === 0) {
    container.innerHTML = '<span class="small text-muted">Filter: All Garments</span>';
  } else {
    container.innerHTML = `<span class="small text-muted me-1">Active:</span> ` + chips.join(' ');
  }
}

function removeChip(type) {
  if (type === 'category') currentFilters.category = 'all';
  if (type === 'size') {
    currentFilters.size = null;
    const sizeGrid = document.getElementById('sizeFilterGrid');
    if (sizeGrid) sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  }
  if (type === 'search') currentFilters.search = '';
  if (type === 'wishlist') currentFilters.wishlistOnly = false;
  if (type === 'price') {
    currentFilters.maxPrice = 600;
    const priceInput = document.getElementById('priceRangeInput');
    if (priceInput) priceInput.value = 600;
  }
  renderCategoriesFilter();
  applyFiltersAndRender();
}

window.resetAllFilters = resetAllFilters;
window.removeChip = removeChip;

document.addEventListener('DOMContentLoaded', initShop);
