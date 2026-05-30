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
