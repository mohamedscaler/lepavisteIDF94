/* L'Epaviste IDF — scripts communs */
(function () {
  var WA = '33668353538';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* --- Menu mobile --- */
  var toggle = document.querySelector('.navbar_toggle');
  var menu = document.querySelector('.navbar_menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  /* --- Ombre sous la barre quand on défile --- */
  var nav = document.querySelector('.navbar_component');
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 80); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* --- Défilements infinis : on duplique le contenu pour une boucle sans coupure --- */
  document.querySelectorAll('[data-marquee]').forEach(function (el) {
    el.innerHTML += el.innerHTML;
    el.querySelectorAll(':scope > *').forEach(function (c, i, all) { if (i >= all.length / 2) c.setAttribute('aria-hidden', 'true'); });
  });

  /* --- Apparitions au scroll, en cascade par groupe --- */
  document.querySelectorAll('[data-reveal-group]').forEach(function (g) {
    g.querySelectorAll('[data-reveal]').forEach(function (el, i) { el.style.setProperty('--delay', Math.min(i * 0.08, 0.64) + 's'); });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal], .steps_grid').forEach(function (el) { io.observe(el); });

  /* --- Vidéo du hero : coupée si l'utilisateur réduit les animations --- */
  var video = document.querySelector('.hero_media video');
  if (video && reduce) { video.removeAttribute('autoplay'); video.pause(); }

  /* --- Outil « Vos papiers » --- */
  var tool = document.querySelector('[data-papers]');
  if (tool) {
    var panels = tool.querySelectorAll('.papers_panel');
    panels.forEach(function (p, i) { p.hidden = i !== 0; }); // sans JS, tout reste visible
    tool.addEventListener('change', function (e) {
      if (!e.target.matches('input[name="situation"]')) return;
      panels.forEach(function (p) {
        var on = p.dataset.panel === e.target.value;
        p.hidden = !on;
        if (on && !reduce) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); }
      });
    });
  }

  /* --- Formulaires → message WhatsApp pré-rempli (aucune donnée stockée) --- */
  document.querySelectorAll('[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var err = form.querySelector('[data-error-for="' + f.name + '"]');
        var bad = !f.value.trim() || (f.type === 'tel' && f.value.replace(/\D/g, '').length < 10);
        if (err) err.textContent = bad ? (f.type === 'tel' ? 'Indiquez un numéro à 10 chiffres.' : 'Ce champ est nécessaire.') : '';
        f.setAttribute('aria-invalid', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var lines = ['Bonjour, je souhaite faire enlever un véhicule.'];
      new FormData(form).forEach(function (v, k) {
        if (!String(v).trim()) return;
        var label = form.querySelector('[name="' + k + '"]').dataset.label || k;
        lines.push(label + ' : ' + v);
      });
      track('Lead', 'formulaire');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });

  /* --- Suivi Ads : appels, WhatsApp, formulaires (Google Ads / GTM / Meta Pixel s'ils sont installés) --- */
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
