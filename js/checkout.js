/* ============================================
   checkout.js — Stepper, summary, form submit
   ============================================ */

(function() {
  const form = document.getElementById('jjCheckoutForm');
  const success = document.getElementById('jjCheckoutSuccess');
  const successDetails = document.getElementById('jjSuccessDetails');
  if (!form) return;

  // Date min = tomorrow
  const dateInput = document.getElementById('jj-co-date');
  if (dateInput) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    dateInput.min = t.toISOString().split('T')[0];
  }

  // STEP NAVIGATION
  function goToStep(n) {
    document.querySelectorAll('.jj-checkout-panel').forEach(p => {
      p.classList.toggle('is-active', p.getAttribute('data-panel') == n);
    });
    document.querySelectorAll('.jj-stepper__step').forEach(s => {
      s.classList.toggle('is-active', s.getAttribute('data-step') == n);
      s.classList.toggle('is-done', parseInt(s.getAttribute('data-step')) < n);
    });
    // Scroll to top of form
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-step-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentPanel = btn.closest('.jj-checkout-panel');
      const currentStep = parseInt(currentPanel.getAttribute('data-panel'));
      // Validate current step
      if (!validateStep(currentStep)) return;
      const next = parseInt(btn.getAttribute('data-step-next'));
      goToStep(next);
    });
  });

  document.querySelectorAll('[data-step-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prev = parseInt(btn.getAttribute('data-step-prev'));
      goToStep(prev);
    });
  });

  function validateStep(step) {
    const panel = document.querySelector(`.jj-checkout-panel[data-panel="${step}"]`);
    const inputs = panel.querySelectorAll('input[required], select[required], textarea[required]');
    let ok = true;
    inputs.forEach(input => {
      if (!input.checkValidity()) {
        input.reportValidity();
        ok = false;
      }
    });
    return ok;
  }

  // ========================
  // SUMMARY (reactive)
  // ========================
  function getCart() {
    try {
      const raw = localStorage.getItem('jj_cart_v1');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function calculateSubtotal() {
    return getCart().reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  function calculateExtras() {
    let total = 0;
    document.querySelectorAll('.jj-extra-option input[type="checkbox"]:checked').forEach(cb => {
      total += parseFloat(cb.dataset.price) || 0;
    });
    return total;
  }

  function calculateDelivery() {
    const selected = document.querySelector('input[name="delivery"]:checked');
    if (!selected) return { label: 'FREE', amount: 0 };
    const v = selected.value;
    if (v === 'standard') return { label: 'FREE', amount: 0 };
    if (v === 'pickup') return { label: '\u2212$25 (pickup discount)', amount: -25 };
    if (v === 'extended') return { label: '$1.50/mile (5-15 mi)', amount: 0 };  // calculado abajo
    return { label: 'FREE', amount: 0 };
  }

  // ZIP codes de LA con millas aproximadas desde base (90001 - South LA)
  const JJ_ZIP_DISTANCES = {
    "90001": 2, "90002": 3, "90003": 2, "90004": 3, "90005": 4, "90006": 3, "90007": 3,
    "90008": 4, "90009": 4, "90010": 4, "90011": 1, "90012": 4, "90013": 3, "90014": 4,
    "90015": 3, "90016": 5, "90017": 4, "90018": 4, "90019": 5, "90020": 5, "90021": 3,
    "90022": 6, "90023": 4, "90024": 8, "90025": 10, "90026": 4, "90027": 6, "90028": 5,
    "90029": 5, "90030": 4, "90031": 5, "90032": 6, "90033": 4, "90034": 10, "90035": 8,
    "90036": 5, "90037": 3, "90038": 5, "90039": 5, "90040": 6, "90041": 6, "90042": 6,
    "90043": 4, "90044": 3, "90045": 12, "90046": 7, "90047": 3, "90048": 7, "90049": 12,
    "90056": 9, "90057": 4, "90058": 4, "90059": 3, "90061": 4, "90062": 3, "90063": 6,
    "90064": 11, "90065": 6, "90066": 13, "90067": 10, "90068": 6, "90069": 8, "90070": 5,
    "90071": 5, "90072": 6, "90073": 9, "90075": 7, "90076": 5, "90077": 11, "90078": 4,
    "90079": 4, "90080": 3, "90081": 4, "90082": 5, "90083": 4, "90084": 9, "90086": 6,
    "90087": 4, "90088": 5, "90089": 9, "90091": 7, "90093": 9, "90094": 13, "90095": 8,
    "90096": 6, "90099": 5, "90101": 4, "90102": 4, "90103": 4, "90189": 5,
    "90201": 7, "90240": 8, "90241": 8, "90242": 9,
    "90301": 7, "90302": 8, "90303": 8, "90304": 9, "90305": 7,
    "90401": 13, "90402": 14, "90403": 13, "90404": 13, "90405": 13,
    "90501": 11, "90502": 12, "90503": 13, "90504": 13, "90505": 14, "90506": 13,
    "90601": 9, "90602": 9, "90603": 11, "90604": 10, "90605": 9, "90606": 9, "90620": 18,
    "90621": 18, "90623": 17, "90630": 19, "90631": 14, "90638": 12, "90640": 9, "90650": 10,
    "90660": 8, "90670": 9,
    "90706": 8, "90712": 12, "90713": 12, "90720": 17, "90740": 18, "90742": 19, "90743": 18,
    "90802": 7, "90803": 9, "90804": 7, "90805": 6, "90806": 7, "90807": 8, "90808": 10,
    "90810": 8, "90813": 6, "90814": 8, "90815": 10,
    "91001": 13, "91006": 14, "91007": 13, "91011": 12, "91016": 13, "91020": 16,
    "91024": 16, "91030": 11, "91040": 14, "91042": 17, "91046": 16,
    "91101": 11, "91103": 11, "91104": 11, "91105": 12, "91106": 12, "91107": 13,
    "91201": 8, "91202": 8, "91203": 9, "91204": 9, "91205": 8, "91206": 9, "91207": 10,
    "91208": 11, "91210": 9, "91214": 11,
    "91301": 25, "91302": 24, "91303": 22, "91304": 21, "91306": 20, "91307": 23,
    "91311": 22, "91316": 21, "91320": 32, "91321": 26, "91324": 22, "91325": 22, "91326": 24,
    "91331": 18, "91335": 19, "91340": 19, "91342": 19, "91343": 21, "91344": 22,
    "91345": 19, "91350": 27, "91351": 28, "91352": 19, "91354": 25, "91355": 25,
    "91356": 22, "91357": 24, "91360": 32, "91361": 28, "91362": 27, "91364": 22, "91367": 22,
    "91377": 33, "91381": 30, "91383": 28, "91384": 32, "91387": 32, "91390": 33,
    "91401": 17, "91402": 18, "91403": 18, "91405": 16, "91406": 17, "91411": 18,
    "91423": 16, "91436": 17,
    "91501": 13, "91502": 13, "91504": 13, "91505": 13, "91506": 13,
    "91601": 14, "91602": 15, "91604": 14, "91605": 14, "91606": 13, "91607": 14,
    "91702": 16, "91706": 11, "91711": 17, "91722": 12, "91723": 14, "91724": 14,
    "91731": 9, "91732": 11, "91733": 10, "91740": 18, "91741": 19, "91744": 18,
    "91745": 17, "91746": 17, "91748": 19, "91750": 19, "91754": 12, "91755": 11,
    "91765": 17, "91766": 17, "91767": 18, "91768": 19, "91770": 10, "91773": 18,
    "91775": 16, "91776": 13, "91778": 16, "91780": 16, "91789": 22, "91790": 13,
    "91791": 16, "91792": 16, "91801": 11, "91803": 12,
    "92801": 22, "92802": 22, "92804": 21, "92805": 22, "92806": 23, "92807": 25,
    "92808": 26, "92821": 24, "92823": 26, "92831": 26, "92832": 25, "92833": 25,
    "92835": 26, "92840": 23, "92841": 24, "92843": 23, "92844": 23, "92845": 24
  };

  // Promedio de millaje cuando ZIP no esta en la lista
  const JJ_DEFAULT_EXTENDED_MILES = 12;

  function getDeliveryMiles(zip) {
    if (!zip) return JJ_DEFAULT_EXTENDED_MILES;
    const miles = JJ_ZIP_DISTANCES[zip];
    if (miles !== undefined) return miles;
    return JJ_DEFAULT_EXTENDED_MILES;
  }

  function calculateExtendedDeliveryFee() {
    const selected = document.querySelector('input[name="delivery"]:checked');
    if (!selected || selected.value !== 'extended') return 0;
    const zipInput = document.getElementById('jj-co-zip');
    const zip = zipInput ? zipInput.value.trim() : '';
    const miles = getDeliveryMiles(zip);
    // $1.50 por milla ida y vuelta = $3 por milla
    return Math.round(miles * 3);
  }

  function updateSummary() {
    const items = getCart();
    const itemsContainer = document.getElementById('jjSummaryItems');
    const totalsContainer = document.getElementById('jjSummaryTotals');

    if (items.length === 0) {
      itemsContainer.innerHTML = '<p style="color: var(--jj-text-muted); text-align: center; padding: 1rem 0;" data-i18n="checkout.summary.empty">Your cart is empty</p>';
      totalsContainer.style.display = 'none';
      // Apply i18n in case there are untranslated strings
      if (window.jjApplyI18N) window.jjApplyI18N(window.jjGetLang ? window.jjGetLang() : 'en');
      return;
    }

    itemsContainer.innerHTML = items.map(it => `
      <div class="jj-summary-item">
        <img src="${escapeHtml(it.image)}" alt="" />
        <div class="jj-summary-item__body">
          <div class="jj-summary-item__name">${escapeHtml(it.name)}</div>
          <div class="jj-summary-item__meta">${it.qty} \u00d7 ${formatPrice(it.price)}</div>
        </div>
        <div class="jj-summary-item__total">${formatPrice(it.price * it.qty)}</div>
      </div>
    `).join('');

    const subtotal = calculateSubtotal();
    const extras = calculateExtras();
    const delivery = calculateDelivery();
    const extendedFee = calculateExtendedDeliveryFee();
    const deliveryAmount = delivery.amount + extendedFee;
    const total = subtotal + extras + deliveryAmount;

    document.getElementById('jjSumSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('jjSumExtras').textContent = extras === 0 ? '$0.00' : formatPrice(extras);
    const deliveryLabel = delivery.amount < 0 ? delivery.label : (extendedFee > 0 ? `+${formatPrice(extendedFee)}` : delivery.label);
    document.getElementById('jjSumDelivery').textContent = deliveryLabel;
    document.getElementById('jjSumTotal').textContent = formatPrice(total);

    totalsContainer.style.display = 'block';
  }

  // Update summary on any input change
  document.addEventListener('change', e => {
    if (e.target.closest('.jj-extra-option') || e.target.matches('input[name="delivery"]')) {
      updateSummary();
    }
  });
  // Update delivery fee when ZIP changes
  document.addEventListener('input', e => {
    if (e.target.id === 'jj-co-zip') {
      updateSummary();
    }
  });

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function formatPrice(n) {
    return '$' + Number(n).toFixed(2);
  }

  // ========================
  // FORM SUBMIT
  // ========================
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const data = new FormData(form);
    const items = getCart();
    const lang = window.jjGetLang ? window.jjGetLang() : 'en';
    const isEn = lang === 'en';

    const subtotal = calculateSubtotal();
    const extras = calculateExtras();
    const delivery = calculateDelivery();
    const extendedFee = calculateExtendedDeliveryFee();
    const deliveryAmount = delivery.amount + extendedFee;
    const total = subtotal + extras + deliveryAmount;

    const extrasNames = [];
    document.querySelectorAll('.jj-extra-option input[type="checkbox"]:checked').forEach(cb => {
      extrasNames.push(cb.parentElement.querySelector('.jj-extra-option__name').textContent);
    });

    // Compose message
    const lines = [];
    lines.push(isEn ? 'Hi Jumpy Jumper! Here is my reservation:' : '¡Hola Jumpy Jumper! Aquí está mi reserva:');
    lines.push('');
    lines.push((isEn ? 'Name: ' : 'Nombre: ') + (data.get('firstName') + ' ' + data.get('lastName')));
    lines.push((isEn ? 'Phone: ' : 'Teléfono: ') + data.get('phone'));
    lines.push((isEn ? 'Email: ' : 'Email: ') + data.get('email'));
    lines.push('');
    lines.push((isEn ? 'Event date: ' : 'Fecha del evento: ') + data.get('date') + (data.get('time') ? ' at ' + data.get('time') : ''));
    lines.push((isEn ? 'Duration: ' : 'Duración: ') + data.get('duration') + 'h');
    lines.push((isEn ? 'Event type: ' : 'Tipo de evento: ') + (data.get('eventType') || ''));
    lines.push('');
    lines.push((isEn ? 'Address:' : 'Dirección:'));
    lines.push(data.get('address'));
    lines.push(data.get('city') + ', ' + data.get('zip'));
    if (data.get('notes')) {
      lines.push('');
      lines.push((isEn ? 'Notes: ' : 'Notas: ') + data.get('notes'));
    }
    lines.push('');
    lines.push('--- ' + (isEn ? 'ITEMS' : 'PRODUCTOS') + ' ---');
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name} \u2014 ${it.qty} \u00d7 ${formatPrice(it.price)} = ${formatPrice(it.price * it.qty)}`);
    });
    if (extrasNames.length) {
      lines.push('');
      lines.push('--- ' + (isEn ? 'EXTRAS' : 'EXTRAS') + ' ---');
      extrasNames.forEach(n => lines.push('\u2022 ' + n));
    }
    lines.push('');
    lines.push((isEn ? 'Subtotal: ' : 'Subtotal: ') + formatPrice(subtotal));
    lines.push((isEn ? 'Extras: ' : 'Extras: ') + (extras === 0 ? '$0.00' : formatPrice(extras)));
    lines.push((isEn ? 'Delivery: ' : 'Entrega: ') + delivery.label + (extendedFee ? ` (+${formatPrice(extendedFee)})` : ''));
    lines.push((isEn ? 'Estimated total: ' : 'Total estimado: ') + formatPrice(total));
    lines.push('');
    lines.push(isEn ? 'Payment: cash on delivery.' : 'Pago: efectivo al recibir.');
    lines.push('');
    lines.push(isEn ? 'Please confirm availability and total.' : 'Por favor confirma disponibilidad y total.');

    const text = lines.join('\n');

    // Contact method routing
    const contactMethod = data.get('contactMethod');
    if (contactMethod === 'whatsapp') {
      const url = `https://wa.me/18184455036?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } else if (contactMethod === 'email') {
      const subject = encodeURIComponent(isEn ? `Reservation — ${data.get('firstName')} ${data.get('lastName')}` : `Reserva — ${data.get('firstName')} ${data.get('lastName')}`);
      window.location.href = `mailto:jumpyjumper62@gmail.com?subject=${subject}&body=${encodeURIComponent(text)}`;
    }
    // For 'phone', we just show the success page (we'll call them)

    // Show success
    form.style.display = 'none';
    document.getElementById('jjCheckoutSummary').style.display = 'none';
    document.getElementById('jjStepper').style.display = 'none';
    success.style.display = 'block';

    if (successDetails) {
      successDetails.innerHTML = `
        <div class="jj-success-detail">
          <strong>${isEn ? 'Reservation ID' : 'ID de reserva'}:</strong> #${Date.now().toString().slice(-6)}
        </div>
        <div class="jj-success-detail">
          <strong>${isEn ? 'Total' : 'Total'}:</strong> ${formatPrice(total)}
        </div>
        <div class="jj-success-detail">
          <strong>${isEn ? 'Date' : 'Fecha'}:</strong> ${data.get('date')}
        </div>
        <div class="jj-success-detail">
          <strong>${isEn ? 'Confirmation' : 'Confirmación'}:</strong> ${contactMethod === 'whatsapp' ? (isEn ? 'via WhatsApp' : 'por WhatsApp') : (contactMethod === 'email' ? (isEn ? 'via Email' : 'por Email') : (isEn ? "We'll call you" : 'Te llamaremos'))}
        </div>
      `;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Optionally clear cart
    try { localStorage.removeItem('jj_cart_v1'); } catch (e) {}
  });

  // Initial summary
  updateSummary();
})();
