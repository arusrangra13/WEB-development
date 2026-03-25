// ===== CART MANAGEMENT =====
const CART_KEY = 'shopwave_cart';
const WISHLIST_KEY = 'shopwave_wishlist';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function getWishlist() {
  return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
}
function saveWishlist(wl) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wl));
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart(cart);
  showToast('✅ Added to cart!');
}

function removeFromCart(productId) {
  let cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    if (item.qty === 0) return removeFromCart(productId);
  }
  saveCart(cart);
}

function toggleWishlist(productId) {
  let wl = getWishlist();
  if (wl.includes(productId)) {
    wl = wl.filter(id => id !== productId);
  } else {
    wl.push(productId);
    showToast('❤️ Added to wishlist!');
  }
  saveWishlist(wl);
  return wl.includes(productId);
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

// ===== STAR RATING =====
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '★';
    else if (i === full && half) html += '½';
    else html += '☆';
  }
  return html;
}

// ===== DISCOUNT CALC =====
function calcDiscount(orig, curr) {
  return Math.round((1 - curr / orig) * 100);
}

// ===== FORMAT PRICE =====
function fmt(price) {
  return '$' + price.toFixed(2);
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2900);
}

// ===== INDEX PAGE LOGIC =====
function initIndexPage() {
  if (!document.getElementById('products-grid')) return;

  let filtered = [...products];
  let activeCategory = 'All';
  const wishlist = getWishlist();

  function renderProducts(list) {
    const grid = document.getElementById('products-grid');
    if (list.length === 0) {
      grid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><h3>No products found</h3><p>Try a different search or category.</p></div>`;
      return;
    }
    grid.innerHTML = list.map((p, idx) => {
      const disc = calcDiscount(p.originalPrice, p.price);
      const wl = getWishlist();
      const isWishlisted = wl.includes(p.id);
      const badgeClass = p.badge === 'Sale' ? 'badge-sale' : p.badge === 'New' ? 'badge-new' : 'badge-best';
      return `
        <div class="product-card" style="animation-delay:${idx * 0.05}s" onclick="viewProduct(${p.id})">
          <div class="product-img">
            <span>${p.emoji}</span>
            ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ''}
            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" id="wl-${p.id}" onclick="handleWishlist(event, ${p.id})">♥</button>
          </div>
          <div class="product-info">
            <div class="product-category">${p.category}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-rating">
              <span class="stars">${renderStars(p.rating)}</span>
              <span class="rating-num">${p.rating}</span>
              <span class="rating-count">(${p.reviews.toLocaleString()})</span>
            </div>
            <div class="product-price">
              <span class="price-current">${fmt(p.price)}</span>
              <span class="price-original">${fmt(p.originalPrice)}</span>
              <span class="price-discount">-${disc}%</span>
            </div>
            <div class="product-actions">
              <button class="btn-add-cart" id="cart-btn-${p.id}" onclick="handleAddCart(event, ${p.id})">🛒 Add to Cart</button>
              <button class="btn-view" title="View Details" onclick="viewProduct(${p.id})">👁</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function applyFilters() {
    const search = document.getElementById('search-input')?.value?.toLowerCase() || '';
    const sort = document.getElementById('sort-select')?.value || 'default';
    filtered = products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') filtered.sort((a, b) => b.reviews - a.reviews);
    renderProducts(filtered);
  }

  // Category filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      applyFilters();
    });
  });

  document.getElementById('search-input')?.addEventListener('input', applyFilters);
  document.getElementById('sort-select')?.addEventListener('change', applyFilters);

  renderProducts(products);
  updateCartBadge();
}

window.handleAddCart = function(e, id) {
  e.stopPropagation();
  addToCart(id);
  const btn = document.getElementById(`cart-btn-${id}`);
  if (btn) {
    btn.textContent = '✓ Added!';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = '🛒 Add to Cart'; btn.classList.remove('added'); }, 1500);
  }
};

window.handleWishlist = function(e, id) {
  e.stopPropagation();
  const isNow = toggleWishlist(id);
  const btn = document.getElementById(`wl-${id}`);
  if (btn) btn.classList.toggle('active', isNow);
};

window.viewProduct = function(id) {
  window.location.href = `product-detail.html?id=${id}`;
};

// ===== CART PAGE LOGIC =====
function initCartPage() {
  if (!document.getElementById('cart-items-container')) return;
  renderCart();
  updateCartBadge();
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items-container');
  const summarySection = document.getElementById('order-summary');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.</p>
        <a href="index.html" class="btn-primary">🛍 Start Shopping</a>
      </div>`;
    if (summarySection) summarySection.style.display = 'none';
    return;
  }
  if (summarySection) summarySection.style.display = 'block';

  let subtotal = 0;
  let originalTotal = 0;

  container.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return '';
    subtotal += p.price * item.qty;
    originalTotal += p.originalPrice * item.qty;
    return `
      <div class="cart-item" id="ci-${p.id}">
        <div class="cart-item-emoji">${p.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-cat">${p.category}</div>
          <div class="cart-item-price">${fmt(p.price * item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
          <button class="remove-btn" onclick="removeItem(${p.id})" title="Remove">🗑</button>
        </div>
      </div>`;
  }).join('');

  const shipping = subtotal >= 100 ? 0 : 9.99;
  const discount = originalTotal - subtotal;
  const total = subtotal + shipping;

  document.getElementById('summary-subtotal').textContent = fmt(subtotal);
  document.getElementById('summary-discount').textContent = `-${fmt(discount)}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : fmt(shipping);
  document.getElementById('summary-total').textContent = fmt(total);
}

window.changeQty = function(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
};

window.removeItem = function(id) {
  removeFromCart(id);
  renderCart();
  showToast('🗑 Item removed', 'error');
};

window.applyPromo = function() {
  const code = document.getElementById('promo-input')?.value?.trim().toUpperCase();
  if (code === 'SAVE10' || code === 'SHOPWAVE') {
    showToast('🎉 Promo code applied! Extra 10% off');
  } else {
    showToast('❌ Invalid promo code', 'error');
  }
};

window.checkout = function() {
  showToast('🎉 Order placed successfully! (Demo)');
  setTimeout(() => {
    localStorage.removeItem(CART_KEY);
    renderCart();
    updateCartBadge();
  }, 1500);
};

// ===== PRODUCT DETAIL PAGE LOGIC =====
function initDetailPage() {
  const detail = document.getElementById('product-detail-content');
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const p = products.find(x => x.id === id);

  if (!p) {
    detail.innerHTML = '<div style="text-align:center;padding:4rem"><h2>Product not found</h2><a href="index.html" class="btn-primary">← Back</a></div>';
    return;
  }

  const disc = calcDiscount(p.originalPrice, p.price);
  const wl = getWishlist();
  const isWL = wl.includes(p.id);
  const badgeClass = p.badge === 'Sale' ? 'badge-sale' : p.badge === 'New' ? 'badge-new' : 'badge-best';

  detail.innerHTML = `
    <div class="detail-layout">
      <div class="detail-img-section">
        <a href="index.html" class="back-btn">← Back to Products</a>
        <div class="detail-img-main">${p.emoji}</div>
      </div>
      <div class="detail-info">
        <div class="detail-badges">
          ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ''}
          <span class="product-badge" style="background:rgba(108,71,255,0.15);color:var(--primary-light);border:1px solid rgba(108,71,255,0.3)">${p.category}</span>
        </div>
        <h1 class="detail-name">${p.name}</h1>
        <div class="detail-rating">
          <span class="stars" style="font-size:1rem">${renderStars(p.rating)}</span>
          <span class="rating-num" style="font-size:0.95rem;font-weight:700">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()} reviews)</span>
        </div>
        <div class="detail-price">
          <span class="price-current">${fmt(p.price)}</span>
          <span class="price-original">${fmt(p.originalPrice)}</span>
          <span class="price-discount">-${disc}%</span>
        </div>
        <p class="detail-desc">${p.description}</p>
        <div class="features-list">
          ${p.features.map(f => `<div class="feature-item"><span class="feature-check">✓</span>${f}</div>`).join('')}
        </div>
        <div class="color-section">
          <h4>Available Colors</h4>
          <div class="color-options">
            ${p.colors.map((c, i) => `<button class="color-opt ${i === 0 ? 'active' : ''}" onclick="selectColor(this)">${c}</button>`).join('')}
          </div>
        </div>
        <div class="stock-info">✅ In Stock (${p.stock} units available)</div>
        <div class="detail-actions">
          <button class="btn-add-cart-lg" id="detail-cart-btn" onclick="handleDetailCart(${p.id})">🛒 Add to Cart</button>
          <button class="btn-wishlist-lg ${isWL ? 'active' : ''}" id="detail-wl-btn" onclick="handleDetailWL(${p.id})">♥</button>
        </div>
      </div>
    </div>`;

  updateCartBadge();
}

window.selectColor = function(el) {
  el.closest('.color-options').querySelectorAll('.color-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
};

window.handleDetailCart = function(id) {
  addToCart(id);
  const btn = document.getElementById('detail-cart-btn');
  if (btn) {
    btn.textContent = '✓ Added to Cart!';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = '🛒 Add to Cart'; btn.classList.remove('added'); }, 1800);
  }
};

window.handleDetailWL = function(id) {
  const isNow = toggleWishlist(id);
  const btn = document.getElementById('detail-wl-btn');
  if (btn) btn.classList.toggle('active', isNow);
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initIndexPage();
  initCartPage();
  initDetailPage();
  updateCartBadge();
});
