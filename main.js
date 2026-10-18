/* L'Epaviste IDF — scripts communs */
(function () {
  var WA = '33668353538';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* --- Menu mobile --- */
  var toggle = document.querySelector('.navbar_toggle');
  var menu = document.querySelector('.navbar_menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? 'Fermer' : 'Menu';
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', false); toggle.textContent = 'Menu'; } });
  }

  /* --- Barre collante : ombre dès qu'elle flotte --- */
  var nav = document.querySelector('.navbar_component');
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', nav.getBoundingClientRect().top <= 0 && window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* --- Entrées au scroll, en cascade dans chaque groupe --- */
  var groups = document.querySelectorAll('[data-reveal-group]');
  groups.forEach(function (g) {
    g.querySelectorAll('[data-reveal]').forEach(function (el, i) { el.style.setProperty('--delay', Math.min(i * 0.075, 0.6) + 's'); });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal], .is-shutter').forEach(function (el) { io.observe(el); });

  /* --- Galerie : glisser à la souris (le doigt marche nativement) --- */
  document.querySelectorAll('.gallery_row').forEach(function (row) {
    var down = false, startX = 0, startScroll = 0, moved = false;
    row.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startScroll = row.scrollLeft; row.classList.add('is-dragging'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; row.scrollLeft = startScroll - dx; });
    window.addEventListener('pointerup', function () { down = false; row.classList.remove('is-dragging'); });
    row.addEventListener('click', function (e) { if (moved) e.preventDefault(); }, true);
  });

  /* --- Outil « Vos papiers » : affiche la liste selon la situation --- */
  var tool = document.querySelector('[data-papers]');
  if (tool) {
    var panels = tool.querySelectorAll('.papers_panel');
    tool.addEventListener('change', function (e) {
      if (!e.target.matches('input[name="situation"]')) return;
      panels.forEach(function (p) {
        var on = p.dataset.panel === e.target.value;
        p.hidden = !on;
        if (on && !reduce) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); }
      });
      track('papers_situation', e.target.value);
    });
    // Sans JS, tous les panneaux restent visibles ; avec JS on n'affiche que le premier
    panels.forEach(function (p, i) { p.hidden = i !== 0; });
  }

  /* --- Formulaire de contact → message WhatsApp pré-rempli --- */
  var form = document.querySelector('[data-contact]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var err = form.querySelector('[data-error-for="' + f.name + '"]');
        var bad = !f.value.trim() || (f.name === 'tel' && f.value.replace(/\D/g, '').length < 10);
        if (err) err.textContent = bad ? (f.name === 'tel' ? 'Indiquez un numéro à 10 chiffres.' : 'Ce champ est nécessaire.') : '';
        f.setAttribute('aria-invalid', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var d = new FormData(form);
      var msg = 'Bonjour, je souhaite faire enlever un véhicule.\n' +
        'Nom : ' + d.get('nom') + '\nTéléphone : ' + d.get('tel') + '\nCode postal : ' + d.get('cp') +
        '\nVéhicule : ' + d.get('vehicule') + (d.get('immat') ? '\nImmatriculation : ' + d.get('immat') : '');
      track('Lead', 'formulaire');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  }

  /* --- Suivi Ads : appels, WhatsApp, formulaire (Google Ads / GTM / Meta Pixel s'ils sont installés) --- */
  function track(name, label) {
    if (window.dataLayer) window.dataLayer.push({ event: 'contact_click', contact_type: label });
    if (window.gtag) window.gtag('event', 'contact_click', { contact_type: label });
    if (window.fbq) window.fbq('track', name === 'Lead' ? 'Lead' : 'Contact', { method: label });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="tel:"], a[href*="wa.me"]');
    if (a) track('Contact', a.href.indexOf('tel:') === 0 ? 'appel' : 'whatsapp');
  });
})();
