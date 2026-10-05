// Login screen: sign in, sign up, request a password reset, and set a new password
// (after arriving from a reset link). The screen is static markup in index.html;
// this module switches between its modes and reports results.

import { describeAuthError } from './cloud.js';

const MODES = Object.freeze({
  signin: {
    subtitle: 'התחברות כדי לראות את המשימות מכל מכשיר',
    submit: 'כניסה',
    showEmail: true,
    showPassword: true,
    passwordAutocomplete: 'current-password',
    links: [{ mode: 'signup', label: 'אין לי חשבון - הרשמה' }, { mode: 'reset', label: 'שכחתי סיסמה' }],
  },
  signup: {
    subtitle: 'יצירת חשבון חדש',
    submit: 'הרשמה',
    showEmail: true,
    showPassword: true,
    passwordAutocomplete: 'new-password',
    links: [{ mode: 'signin', label: 'כבר יש לי חשבון - כניסה' }],
  },
  reset: {
    subtitle: 'נשלח קישור לאיפוס הסיסמה למייל',
    submit: 'שליחת קישור',
    showEmail: true,
    showPassword: false,
    passwordAutocomplete: 'off',
    links: [{ mode: 'signin', label: 'חזרה לכניסה' }],
  },
  'new-password': {
    subtitle: 'בחירת סיסמה חדשה',
    submit: 'שמירת הסיסמה',
    showEmail: false,
    showPassword: true,
    passwordAutocomplete: 'new-password',
    links: [],
  },
});

/**
 * cloud: the object from createCloud(). onPasswordUpdated: called after a successful new password.
 * Returns { show(mode), hide() }.
 */
export function createAuthView({ cloud, onPasswordUpdated }) {
  const screen = document.getElementById('auth-screen');
  const form = document.getElementById('auth-form');
  const subtitle = document.getElementById('auth-subtitle');
  const message = document.getElementById('auth-message');
  const submitButton = document.getElementById('auth-submit');
  const links = document.getElementById('auth-links');
  const emailField = form.querySelector('[data-auth-field="email"]');
  const passwordField = form.querySelector('[data-auth-field="password"]');
  const { email: emailInput, password: passwordInput } = form.elements;
  let mode = 'signin';
  let isBusy = false;

  function showMessage(text, tone = 'error') {
    message.textContent = text;
    message.dataset.tone = tone;
    message.hidden = !text;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const config = MODES[mode];
    subtitle.textContent = config.subtitle;
    submitButton.textContent = config.submit;
    emailField.hidden = !config.showEmail;
    passwordField.hidden = !config.showPassword;
    emailInput.required = config.showEmail;
    passwordInput.required = config.showPassword;
    passwordInput.autocomplete = config.passwordAutocomplete;
    passwordInput.value = '';
    links.replaceChildren(...config.links.map(link => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-link';
      button.dataset.authMode = link.mode;
      button.textContent = link.label;
      return button;
    }));
    showMessage('');
  }

  async function run(task) {
    if (isBusy) return;
    isBusy = true;
    submitButton.disabled = true;
    try {
      await task();
    } catch (error) {
      showMessage(describeAuthError(error));
    } finally {
      isBusy = false;
      submitButton.disabled = false;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    run(async () => {
      if (mode === 'signin') {
        const { error } = await cloud.signIn(email, password);
        if (error) throw error;
        // onAuthChange(SIGNED_IN) takes over from here.
      } else if (mode === 'signup') {
        const { data, error } = await cloud.signUp(email, password);
        if (error) throw error;
        if (!data.session) {
          setMode('signin');
          emailInput.value = email;
          showMessage('אם המייל עוד לא רשום, נשלח אליו קישור לאישור החשבון. אחרי האישור אפשר להתחבר.', 'info');
        }
      } else if (mode === 'reset') {
        const { error } = await cloud.requestPasswordReset(email);
        if (error) throw error;
        showMessage('אם קיים חשבון עם המייל הזה, נשלח אליו קישור לאיפוס הסיסמה.', 'info');
      } else if (mode === 'new-password') {
        const { error } = await cloud.updatePassword(password);
        if (error) throw error;
        onPasswordUpdated();
      }
    });
  });

  links.addEventListener('click', event => {
    const target = event.target.closest('[data-auth-mode]');
    if (!target) return;
    const email = emailInput.value;
    setMode(target.dataset.authMode);
    emailInput.value = email;
  });

  return {
    show(nextMode = 'signin') {
      setMode(nextMode);
      screen.hidden = false;
      (MODES[nextMode].showEmail ? emailInput : passwordInput).focus();
    },
    hide() {
      screen.hidden = true;
      showMessage('');
    },
  };
}
