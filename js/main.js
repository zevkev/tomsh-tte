(() => {
  'use strict';

  const PRICE_PER_NIGHT = 85;
  const SERVICE_FEE = 100;
  const EMAIL = 'tomshuette.borkum@gmx.de';

  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nightsLabel = (n) => (n === 1 ? '1 Nacht' : `${n} Nächte`);
  const totalFor = (n) => n * PRICE_PER_NIGHT + SERVICE_FEE;

  /* ---------- Header & Navigation ---------- */
  const header = document.getElementById('site-header');
  const nav = document.getElementById('main-nav');
  const toggle = document.querySelector('.nav-toggle');

  const updateHeader = () => {
    header.classList.toggle('is-solid', window.scrollY > 40 || nav.classList.contains('is-open'));
  };

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    updateHeader();
  };

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Aktiven Menüpunkt markieren
  const navLinks = [...nav.querySelectorAll('ul a')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- Einblend-Animationen ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => {
      // leichte Staffelung innerhalb von Rastern
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
      if (siblings.length > 2) el.style.transitionDelay = `${(siblings.indexOf(el) % 4) * 80}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Mobile Anfrage-Leiste ---------- */
  const sticky = document.getElementById('sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    const blockers = new Set();
    const stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) blockers.add(entry.target); else blockers.delete(entry.target);
      });
      const show = blockers.size === 0;
      sticky.classList.toggle('is-visible', show);
      sticky.inert = !show;
    });
    ['.hero', '#anfrage', '.site-footer'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) stickyObserver.observe(el);
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbCounter = document.getElementById('lb-counter');
  const galleryButtons = [...document.querySelectorAll('.g-item')];
  const slides = galleryButtons.map((btn) => {
    const img = btn.querySelector('img');
    return { src: img.getAttribute('src'), alt: img.alt, caption: btn.dataset.caption };
  });
  let current = 0;
  let lastFocus = null;

  const markLoaded = () => lbImg.classList.add('is-loaded');
  lbImg.addEventListener('load', markLoaded);

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    lbImg.classList.remove('is-loaded');
    lbImg.src = slide.src;
    lbImg.alt = slide.alt;
    lbCaption.textContent = slide.caption;
    lbCounter.textContent = `${current + 1} / ${slides.length}`;
    if (lbImg.complete && lbImg.naturalWidth) requestAnimationFrame(markLoaded);
    // nächstes Bild vorladen
    new Image().src = slides[(current + 1) % slides.length].src;
  };

  const openLightbox = (index) => {
    lastFocus = document.activeElement;
    showSlide(index);
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lb.querySelector('.lb-close').focus();
  };

  const closeLightbox = () => {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    window.setTimeout(() => { lb.hidden = true; }, reduceMotion ? 0 : 250);
    if (lastFocus) lastFocus.focus();
  };

  galleryButtons.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(i)));
  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(Number(btn.dataset.open)));
  });

  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', () => showSlide(current - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => showSlide(current + 1));
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lb-stage')) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showSlide(current - 1);
    else if (e.key === 'ArrowRight') showSlide(current + 1);
    else if (e.key === 'Tab') {
      const focusables = [...lb.querySelectorAll('button')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Wischgesten auf dem Handy
  let touchX = 0;
  let touchY = 0;
  lb.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showSlide(current + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
  }, { passive: true });

  /* ---------- Preisrechner ---------- */
  const range = document.getElementById('calc-nights');
  const rangeNights = document.getElementById('calc-nights-out');
  const rangeTotal = document.getElementById('calc-total');
  const updateCalc = () => {
    const n = Number(range.value);
    const pct = ((n - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty('--p', `${pct}%`);
    rangeNights.textContent = nightsLabel(n);
    rangeTotal.textContent = euro.format(totalFor(n));
  };
  if (range) {
    range.addEventListener('input', updateCalc);
    updateCalc();
  }

  /* ---------- Anfrageformular ---------- */
  const form = document.getElementById('inquiry-form');
  const success = document.getElementById('form-success');
  const formError = document.getElementById('form-error');
  const estimate = document.getElementById('estimate');
  const estimateText = document.getElementById('estimate-text');
  const { arrival, departure } = form.elements;
  let lastInquiry = '';

  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const formatDate = (s) => parseISO(s).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  const today = new Date();
  arrival.min = toISO(today);
  departure.min = toISO(addDays(today, 1));

  const nightsBetween = (from, to) => {
    if (!from || !to) return 0;
    return Math.round((parseISO(to) - parseISO(from)) / 864e5);
  };
  const getNights = () => nightsBetween(arrival.value, departure.value);

  const updateEstimate = () => {
    const n = getNights();
    if (n > 0) {
      estimate.classList.add('is-active');
      estimateText.innerHTML = `${nightsLabel(n)} × ${euro.format(PRICE_PER_NIGHT)} + ${euro.format(SERVICE_FEE)} Pauschale = <strong>ca. ${euro.format(totalFor(n))}</strong>`;
    } else {
      estimate.classList.remove('is-active');
      estimateText.textContent = 'Wählen Sie Ihren Reisezeitraum – wir zeigen Ihnen direkt einen Richtpreis.';
    }
  };

  arrival.addEventListener('change', () => {
    if (arrival.value) {
      const minDeparture = toISO(addDays(parseISO(arrival.value), 1));
      departure.min = minDeparture;
      if (departure.value && departure.value < minDeparture) departure.value = '';
    }
    updateEstimate();
  });
  departure.addEventListener('change', updateEstimate);

  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field, .bf-field');
    if (field) field.classList.remove('has-error');
    formError.hidden = true;
  });

  const validate = () => {
    const errors = [];
    form.querySelectorAll('.field, .bf-field').forEach((f) => f.classList.remove('has-error'));
    const flag = (el, msg) => { el.closest('.field, .bf-field').classList.add('has-error'); errors.push({ el, msg }); };

    if (!arrival.value) flag(arrival, 'Bitte wählen Sie Ihr Anreisedatum.');
    if (!departure.value) flag(departure, 'Bitte wählen Sie Ihr Abreisedatum.');
    else if (arrival.value && getNights() < 1) flag(departure, 'Die Abreise muss nach der Anreise liegen.');
    if (!form.elements.adults.value || Number(form.elements.adults.value) < 1) flag(form.elements.adults, 'Bitte geben Sie die Anzahl der Erwachsenen an.');
    if (!form.elements.name.value.trim()) flag(form.elements.name, 'Bitte geben Sie Ihren Namen an.');
    if (!form.elements.email.value.trim() || !form.elements.email.checkValidity()) flag(form.elements.email, 'Bitte geben Sie eine gültige E-Mail-Adresse an.');

    if (errors.length) {
      formError.textContent = errors.length === 1 ? errors[0].msg : 'Bitte füllen Sie die markierten Felder aus.';
      formError.hidden = false;
      errors[0].el.focus();
      return false;
    }
    return true;
  };

  const buildInquiry = () => {
    const f = form.elements;
    const n = getNights();
    const subject = `Anfrage Toms Hütte: ${formatDate(arrival.value)} – ${formatDate(departure.value)} (${nightsLabel(n)})`;
    const lines = [
      'Hallo,',
      '',
      'ich interessiere mich für die Ferienwohnung „Toms Hütte“ auf Borkum und frage unverbindlich Preis und Verfügbarkeit an:',
      '',
      `Anreise: ${formatDate(arrival.value)}`,
      `Abreise: ${formatDate(departure.value)}`,
      `Nächte: ${n}`,
      `Erwachsene: ${f.adults.value}`,
      `Kinder: ${f.children.value || 0}`,
      '',
      `Richtpreis laut Website: ${n} × ${euro.format(PRICE_PER_NIGHT)} + ${euro.format(SERVICE_FEE)} Pauschale = ${euro.format(totalFor(n))}`,
      '',
      `Name: ${f.name.value.trim()}`,
      `E-Mail: ${f.email.value.trim()}`,
    ];
    if (f.phone.value.trim()) lines.push(`Telefon: ${f.phone.value.trim()}`);
    if (f.message.value.trim()) lines.push('', 'Nachricht:', f.message.value.trim());
    lines.push('', 'Viele Grüße', f.name.value.trim());
    return { subject, body: lines.join('\r\n') };
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { subject, body } = buildInquiry();
    lastInquiry = `An: ${EMAIL}\r\nBetreff: ${subject}\r\n\r\n${body}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  document.getElementById('edit-inquiry').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    arrival.focus();
  });

  /* ---------- Plus/Minus-Regler ---------- */
  const steppers = [...document.querySelectorAll('.stepper')].map((el) => {
    const input = el.querySelector('input');
    const [minus, plus] = el.querySelectorAll('[data-step]');
    const min = Number(input.min);
    const max = Number(input.max);
    const clamp = () => {
      const v = Math.min(max, Math.max(min, Math.round(Number(input.value)) || min));
      input.value = v;
      minus.disabled = v <= min;
      plus.disabled = v >= max;
    };
    [minus, plus].forEach((btn) => btn.addEventListener('click', () => {
      input.value = Number(input.value) + Number(btn.dataset.step);
      clamp();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }));
    input.addEventListener('change', clamp);
    clamp();
    return clamp;
  });
  const syncSteppers = () => steppers.forEach((clamp) => clamp());

  /* ---------- Buchungs-Widget im Hero ---------- */
  const quick = document.getElementById('quick-form');
  if (quick) {
    const qArrival = quick.elements.arrival;
    const qDeparture = quick.elements.departure;
    const qAdults = quick.elements.adults;
    const qLabel = document.getElementById('q-total-label');
    const qValue = document.getElementById('q-total-value');

    qArrival.min = arrival.min;
    qDeparture.min = departure.min;

    const updateQuick = () => {
      const n = nightsBetween(qArrival.value, qDeparture.value);
      if (n > 0) {
        qLabel.textContent = `${nightsLabel(n)} inkl. Pauschale`;
        qValue.textContent = euro.format(totalFor(n));
      } else {
        qLabel.textContent = 'Beispiel: 7 Nächte inkl. Pauschale';
        qValue.textContent = euro.format(totalFor(7));
      }
    };

    qArrival.addEventListener('change', () => {
      if (qArrival.value) {
        const minDeparture = toISO(addDays(parseISO(qArrival.value), 1));
        qDeparture.min = minDeparture;
        if (!qDeparture.value || qDeparture.value < minDeparture) {
          // Vorschlag: eine Woche Aufenthalt
          qDeparture.value = toISO(addDays(parseISO(qArrival.value), 7));
        }
      }
      updateQuick();
    });
    qDeparture.addEventListener('change', updateQuick);
    updateQuick();

    quick.addEventListener('submit', (e) => {
      e.preventDefault();
      success.hidden = true;
      form.hidden = false;
      if (qArrival.value) {
        arrival.value = qArrival.value;
        departure.min = toISO(addDays(parseISO(qArrival.value), 1));
      }
      if (qDeparture.value && nightsBetween(qArrival.value, qDeparture.value) > 0) departure.value = qDeparture.value;
      form.elements.adults.value = qAdults.value;
      syncSteppers();
      form.querySelectorAll('.field, .bf-field').forEach((f) => f.classList.remove('has-error'));
      formError.hidden = true;
      updateEstimate();

      const target = getNights() > 0 ? form.elements.name : arrival;
      document.getElementById('anfrage').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      window.setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
    });
  }

  /* ---------- Kopieren ---------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  };

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (await copyText(btn.dataset.copy)) {
        btn.classList.add('is-done');
        btn.setAttribute('aria-label', 'Kopiert!');
        window.setTimeout(() => { btn.classList.remove('is-done'); btn.setAttribute('aria-label', 'E-Mail-Adresse kopieren'); }, 1800);
      }
    });
  });

  const copyInquiryBtn = document.getElementById('copy-inquiry');
  copyInquiryBtn.addEventListener('click', async () => {
    if (await copyText(lastInquiry)) {
      const label = copyInquiryBtn.lastChild;
      label.textContent = ' Kopiert!';
      window.setTimeout(() => { label.textContent = ' Anfrage kopieren'; }, 2000);
    }
  });

  /* ---------- Jahr im Footer ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
