/* ============================================
   account.js — Login / Register / Settings
   (Local-only: persists in localStorage)
   ============================================ */

const JJ_ACCOUNT_KEY = '***';

function jjGetAccount() {
  try {
    const raw = localStorage.getItem(JJ_ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function jjSetAccount(acc) {
  try { localStorage.setItem(JJ_ACCOUNT_KEY, JSON.stringify(acc)); } catch (e) {}
  document.dispatchEvent(new CustomEvent('jj:account-changed', { detail: { account: acc } }));
}

function jjShowMessage(elId, text, type = 'success') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = 'jj-account-msg jj-account-msg--' + type;
  el.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

function jjSwitchTab(tabName) {
  document.querySelectorAll('.jj-account-tab').forEach(t => {
    t.classList.toggle('is-active', t.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.jj-account-panel').forEach(p => {
    p.classList.toggle('is-active', p.id === 'panel-' + tabName);
  });
  // Hide all messages
  document.querySelectorAll('.jj-account-msg').forEach(m => m.style.display = 'none');
}

// Bind tabs
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.jj-account-tab').forEach(tab => {
    tab.addEventListener('click', () => jjSwitchTab(tab.getAttribute('data-tab')));
  });

  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', () => jjSwitchTab(btn.getAttribute('data-jump-tab')));
  });

  // If logged in, show settings/history instead of login
  const account = jjGetAccount();
  if (account) {
    jjPopulateSettings(account);
    // Show welcome
    jjShowMessage('jjLoginMsg', `Welcome back, ${account.firstName || ''}!`, 'success');
  }

  // LOGIN form
  const loginForm = document.getElementById('jjLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('jj-login-email').value.trim();
      const password = document.getElementById('jj-login-password').value;
      const stored = jjGetAccount();

      if (stored && stored.email === email && stored.password === password) {
        jjShowMessage('jjLoginMsg', 'Signed in! Redirecting to settings...', 'success');
        setTimeout(() => {
          jjPopulateSettings(stored);
          jjSwitchTab('settings');
        }, 800);
      } else if (stored && stored.email === email) {
        jjShowMessage('jjLoginMsg', 'Wrong password. Try again.', 'error');
      } else {
        jjShowMessage('jjLoginMsg', 'No account found with that email. Create one below.', 'error');
        setTimeout(() => jjSwitchTab('register'), 1500);
      }
    });
  }

  // REGISTER form
  const regForm = document.getElementById('jjRegisterForm');
  if (regForm) {
    regForm.addEventListener('submit', e => {
      e.preventDefault();
      const fn = document.getElementById('jj-reg-firstname').value.trim();
      const ln = document.getElementById('jj-reg-lastname').value.trim();
      const email = document.getElementById('jj-reg-email').value.trim();
      const phone = document.getElementById('jj-reg-phone').value.trim();
      const pw = document.getElementById('jj-reg-password').value;
      const pw2 = document.getElementById('jj-reg-password2').value;

      if (pw !== pw2) {
        jjShowMessage('jjRegisterMsg', 'Passwords do not match.', 'error');
        return;
      }
      if (pw.length < 6) {
        jjShowMessage('jjRegisterMsg', 'Password must be at least 6 characters.', 'error');
        return;
      }

      const account = {
        firstName: fn,
        lastName: ln,
        email: email,
        phone: phone,
        password: pw,
        address: '',
        notifEmail: true,
        notifSms: false,
        createdAt: new Date().toISOString()
      };
      jjSetAccount(account);
      jjShowMessage('jjRegisterMsg', `Account created! Welcome, ${fn}.`, 'success');
      setTimeout(() => {
        jjPopulateSettings(account);
        jjSwitchTab('settings');
      }, 1000);
    });
  }

  // SETTINGS form
  const setForm = document.getElementById('jjSettingsForm');
  if (setForm) {
    setForm.addEventListener('submit', e => {
      e.preventDefault();
      const account = jjGetAccount();
      if (!account) {
        jjShowMessage('jjSettingsMsg', 'You need to sign in or create an account first.', 'error');
        setTimeout(() => jjSwitchTab('login'), 1000);
        return;
      }

      // Update fields
      account.firstName = document.getElementById('jj-set-firstname').value || account.firstName;
      account.lastName = document.getElementById('jj-set-lastname').value || account.lastName;
      account.email = document.getElementById('jj-set-email').value || account.email;
      account.phone = document.getElementById('jj-set-phone').value || account.phone;
      account.address = document.getElementById('jj-set-address').value || account.address;

      const newPw = document.getElementById('jj-set-password').value;
      const newPw2 = document.getElementById('jj-set-password2').value;
      if (newPw || newPw2) {
        if (newPw !== newPw2) {
          jjShowMessage('jjSettingsMsg', 'Passwords do not match.', 'error');
          return;
        }
        if (newPw.length < 6) {
          jjShowMessage('jjSettingsMsg', 'Password must be at least 6 characters.', 'error');
          return;
        }
        account.password = newPw;
      }

      account.notifEmail = setForm.querySelector('[name="notifEmail"]').checked;
      account.notifSms = setForm.querySelector('[name="notifSms"]').checked;

      jjSetAccount(account);
      jjShowMessage('jjSettingsMsg', 'Changes saved!', 'success');
    });
  }

  // LOGOUT button
  const logoutBtn = document.getElementById('jjLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem(JJ_ACCOUNT_KEY);
        jjShowMessage('jjLoginMsg', 'You are logged out.', 'success');
        jjSwitchTab('login');
        document.querySelectorAll('.jj-account-panel input').forEach(i => i.value = '');
      }
    });
  }
});

function jjPopulateSettings(account) {
  if (!account) return;
  const fields = ['firstname', 'lastname', 'email', 'phone', 'address'];
  fields.forEach(f => {
    const el = document.getElementById('jj-set-' + f);
    if (el && account[f]) el.value = account[f];
  });
  const notifEmail = document.querySelector('#jjSettingsForm [name="notifEmail"]');
  const notifSms = document.querySelector('#jjSettingsForm [name="notifSms"]');
  if (notifEmail) notifEmail.checked = account.notifEmail !== false;
  if (notifSms) notifSms.checked = !!account.notifSms;
}
