(function(){
  function norm(s){
    return (s||'').toString().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }
  function title(s){ return (s||'').toString().trim(); }
  function unique(arr){ return Array.from(new Set(arr.filter(Boolean))); }
  function byJudet(firme){
    var m={};
    firme.forEach(function(f){
      var j=title(f.judet||f.jud||''); if(!j) return;
      if(!m[j]) m[j]={name:j, slug:norm(j), total:0, cats:new Set(), locs:new Set()};
      m[j].total++;
      if(f.sub) m[j].cats.add(title(f.sub));
      if(f.loc) m[j].locs.add(title(f.loc));
    });
    return Object.keys(m).map(function(k){
      return {name:m[k].name, slug:m[k].slug, total:m[k].total, cats:m[k].cats.size, locs:Array.from(m[k].locs)};
    }).sort(function(a,b){return b.total-a.total || a.name.localeCompare(b.name,'ro');});
  }
  function labelCount(n, plus){ return n + (plus ? '+' : ''); }
  function updateTextContains(selector, re, replacement){
    document.querySelectorAll(selector).forEach(function(el){ el.textContent=el.textContent.replace(re,replacement); });
  }
  function updateStats(firme){
    var total=firme.length;
    var judete=byJudet(firme);
    var catCount=unique(firme.map(function(f){return title(f.sub||f.cat||f.tip||'')})).length;

    // Homepage statistic bar: Firme / Județe / Categorii
    document.querySelectorAll('.sbar .sn2').forEach(function(el){
      var label=(el.parentElement && el.parentElement.textContent || '').toLowerCase();
      if(label.indexOf('firme')>-1) el.textContent=total;
      if(label.indexOf('jude')>-1) el.textContent=judete.length;
      if(label.indexOf('categor')>-1) el.textContent=catCount+'+';
    });

    // Homepage ticker + meta-like visible texts
    document.querySelectorAll('.ticker-item').forEach(function(el){
      if(/firme locale/i.test(el.textContent)) el.innerHTML='<span class="ticker-dot"></span>'+total+'+ firme locale';
    });

    // Firme listing page
    var cnt=document.getElementById('cntLabel'); if(cnt) cnt.textContent=total+' firme';
    document.querySelectorAll('.ph-sub').forEach(function(el){
      if(/firme locale/i.test(el.textContent)) el.textContent=total+' firme locale din Moldova — depozite, constructori, servicii și utilaje.';
    });

    // Hero badges/paragraphs on județe page and similar pages
    updateTextContains('p, .badge, .footer-copy', /\b\d+\s*firme\b/gi, total+' firme');
    updateTextContains('p, .badge', /\b\d+\s*județe\b/gi, judete.length+' județe');
    updateTextContains('p, .badge, .scct', /\b\d+\+?\s*categorii\b/gi, catCount+'+ categorii');

    // Homepage county cards
    var jhg=document.getElementById('jhg');
    if(jhg){
      jhg.innerHTML=judete.map(function(j){
        return '<a href="/judete/'+j.slug+'/" class="jhc"><div class="jhn">'+j.name+'</div><div class="jhct"><span>'+j.total+' firme</span><span>'+j.cats+' categorii</span></div></a>';
      }).join('');
    }

    // County index page cards, regenerated from current JSON
    var grid=document.querySelector('.judete-grid');
    if(grid){
      var max=Math.max.apply(null, judete.map(function(j){return j.total;}));
      grid.innerHTML=judete.map(function(j){
        var locs=j.locs.slice(0,4).join(' · ') || j.name;
        var width=max ? Math.max(5, Math.round(j.total/max*100)) : 5;
        return '<a href="/judete/'+j.slug+'/" class="jcard">'
          +'<div class="jc-top"><div class="jc-name">'+j.name+'</div><div class="jc-arrow"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div></div>'
          +'<div class="jc-orase">'+locs+'</div>'
          +'<div class="jc-stats"><span class="jc-stat main">'+j.total+' firme</span><span class="jc-stat">'+j.cats+' categorii</span></div>'
          +'<div class="jc-bar"><div class="jc-bar-fill" style="width:'+width+'%"></div></div>'
          +'</a>';
      }).join('');
    }
  }
  fetch('/assets/firme.json', {cache:'no-store'})
    .then(function(r){return r.ok?r.json():null;})
    .then(function(data){ if(Array.isArray(data)) updateStats(data); })
    .catch(function(){ /* păstrează valorile existente dacă JSON-ul nu se încarcă */ });
})();
