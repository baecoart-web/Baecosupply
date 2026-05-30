/* BaecoSupply Global JS v2.0 */
(function() {
  'use strict';

  // ─── HEADER SCROLL ───
  var hdr = document.getElementById('hdr');
  if (hdr) {
    window.addEventListener('scroll', function() {
      hdr.classList.toggle('scrolled', window.scrollY > 20);
    }, {passive: true});
  }

  // ─── MOBILE NAV ───
  var mobNav = document.querySelector('.mob-nav');
  var mobBtn = document.querySelector('.nav-mob-btn');
  var mobClose = document.querySelector('.mob-close');

  if (mobBtn && mobNav) {
    mobBtn.addEventListener('click', function() {
      mobNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  function closeMobNav() {
    if (mobNav) {
      mobNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
  if (mobClose) mobClose.addEventListener('click', closeMobNav);
  if (mobNav) {
    mobNav.querySelectorAll('.mob-nav-link').forEach(function(a) {
      a.addEventListener('click', closeMobNav);
    });
  }

  // ─── GLOBAL SEARCH ───
  var searchInputs = document.querySelectorAll('.hdr-search input, #globalSearch');
  searchInputs.forEach(function(inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var q = inp.value.trim();
        if (q) window.location.href = '/firme/index.html?q=' + encodeURIComponent(q);
      }
    });
  });

  // ─── SHARE ───
  window.shareUrl = function() {
    var url = window.location.href;
    var btns = document.querySelectorAll('.shrb');
    if (navigator.share) {
      navigator.share({title: document.title, url: url});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        if (btns[0]) { btns[0].textContent = '✓'; setTimeout(function() { btns[0].textContent = '🔗'; }, 1500); }
      });
    }
  };
  window.shareWa = function() {
    window.open('https://wa.me/?text=' + encodeURIComponent(document.title + ' ' + window.location.href), '_blank');
  };

  // ─── MODAL ───
  window.openModal = function(id) {
    var el = document.getElementById(id || 'mo');
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  };
  window.closeModal = function(id) {
    var el = document.getElementById(id || 'mo');
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  };
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.open, .mo.open').forEach(function(m) { m.classList.remove('open'); }); document.body.style.overflow = ''; }
  });

  // ─── TABS ───
  window.showTab = function(name, el) {
    var parent = el.closest('.tabs-container') || document.body;
    var panels = parent.querySelectorAll('[id^="tab-"]');
    panels.forEach(function(p) { p.style.display = 'none'; });
    var target = document.getElementById('tab-' + name);
    if (target) target.style.display = 'block';
    var tabs = el.closest('.tabs');
    if (tabs) tabs.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('on'); });
    el.classList.add('on');
  };

  // ─── LAZY IMAGES ───
  if ('IntersectionObserver' in window) {
    var imgObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var img = e.target;
          if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
          imgObs.unobserve(img);
        }
      });
    }, {rootMargin: '200px'});
    document.querySelectorAll('img[data-src]').forEach(function(img) { imgObs.observe(img); });
  }

  // ─── ADAUGA INFO MODAL ───
  window.submitAdauga = function() {
    var btn = document.querySelector('.btn-adauga-submit');
    if (!btn) return;
    btn.textContent = '✓ Trimis! Verificăm în 24h.';
    btn.style.background = '#3ecf6e';
    btn.disabled = true;
    setTimeout(function() { closeModal('mo-adauga'); }, 2600);
  };

})();
