/* ============================================
   main.js — Product loading & page rendering
   ============================================ */

let JJ_PRODUCTS = [];

async function jjLoadProducts() {
  if (JJ_PRODUCTS.length > 0) return JJ_PRODUCTS;
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    JJ_PRODUCTS = await res.json();
  } catch (e) {
    console.error('Failed to load products:', e);
    JJ_PRODUCTS = [];
  }
  return JJ_PRODUCTS;
}

function jjFormatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

function jjEscapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function jjGetProductUrl(p) {
  return 'product.html?slug=' + encodeURIComponent(p.slug);
}

function jjRenderCard(p) {
  const lang = jjGetLang();
  const desc = (lang === 'es' && p.description_es) ? p.description_es : (p.description || '');
  return `
    <article class="jj-card">
      <a href="${jjGetProductUrl(p)}" class="jj-card__img">
        <img src="${jjEscapeHtml(p.image)}" alt="${jjEscapeHtml(p.name)}" loading="lazy" />
      </a>
      <div class="jj-card__body">
        <div class="jj-card__cat" data-cat="${jjEscapeHtml(p.category)}">${jjEscapeHtml(p.category)}</div>
        <h3 class="jj-card__title"><a href="${jjGetProductUrl(p)}">${jjEscapeHtml(p.name)}</a></h3>
        <p class="jj-card__desc">${jjEscapeHtml(desc)}</p>
        <div class="jj-card__footer">
          <span class="jj-card__price">${jjFormatPrice(p.price)}</span>
          <a href="${jjGetProductUrl(p)}" class="jj-btn jj-btn--ghost jj-btn--sm" data-i18n="shop.viewDetail">View details</a>
        </div>
      </div>
    </article>
  `;
}

// =====================
// HOME PAGE
// =====================
async function jjRenderHomeFeatured() {
  const container = document.getElementById('jjFeaturedGrid');
  if (!container) return;
  container.innerHTML = '<div class="jj-loading"><div class="jj-spinner"></div></div>';

  const products = await jjLoadProducts();
  // Tomar 6 productos destacados: 3 jumpers + 2 tables + 1 concession
  const featured = [
    ...products.filter(p => p.category === 'jumpers').slice(0, 3),
    ...products.filter(p => p.category === 'tables-chairs').slice(0, 2),
    ...products.filter(p => p.category === 'concessions').slice(0, 1),
  ].slice(0, 6);

  container.innerHTML = featured.map(jjRenderCard).join('');
  // Reapply i18n so category labels update
  jjApplyI18N(jjGetLang());
  // Trigger animations
  if (window.jjAnimateGrid) window.jjAnimateGrid(container);
}

// =====================
// SHOP PAGE
// =====================
async function jjRenderShop() {
  const container = document.getElementById('jjShopGrid');
  const pills = document.getElementById('jjCategoryPills');
  if (!container) return;

  const products = await jjLoadProducts();

  // Render filter pills (once)
  if (pills && !pills.dataset.ready) {
    const lang = jjGetLang();
    const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;
    const cats = [
      { id: 'all', key: 'shop.filter.all' },
      { id: 'jumpers', key: 'shop.filter.jumpers' },
      { id: 'tables-chairs', key: 'shop.filter.tables' },
      { id: 'concessions', key: 'shop.filter.concessions' },
    ];
    pills.innerHTML = cats.map(c =>
      `<button class="jj-cat-pill${c.id === 'all' ? ' is-active' : ''}" data-filter="${c.id}">${dict[c.key]}</button>`
    ).join('');
    pills.dataset.ready = '1';

    pills.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      pills.querySelectorAll('.jj-cat-pill').forEach(b => b.classList.toggle('is-active', b === btn));
      jjRenderShopList(products, btn.getAttribute('data-filter'));
    });

    // Re-render pill labels on language change
    document.addEventListener('jj:lang-changed', () => {
      const newDict = window.JJ_I18N[jjGetLang()] || window.JJ_I18N.en;
      pills.querySelectorAll('[data-filter]').forEach(btn => {
        const cat = btn.getAttribute('data-filter');
        const key = 'shop.filter.' + (cat === 'all' ? 'all' :
          cat === 'jumpers' ? 'jumpers' :
          cat === 'tables-chairs' ? 'tables' : 'concessions');
        if (newDict[key]) btn.textContent = newDict[key];
      });
    });
  }

  jjRenderShopList(products, 'all');
}

function jjRenderShopList(products, filter) {
  const container = document.getElementById('jjShopGrid');
  if (!container) return;
  const lang = jjGetLang();
  const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;

  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="jj-loading">${dict['shop.empty']}</div>`;
    return;
  }

  container.innerHTML = filtered.map(jjRenderCard).join('');
  jjApplyI18N(lang);
  // Trigger animations
  if (window.jjAnimateGrid) window.jjAnimateGrid(container);
}

// =====================
// PRODUCT DETAIL PAGE
// =====================
async function jjRenderProductDetail() {
  const container = document.getElementById('jjProductDetail');
  if (!container) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) {
    container.innerHTML = '<div class="jj-loading">Product not found. <a href="shop.html">Back to catalog</a></div>';
    return;
  }

  const products = await jjLoadProducts();
  const product = products.find(p => p.slug === slug);

  if (!product) {
    container.innerHTML = '<div class="jj-loading">Product not found. <a href="shop.html">Back to catalog</a></div>';
    return;
  }

  const lang = jjGetLang();
  const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;

  document.title = `${product.name} — Jumpy Jumper`;

  container.innerHTML = `
    <div class="jj-detail__img">
      <img src="${jjEscapeHtml(product.image)}" alt="${jjEscapeHtml(product.name)}" />
    </div>
    <div class="jj-detail__body">
      <a href="shop.html" style="color: var(--jj-text-muted); font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.3rem; margin-bottom: 1rem;">← <span data-i18n="${lang === 'es' ? 'nav.shop' : 'nav.shop'}">${dict['nav.shop']}</span></a>
      <div class="jj-card__cat" data-cat="${jjEscapeHtml(product.category)}">${jjEscapeHtml(product.category)}</div>
      <h1>${jjEscapeHtml(product.name)}</h1>
      <div class="jj-detail__price">${jjFormatPrice(product.price)}</div>

      <p class="jj-detail__desc" id="jjDetailDesc">${jjEscapeHtml(product.description || '')}</p>

      <div class="jj-detail__actions">
        <div class="jj-qty">
          <button onclick="jjDetailQty(-1)" aria-label="Decrease">−</button>
          <input type="number" id="jjDetailQty" value="1" min="1" max="99" />
          <button onclick="jjDetailQty(1)" aria-label="Increase">+</button>
        </div>
        <button class="jj-btn jj-btn--primary" onclick="jjDetailAddToCart()">
          <span>🛒</span>
          <span data-i18n="product.addToCart">${dict['product.addToCart']}</span>
        </button>
      </div>

      <div class="jj-detail__meta">
        <div><strong>✓</strong> <span data-i18n="product.specs.delivery">${dict['product.specs.delivery']}</span></div>
        <div><strong>✓</strong> <span data-i18n="product.specs.setup">${dict['product.specs.setup']}</span></div>
        <div><strong>✓</strong> <span data-i18n="product.specs.cleaning">${dict['product.specs.cleaning']}</span></div>
        <div><strong>✓</strong> <span data-i18n="product.specs.support">${dict['product.specs.support']}</span></div>
      </div>
    </div>
  `;
  window.JJ_CURRENT_PRODUCT = product;
}

function jjDetailQty(delta) {
  const input = document.getElementById('jjDetailQty');
  if (!input) return;
  const newVal = Math.max(1, Math.min(99, (parseInt(input.value) || 1) + delta));
  input.value = newVal;
}

function jjDetailAddToCart() {
  const product = window.JJ_CURRENT_PRODUCT;
  if (!product) return;
  const qty = parseInt(document.getElementById('jjDetailQty')?.value) || 1;
  jjAddToCart(product, qty);
  const dict = window.JJ_I18N[jjGetLang()] || window.JJ_I18N.en;
  jjToast(dict['cart.added']);
}

// =====================
// CONTACT FORM
// =====================
function jjBindContactForm() {
  const form = document.getElementById('jjContactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const lang = jjGetLang();
    const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;
    const isEn = lang === 'en';

    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const phone = data.get('phone') || '';
    const message = data.get('message') || '';

    const subject = encodeURIComponent(isEn ? `Event inquiry — ${name}` : `Consulta de evento — ${name}`);
    const body = encodeURIComponent(
      `${isEn ? 'Name' : 'Nombre'}: ${name}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n\n` +
      `${message}\n`
    );
    window.location.href = `mailto:${JJ_BUSINESS.email}?subject=${subject}&body=${body}`;

    // Show success message
    const successEl = document.getElementById('jjContactSuccess');
    if (successEl) {
      successEl.innerHTML = `
        <div style="background: #d1fae5; color: #065f46; padding: 1rem; border-radius: var(--jj-radius); margin-top: 1rem;">
          <strong>${dict['contact.form.success']}</strong><br />
          <small>${dict['contact.form.successNote']}</small>
        </div>
      `;
      successEl.style.display = 'block';
      setTimeout(() => { successEl.style.display = 'none'; }, 6000);
    }
    form.reset();
  });
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  jjRenderHomeFeatured();
  jjRenderShop();
  jjRenderProductDetail();
  jjBindContactForm();
});

// Refrescar la descripción del producto cuando cambia el idioma
document.addEventListener('jj:lang-changed', () => {
  // Re-renderizar grids de productos para actualizar mini-descripciones
  const featuredGrid = document.getElementById('jjFeaturedGrid');
  const shopGrid = document.getElementById('jjShopGrid');
  if (featuredGrid) {
    const products = JJ_PRODUCTS;
    if (products.length) {
      const featured = [
        ...products.filter(p => p.category === 'jumpers').slice(0, 3),
        ...products.filter(p => p.category === 'tables-chairs').slice(0, 2),
        ...products.filter(p => p.category === 'concessions').slice(0, 1),
      ].slice(0, 6);
      featuredGrid.innerHTML = featured.map(jjRenderCard).join('');
      if (window.jjAnimateGrid) window.jjAnimateGrid(featuredGrid);
    }
  }
  if (shopGrid && JJ_PRODUCTS.length) {
    // Detectar filtro activo
    const activeFilter = document.querySelector('#jjCategoryPills .jj-cat-pill.is-active');
    const filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    const filtered = filter === 'all' ? JJ_PRODUCTS : JJ_PRODUCTS.filter(p => p.category === filter);
    shopGrid.innerHTML = filtered.map(jjRenderCard).join('');
    if (window.jjAnimateGrid) window.jjAnimateGrid(shopGrid);
  }

  // Refrescar detalle de producto
  const p = window.JJ_CURRENT_PRODUCT;
  if (p) {
    const lang = jjGetLang();
    const desc = (lang === 'es' && p.description_es) ? p.description_es : (p.description || '');
    const el = document.getElementById('jjDetailDesc');
    if (el) el.textContent = desc;
  }
});
