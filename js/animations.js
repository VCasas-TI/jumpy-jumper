/* ============================================
   animations.js —â€ Scroll reveals, badge pulse, header
   ============================================ */

(function() {
  // 1. Reveal-on-scroll for elements with [data-reveal] or .jj-reveal
  const revealEls = document.querySelectorAll('[data-reveal], .jj-reveal, .jj-section-header, .jj-about-grid');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    // Fallback: show everything
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // 2. Sticky header shadow when scrolled
  const header = document.querySelector('.jj-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 3. Badge pulse on cart count change
  const cartCount = document.getElementById('jjCartCount');
  if (cartCount) {
    let lastCount = 0;
    const observer = new MutationObserver(() => {
      const current = parseInt(cartCount.textContent) || 0;
      if (current > lastCount) {
        cartCount.classList.remove('is-pulse');
        // Force reflow to restart animation
        void cartCount.offsetWidth;
        cartCount.classList.add('is-pulse');
      }
      lastCount = current;
    });
    observer.observe(cartCount, { childList: true, characterData: true, subtree: true });
  }

  // 4. Smooth parallax on hero (subtle)
  const heroImage = document.querySelector('.jj-hero__image');
  if (heroImage && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < 800) {
            heroImage.style.transform = `translateY(${y * 0.08}px) scale(${1 - y * 0.00008})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 5. Smooth-scroll offset for anchors (account for sticky header)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });
})();


// ============================================
// PROMO BANNER SLIDER
// ============================================
(function() {
  const banner = document.getElementById('jjPromoBanner');
  if (!banner) return;

  const slides = banner.querySelectorAll('.jj-promo-slide');
  const dots = banner.querySelectorAll('.jj-promo-banner__dot');
  if (slides.length === 0) return;

  let current = 0;
  let interval = null;

  function show(n) {
    if (n < 0) n = slides.length - 1;
    if (n >= slides.length) n = 0;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === n));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === n));
    current = n;
  }

  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  function startAuto() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    interval = setInterval(next, 5500);
  }
  function stopAuto() {
    if (interval) { clearInterval(interval); interval = null; }
  }

  // Bind dots
  dots.forEach(d => {
    d.addEventListener('click', () => {
      const idx = parseInt(d.getAttribute('data-slide-to')) || 0;
      stopAuto();
      show(idx);
      startAuto();
    });
  });

  // Bind arrows
  const nextBtn = document.getElementById('jjPromoNext');
  const prevBtn = document.getElementById('jjPromoPrev');
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  // Pause on hover
  banner.addEventListener('mouseenter', stopAuto);
  banner.addEventListener('mouseleave', startAuto);

  // Pause when tab is hidden (saves resources)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  // Keyboard arrows
  banner.setAttribute('tabindex', '0');
  banner.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { stopAuto(); prev(); startAuto(); }
    if (e.key === 'ArrowRight') { stopAuto(); next(); startAuto(); }
  });

  // Touch swipe
  let touchStartX = 0;
  banner.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  banner.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev(); else next();
      stopAuto(); startAuto();
    }
  });

  startAuto();
})();


// ============================================
// GALLERY LIGHTBOX + FILTER
// ============================================
(function() {
  const grid = document.getElementById('jjGalleryGrid');
  if (!grid) return;

  // LIGHTBOX
  const lb = document.getElementById('jjLightbox');
  const lbImg = document.getElementById('jjLightboxImg');
  const lbVideo = document.getElementById('jjLightboxVideo');
  const lbCap = document.getElementById('jjLightboxCaption');
  const lbClose = lb?.querySelector('.jj-lightbox__close');
  const lbPrev = lb?.querySelector('.jj-lightbox__nav--prev');
  const lbNext = lb?.querySelector('.jj-lightbox__nav--next');

  let currentIdx = 0;
  let visibleItems = [];

  function getVisibleItems() {
    const filter = document.querySelector('#jjGalleryFilters .jj-cat-pill.is-active');
    const f = filter ? filter.getAttribute('data-filter') : 'all';
    const items = Array.from(grid.querySelectorAll('.jj-gallery-item'));
    return f === 'all' ? items : items.filter(it => {
      if (f === 'video') return it.classList.contains('jj-gallery-item--video');
      if (f === 'image') return it.classList.contains('jj-gallery-item--image');
      return true;
    });
  }

  function openLightbox(idx) {
    visibleItems = getVisibleItems();
    if (visibleItems.length === 0) return;
    currentIdx = ((idx % visibleItems.length) + visibleItems.length) % visibleItems.length;
    const item = visibleItems[currentIdx];
    const isVideo = item.classList.contains('jj-gallery-item--video');
    const src = isVideo
      ? item.querySelector('video').getAttribute('src')
      : item.querySelector('img').getAttribute('src');
    const caption = isVideo
      ? item.querySelector('video').getAttribute('data-caption')
      : item.querySelector('img').getAttribute('alt');

    if (isVideo) {
      lbImg.style.display = 'none';
      lbVideo.style.display = 'block';
      lbVideo.setAttribute('src', src);
      lbVideo.play().catch(() => {});
    } else {
      lbVideo.style.display = 'none';
      lbVideo.pause();
      lbVideo.removeAttribute('src');
      lbImg.style.display = 'block';
      lbImg.setAttribute('src', src);
      lbImg.setAttribute('alt', caption || '');
    }
    lbCap.textContent = caption || '';
    lb.style.display = 'grid';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.style.display = 'none';
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function nextItem() { openLightbox(currentIdx + 1); }
  function prevItem() { openLightbox(currentIdx - 1); }

  // Open on click
  grid.querySelectorAll('.jj-gallery-item').forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
  });

  lbClose?.addEventListener('click', closeLightbox);
  lbPrev?.addEventListener('click', (e) => { e.stopPropagation(); prevItem(); });
  lbNext?.addEventListener('click', (e) => { e.stopPropagation(); nextItem(); });
  lb?.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (lb.style.display === 'none') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextItem();
    if (e.key === 'ArrowLeft') prevItem();
  });

  // FILTER
  const filters = document.getElementById('jjGalleryFilters');
  if (filters) {
    filters.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filters.querySelectorAll('.jj-cat-pill').forEach(b => b.classList.toggle('is-active', b === btn));
      const f = btn.getAttribute('data-filter');
      grid.querySelectorAll('.jj-gallery-item').forEach(item => {
        const show =
          f === 'all' ||
          (f === 'video' && item.classList.contains('jj-gallery-item--video')) ||
          (f === 'image' && item.classList.contains('jj-gallery-item--image'));
        item.style.display = show ? '' : 'none';
      });
    });
  }
})();
