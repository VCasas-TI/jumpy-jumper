/* ============================================
   cart.js â€” Cart with localStorage + WhatsApp/Email checkout
   ============================================ */

const JJ_CART_KEY = 'jj_cart_v1';

const JJ_BUSINESS = {
  whatsapp: '18184455036',     // +1 (818) 445-5036 → E.164 sin '+'
  whatsappDisplay: '+1 (818) 445-5036',
  email: 'jumpyjumper62@gmail.com',
  name: 'Jumpy Jumper'
};

function jjLoadCart() {
  try {
    const raw = localStorage.getItem(JJ_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function jjSaveCart(items) {
  try { localStorage.setItem(JJ_CART_KEY, JSON.stringify(items)); } catch (e) {}
  document.dispatchEvent(new CustomEvent('jj:cart-changed', { detail: { items } }));
}

function jjCartCount(items) {
  if (!items) items = jjLoadCart();
  return items.reduce((sum, it) => sum + (it.qty || 0), 0);
}

function jjCartTotal(items) {
  if (!items) items = jjLoadCart();
  return items.reduce((sum, it) => sum + (it.price * it.qty), 0);
}

function jjAddToCart(product, qty = 1) {
  const items = jjLoadCart();
  const existing = items.find(it => it.slug === product.slug);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: qty
    });
  }
  jjSaveCart(items);
  return items;
}

function jjRemoveFromCart(slug) {
  const items = jjLoadCart().filter(it => it.slug !== slug);
  jjSaveCart(items);
  return items;
}

function jjUpdateQty(slug, qty) {
  const items = jjLoadCart();
  const item = items.find(it => it.slug === slug);
  if (item) {
    item.qty = Math.max(1, qty);
    jjSaveCart(items);
  }
  return items;
}

function jjClearCart() {
  jjSaveCart([]);
}

function jjFormatPrice(n) {
  return '$' + n.toFixed(2);
}

// =====================
// CART UI
// =====================
function jjRenderCart() {
  const items = jjLoadCart();
  const lang = jjGetLang();
  const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;
  const isEn = lang === 'en';

  const body = document.getElementById('jjCartBody');
  const footer = document.getElementById('jjCartFooter');
  const count = document.getElementById('jjCartCount');

  // Update badge
  if (count) {
    const c = jjCartCount(items);
    count.textContent = c;
    count.style.display = c > 0 ? 'grid' : 'none';
  }

  if (!body) return;

  if (items.length === 0) {
    body.innerHTML = `
      <div class="jj-cart__empty">
        <div class="jj-cart__empty-icon">🛒</div>
        <p>${dict['cart.empty']}</p>
        <p style="font-size: 0.875rem;">${dict['cart.emptyHint']}</p>
        <a href="shop.html" class="jj-btn jj-btn--primary jj-mt-2" onclick="jjCloseCart()">${dict['cart.emptyCta']}</a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = items.map(item => `
    <div class="jj-cart-item">
      <div class="jj-cart-item__img">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      </div>
      <div>
        <div class="jj-cart-item__name"><a href="product.html?slug=${escapeHtml(item.slug)}">${escapeHtml(item.name)}</a></div>
        <div class="jj-cart-item__price">${jjFormatPrice(item.price)} x ${item.qty}</div>
        <div class="jj-cart-item__qty">
          <button onclick="jjChangeQty('${escapeHtml(item.slug)}', ${item.qty - 1})" aria-label="Decrease">-</button>
          <span>${item.qty}</span>
          <button onclick="jjChangeQty('${escapeHtml(item.slug)}', ${item.qty + 1})" aria-label="Increase">+</button>
        </div>
        <a href="#" class="jj-cart-item__remove" onclick="jjRemoveItem('${escapeHtml(item.slug)}'); return false;">${isEn ? 'Remove' : 'Eliminar'}</a>
      </div>
      <div style="font-weight: 700; font-size: 0.95rem;">${jjFormatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  // Update total
  const total = jjCartTotal(items);
  const totalEl = document.getElementById('jjCartTotal');
  if (totalEl) totalEl.textContent = jjFormatPrice(total);
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function jjChangeQty(slug, qty) {
  if (qty < 1) { jjRemoveItem(slug); return; }
  jjUpdateQty(slug, qty);
  jjRenderCart();
}

function jjRemoveItem(slug) {
  jjRemoveFromCart(slug);
  jjRenderCart();
  const lang = jjGetLang();
  const dict = window.JJ_I18N[lang] || window.JJ_I18N.en;
  jjToast(dict['cart.removed']);
}

function jjOpenCart() {
  document.getElementById('jjCart')?.classList.add('is-open');
  document.getElementById('jjCartOverlay')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  jjRenderCart();
}

function jjCloseCart() {
  document.getElementById('jjCart')?.classList.remove('is-open');
  document.getElementById('jjCartOverlay')?.classList.remove('is-open');
  document.body.style.overflow = '';
}

function jjToast(message, type = 'success') {
  let toast = document.getElementById('jjToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'jjToast';
    toast.className = 'jj-toast';
    document.body.appendChild(toast);
  }
  toast.className = 'jj-toast jj-toast--' + type;
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('is-show'));
  setTimeout(() => toast.classList.remove('is-show'), 2200);
}

// =====================
// CHECKOUT
// =====================
function jjBuildOrderText() {
  const items = jjLoadCart();
  const lang = jjGetLang();
  const total = jjCartTotal(items);
  const isEn = lang === 'en';

  const lines = [];
  lines.push(isEn ? `Hi ${JJ_BUSINESS.name}! I'd like to rent the following items:` : `¡Hola ${JJ_BUSINESS.name}! Quisiera rentar los siguientes productos:`);
  lines.push('');
  items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.name}`);
    lines.push(`   ${jjFormatPrice(it.price)} x ${it.qty} = ${jjFormatPrice(it.price * it.qty)}`);
  });
  lines.push('');
  lines.push(`${isEn ? 'Subtotal' : 'Subtotal'}: ${jjFormatPrice(total)}`);
  lines.push('');
  lines.push(isEn ? 'Please confirm availability and total (delivery & taxes).' : 'Por favor confirmen disponibilidad y total (entrega e impuestos).');
  lines.push('');
  lines.push(isEn ? 'Event date:' : 'Fecha del evento:');
  lines.push(isEn ? 'Address:' : 'Dirección:');
  lines.push(isEn ? 'Name:' : 'Nombre:');

  return lines.join('\n');
}

function jjCheckoutWhatsApp() {
  const items = jjLoadCart();
  if (items.length === 0) return;
  window.location.href = 'checkout.html';
}

function jjCheckoutEmail() {
  const items = jjLoadCart();
  if (items.length === 0) return;
  window.location.href = 'checkout.html';
}

// Initialize cart UI on load
document.addEventListener('DOMContentLoaded', () => {
  jjRenderCart();

  document.addEventListener('jj:cart-changed', jjRenderCart);
  document.addEventListener('jj:lang-changed', jjRenderCart);

  // Bind cart open/close
  document.getElementById('jjCartBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    jjOpenCart();
  });
  document.getElementById('jjCartClose')?.addEventListener('click', jjCloseCart);
  document.getElementById('jjCartOverlay')?.addEventListener('click', jjCloseCart);

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') jjCloseCart();
  });

  // Checkout buttons
  document.getElementById('jjCheckoutWhatsApp')?.addEventListener('click', jjCheckoutWhatsApp);
  document.getElementById('jjCheckoutEmail')?.addEventListener('click', jjCheckoutEmail);

  // Mobile menu toggle
  document.getElementById('jjMenuToggle')?.addEventListener('click', () => {
    document.getElementById('jjMobileNav')?.classList.toggle('is-open');
  });
  document.querySelectorAll('#jjMobileNav a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('jjMobileNav')?.classList.remove('is-open');
    });
  });

  // Lang toggle
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      jjSetLang(btn.getAttribute('data-set-lang'));
      // Update active state
      document.querySelectorAll('[data-set-lang]').forEach(b => b.classList.toggle('is-active', b === btn));
    });
  });

  // Active nav highlight
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.jj-nav a, #jjMobileNav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path) a.classList.add('is-active');
  });
});
