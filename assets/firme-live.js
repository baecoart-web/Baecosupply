/* BaecoSupply — live Supabase overlay for judet & servicii pages */
(function () {
  'use strict';
  var SURL = 'https://mgusrlvkdxozvpseafbx.supabase.co';
  var SKEY = 'sb_publishable_xmQtT4L2ybxKXJL0XGwElA_wIrLpo2I';

  function mapRow(r) {
    return {
      slug:      r.slug      || '',
      nume:      r.nume      || '', name: r.nume || '',
      cat:       r.categorie || 'Servicii',
      sub:       r.subcategorie || r.categorie || 'Servicii construcții',
      category:  r.subcategorie || r.categorie || '',
      judet:     r.judet     || '', county: r.judet || '',
      loc:       r.localitate|| '', city: r.localitate || '', localitate: r.localitate || '',
      tel:       r.telefon   || '', phone: r.telefon || '',
      web:       r.website   || '', website: r.website || '',
      tip:       r.categorie || 'Servicii construcții'
    };
  }

  /* ── Judet pages: FIRME global + filterFirme() ── */
  if (typeof window.JUD !== 'undefined' && typeof window.FIRME !== 'undefined') {
    var params = 'select=slug,nume,categorie,subcategorie,judet,localitate,telefon,website'
      + '&status_activ=eq.true'
      + '&judet=eq.' + encodeURIComponent(window.JUD)
      + '&order=id.desc&limit=1000';

    fetch(SURL + '/rest/v1/firme_publice?' + params, {
      headers: { 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY }
    })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      if (!rows || !rows.length) return;
      var existing = window.FIRME;
      var seen = Object.create(null);
      existing.forEach(function (f) { if (f.slug) seen[f.slug] = true; });
      var added = rows.filter(function (r) { return r.slug && !seen[r.slug]; }).map(mapRow);
      if (!added.length) return;
      window.FIRME = existing.concat(added);

      /* add any new categories to the dropdown */
      var sel = document.getElementById('scat');
      if (sel) {
        var seenCat = Object.create(null);
        for (var i = 0; i < sel.options.length; i++) seenCat[sel.options[i].value] = true;
        added.forEach(function (f) {
          var c = f.sub || f.category;
          if (c && !seenCat[c]) {
            var o = document.createElement('option');
            o.value = c; o.textContent = c;
            sel.appendChild(o);
            seenCat[c] = true;
          }
        });
      }

      /* add any new locations to the dropdown */
      var sloc = document.getElementById('sloc');
      if (sloc) {
        var seenLoc = Object.create(null);
        for (var j = 0; j < sloc.options.length; j++) seenLoc[sloc.options[j].value] = true;
        added.forEach(function (f) {
          var l = f.loc || f.city;
          if (l && !seenLoc[l]) {
            var o2 = document.createElement('option');
            o2.value = l; o2.textContent = l;
            sloc.appendChild(o2);
            seenLoc[l] = true;
          }
        });
      }

      if (typeof filterFirme === 'function') filterFirme();
    })
    .catch(function () {});
    return;
  }

  /* ── Servicii page: append live cards to #firmeGrid ── */
  var grid = document.getElementById('firmeGrid');
  if (!grid) return;

  fetch(SURL + '/rest/v1/firme_publice?select=slug,nume,categorie,subcategorie,judet,localitate,telefon,website&status_activ=eq.true&order=id.desc&limit=1000', {
    headers: { 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY }
  })
  .then(function (r) { return r.ok ? r.json() : []; })
  .then(function (rows) {
    if (!rows || !rows.length) return;

    /* collect slugs already rendered */
    var seen = Object.create(null);
    grid.querySelectorAll('a[href^="/firme/"]').forEach(function (a) {
      var m = a.getAttribute('href').match(/\/firme\/(.+)/);
      if (m) seen[m[1]] = true;
    });

    var added = rows.filter(function (r) { return r.slug && !seen[r.slug]; });
    if (!added.length) return;

    function ini(n) {
      var w = (n || '').replace(/[-\.]/g, ' ').split(/\s+/).filter(function (x) { return x.length > 1; });
      return w.slice(0, 2).map(function (x) { return x[0].toUpperCase(); }).join('') || (n || '').slice(0, 2).toUpperCase();
    }

    var frag = document.createDocumentFragment();
    added.forEach(function (r) {
      var tel = r.telefon || '';
      var telStr = tel ? '<a href="tel:' + tel.replace(/[^0-9+]/g, '') + '" class="fa fa-tel">📞 Sună</a>' : '';
      var waStr  = tel ? '<a href="https://wa.me/' + tel.replace(/[^0-9]/g, '') + '" target="_blank" class="fa fa-wa">💬 WA</a>' : '';
      var more   = '<a href="/firme/' + r.slug + '" class="fa fa-more">Profil →</a>';
      var div = document.createElement('div');
      div.className = 'fc';
      div.innerHTML = '<div class="fc-hd"><div class="fc-av">' + ini(r.nume) + '</div>'
        + '<div><div class="fc-name">' + (r.nume || '') + '</div>'
        + '<div class="fc-sub">' + (r.subcategorie || r.categorie || '') + '</div></div></div>'
        + '<div class="fc-loc">📍 ' + (r.localitate || '') + ', ' + (r.judet || '') + '</div>'
        + '<div class="fc-acts">' + telStr + waStr + more + '</div>';
      frag.appendChild(div);
    });
    grid.appendChild(frag);
  })
  .catch(function () {});
})();
