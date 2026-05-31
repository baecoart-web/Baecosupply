// ─── SUPABASE CONFIG (citit din supabase-config.js) ─────────
var SUPA_URL = window.BAECO_SUPABASE_URL || 'https://mgusrlvkdxozvpseafbx.supabase.co';
var SUPA_KEY = window.BAECO_SUPABASE_ANON_KEY || 'sb_publishable_xmQtT4L2ybxKXJL0XGwElA_wIrLpo2I';

// ─── TABS ───
function showTab(name, el) {
  ['despre','galerie','locatie','contact'].forEach(function(t) {
    var tab = document.getElementById('tab-' + t);
    if (tab) tab.style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('on'); });
  el.classList.add('on');
}

// ─── MODAL ───
function openModal() {
  document.getElementById('mo').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('mo').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── SUBMIT ACTUALIZARE → SUPABASE ───
async function submitRev() {
  var btn = document.querySelector('.mfsub');
  var inputs = document.querySelectorAll('.mfi');

  // inputs: 0=firma(readonly), 1=nume persoana, 2=telefon, 3=email
  var numeFirma    = inputs[0] ? inputs[0].value.trim() : '';
  var numePersoana = inputs[1] ? inputs[1].value.trim() : '';
  var telefon      = inputs[2] ? inputs[2].value.trim() : '';
  var email        = inputs[3] ? inputs[3].value.trim() : '';
  var pagina       = window.location.href;

  // Slug din URL
  var slug = window.location.pathname.replace(/^\/firme\//, '').replace(/\/$/, '').replace(/\.html$/, '');

  if (!telefon && !email) {
    btn.textContent = '⚠ Introdu cel puțin telefonul sau emailul';
    btn.style.background = '#e67e22';
    setTimeout(function() {
      btn.textContent = 'Trimite cererea';
      btn.style.background = '';
    }, 2500);
    return;
  }

  btn.textContent = 'Se trimite...';
  btn.disabled = true;

  try {
    var res = await fetch(SUPA_URL + '/rest/v1/actualizari', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        firma_slug: slug,
        nume_firma: numeFirma,
        nume_persoana: numePersoana,
        telefon: telefon,
        email: email,
        pagina: pagina,
        status: 'pending'
      })
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error(errText);
    }

    // Succes
    btn.textContent = '✓ Trimis! Te contactăm în 24h.';
    btn.style.background = '#3ecf6e';
    setTimeout(closeModal, 2400);

  } catch (err) {
    console.error('Supabase error:', err.message);
    btn.textContent = '⚠ Eroare — încearcă din nou';
    btn.style.background = '#e74c3c';
    btn.disabled = false;
    setTimeout(function() {
      btn.textContent = 'Trimite cererea';
      btn.style.background = '';
    }, 3000);
  }
}

// ─── SHARE ───
function shareUrl() {
  var url = window.location.href;
  var btn = document.querySelectorAll('.shrb')[0];
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() {
      if (btn) { btn.textContent = '✓'; setTimeout(function() { btn.textContent = '🔗'; }, 1500); }
    });
  }
}
function shareWa() {
  var url = encodeURIComponent(document.title + ' ' + window.location.href);
  window.open('https://wa.me/?text=' + url, '_blank');
}

// ─── ESC CLOSE ───
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ─── PAGE FIXES ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  fixGallery();
  fixLocation();
  fixContact();
});

// 1. Galerie: ascunde placeholder-ele "Nicio imagine"
function fixGallery() {
  var gg = document.querySelector('#tab-galerie .gg');
  if (!gg) return;

  // Ascunde fiecare slot gol
  var slots = gg.querySelectorAll('.gph:not(.gadd)');
  var hasReal = false;
  slots.forEach(function(el) {
    var span = el.querySelector('span');
    if (span && (span.textContent.trim() === 'Nicio imagine' || span.textContent.trim() === '')) {
      el.style.display = 'none';
    } else if (el.querySelector('img')) {
      hasReal = true;
    }
  });

  // Dacă nu există imagini reale, înlocuiește tot conținutul cu mesaj simplu
  if (!hasReal) {
    var cb = document.querySelector('#tab-galerie .card .cb');
    if (cb) {
      cb.innerHTML = '<p style="color:#7e8494;font-size:.85rem;padding:.5rem 0;text-align:center">Nu există imagini pentru această firmă momentan.</p>';
    }
  }
}

// 2. Locație: înlocuiește "Hartă indisponibilă" cu buton Google Maps
function fixLocation() {
  var tabLoc = document.getElementById('tab-locatie');
  if (!tabLoc) return;

  // Caută elementul cu "Hartă indisponibilă"
  var badEl = null;
  tabLoc.querySelectorAll('.gph, div').forEach(function(el) {
    if (!badEl && el.children.length === 1) {
      var span = el.querySelector('span');
      if (span && span.textContent.trim().indexOf('indisponibil') !== -1) {
        badEl = el;
      }
    }
  });
  if (!badEl) return;

  // Extrage adresa din .ma
  var maEl = tabLoc.querySelector('.ma');
  var address = maEl ? maEl.textContent.replace('📍', '').trim() : '';
  if (!address || address === ', ') { badEl.style.display = 'none'; return; }

  var mapsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(address);
  var btn = document.createElement('a');
  btn.href = mapsUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'cbtn ct2';
  btn.style.cssText = 'display:inline-flex;align-items:center;gap:.5rem;margin-bottom:.5rem;text-decoration:none';
  btn.textContent = '🗺️ Deschide în Google Maps';
  badEl.parentNode.replaceChild(btn, badEl);
}

// 3. Contact: elimină rânduri și butoane goale din sidebar
function fixContact() {
  // Sidebar: ascunde .cr cu cv gol sau invalid
  document.querySelectorAll('.cr').forEach(function(cr) {
    var cv = cr.querySelector('.cv');
    if (!cv) return;
    var txt = cv.textContent.trim();
    if (!txt || txt === '–' || txt === '.' || txt === ', ') {
      cr.style.display = 'none';
    }
  });

  // Ascunde butoane .cbtn fără href valid sau cu href generic
  document.querySelectorAll('a.cbtn').forEach(function(a) {
    var href = (a.getAttribute('href') || '').trim();
    if (!href || href === '#' || href === 'http://' || href === 'https://'
        || href === 'https://www.facebook.com/' || href === 'http://www.facebook.com/') {
      a.style.display = 'none';
    }
  });

  // Dacă tab contact rămâne fără niciun buton vizibil, afișează mesaj
  var contactCb = document.querySelector('#tab-contact .card .cb');
  if (contactCb) {
    var visible = Array.from(contactCb.querySelectorAll('a.cbtn')).filter(function(a) {
      return a.style.display !== 'none';
    });
    if (visible.length === 0) {
      contactCb.innerHTML = '<p style="color:#7e8494;font-size:.85rem;padding:.5rem 0">Nu există date de contact publice pentru această firmă.</p>';
    }
  }

  // Sidebar ctab: același check
  var ctab = document.querySelector('.ctab');
  if (ctab) {
    var visCtab = Array.from(ctab.querySelectorAll('a.cbtn')).filter(function(a) {
      return a.style.display !== 'none';
    });
    if (visCtab.length === 0) {
      ctab.style.display = 'none';
    }
  }
}
