/* FreshBasket mock backend: shared basket, navigation, demo-only checkout hand-off. No real orders or payments. */
(function () {
  'use strict';
  var KEY = 'fb_state_v1';
  var P = { home: 'home-page.html', cart: 'Cart-%26-delevery.html', checkout: 'simulated-checkout.html', shop: 'fresh-produce.html' };
  var NAV = { home: P.home, cart: P.cart, 'fresh-fruits': P.shop, 'fresh-vegetables': P.shop, 'dairy-and-eggs': P.shop,
    'daily-essentials': P.shop, 'organic-farm': P.shop, 'meat-and-seafood': P.shop, 'recipe-bundles': P.home + '#catalog' };

  // State lives in localStorage; window.name is a fallback for browsers that isolate file:// pages.
  function load() {
    var r = null;
    try { r = localStorage.getItem(KEY); } catch (e) {}
    if (!r && /^FB:/.test(window.name)) r = window.name.slice(3);
    try { return JSON.parse(r) || {}; } catch (e) { return {}; }
  }
  var S = load(); S.cart = S.cart || {};
  function save() {
    var j = JSON.stringify(S);
    try { localStorage.setItem(KEY, j); } catch (e) {}
    window.name = 'FB:' + j;
  }
  function fmt(n) { return '\u20A8 ' + Math.round(n).toLocaleString('en-US'); }
  function count() { return Object.keys(S.cart).reduce(function (a, k) { return a + S.cart[k].qty; }, 0); }
  function sub() { return Object.keys(S.cart).reduce(function (a, k) { return a + S.cart[k].qty * S.cart[k].price; }, 0); }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }

  function toast(m) {
    var t = document.getElementById('fb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'fb-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.className = 'show';
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, 2200);
  }

  function paint() {
    var n = count(), t = sub();
    document.querySelectorAll('header [data-path="cart"]').forEach(function (a) {
      var b = a.querySelector('.bg-secondary-container'), m = a.querySelector('.font-bold.leading-tight');
      if (b) b.textContent = n; if (m) m.textContent = fmt(t);
    });
    var fb = document.getElementById('floating-cart-badge'), ft = document.getElementById('floating-cart-total');
    if (fb) fb.textContent = n; if (ft) ft.textContent = fmt(t);
  }

  function add(it, q) {
    var c = S.cart[it.id];
    if (c) c.qty += q; else S.cart[it.id] = { id: it.id, name: it.name, price: +it.price, unit: it.unit || '', img: it.img || '', qty: q };
    save(); paint();
  }

  function qtyEl(card) {
    return [].slice.call(card.querySelectorAll('span')).filter(function (x) {
      return !x.closest('button') && !x.children.length && /^\d{1,2}$/.test(x.textContent.trim());
    })[0];
  }

  // Product buttons on Home and Fresh Produce feed the shared basket.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button,a'); if (!b) return;
    if (b.id === 'floating-cart-btn') { e.preventDefault(); e.stopImmediatePropagation(); location.href = P.cart; return; }
    if (b.id === 'add-bundle-btn' || b.id === 'addBundleBtn') {
      e.preventDefault(); e.stopImmediatePropagation();
      var box = b, prices = [];
      for (var i = 0; i < 6 && box && !prices.length; i++) {
        box = box.parentElement;
        (box.textContent.match(/\u20A8\s*[\d,]+/g) || []).forEach(function (p) { prices.push(+p.replace(/\D/g, '')); });
      }
      var h = box && box.querySelector('h2,h3'), name = h ? h.textContent.trim() : 'Basket bundle';
      if (prices.length) { add({ id: 'bundle-' + slug(name), name: name, price: Math.min.apply(null, prices) }, 1); toast('Added to your basket'); }
      return;
    }
    var card = b.closest('[data-id][data-price]');
    if (!card || b.tagName !== 'BUTTON') return;
    var t = b.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (b.title === 'Wishlist' || /favorite|visibility|quick view/.test(t)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var sp = qtyEl(card);
    if (t === 'add' || t === 'remove') {   // quantity stepper on product cards
      if (sp) sp.textContent = Math.max(1, Math.min(20, (+sp.textContent || 1) + (t === 'add' ? 1 : -1)));
      return;
    }
    if (/add/.test(t)) {
      var im = card.querySelector('img'), shop = location.pathname.indexOf('fresh-produce') > -1;
      add({ id: (shop ? 's-' : 'h-') + card.dataset.id, name: card.dataset.name, price: card.dataset.price, unit: card.dataset.unit,
        img: im && /^https?:/.test(im.src) ? im.src : '' }, sp ? +sp.textContent || 1 : 1);
      if (sp) sp.textContent = '1';
      toast('Added to your basket');
    }
  }, true);

  // Navigation: header, category bar and logo now link to real pages.
  document.querySelectorAll('a[data-path]').forEach(function (a) { if (NAV[a.dataset.path]) a.setAttribute('href', NAV[a.dataset.path]); });

  // Keep header height in sync so content never hides under the fixed header.
  function hdr() {
    var h = document.querySelector('header.fixed');
    if (h) document.documentElement.style.setProperty('--fb-hdr', h.offsetHeight + 'px');
  }
  window.addEventListener('resize', hdr); window.addEventListener('load', function () { hdr(); paint(); });
  var hd = document.querySelector('header.fixed');
  if (hd && window.ResizeObserver) new ResizeObserver(hdr).observe(hd);
  hdr();

  // Delivery-day buttons show real dates instead of hardcoded ones.
  var d = new Date(), mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    wk = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], di = 0;
  document.querySelectorAll('button').forEach(function (b) {
    if (!/^(Today|Tomorrow|\w+day),\s*\d+\s+[A-Za-z]{3}$/.test(b.textContent.trim()) || b.children.length) return;
    var x = new Date(d.getTime() + di * 864e5);
    b.textContent = (di === 0 ? 'Today' : di === 1 ? 'Tomorrow' : wk[x.getDay()]) + ', ' + x.getDate() + ' ' + mon[x.getMonth()]; di++;
  });

  // Cart & Delivery page: render rows from the shared basket and keep it in sync.
  var box = document.getElementById('cart-item-container');
  if (box) {
    var tpl = box.querySelector('.cart-row');
    if (tpl) {
      tpl = tpl.cloneNode(true); box.innerHTML = '';
      Object.keys(S.cart).forEach(function (k) {
        var it = S.cart[k], r = tpl.cloneNode(true);
        r.setAttribute('data-id', k); r.setAttribute('data-qty', it.qty); r.setAttribute('data-unit-price', it.price);
        var h = r.querySelector('h3'); if (h) { h.textContent = it.name; if (h.previousElementSibling) h.previousElementSibling.remove(); }
        var im = r.querySelector('img'); if (im) { if (it.img) im.src = it.img; else im.style.display = 'none'; }
        r.querySelectorAll('span').forEach(function (s) {
          var x = s.textContent.trim();
          if (/^Pack size/.test(x)) s.textContent = (it.unit ? it.unit + ' \u2022 ' : '') + fmt(it.price) + ' each';
          else if (/ total$/.test(x)) s.textContent = '';
        });
        r.querySelectorAll('button[onclick]').forEach(function (bt) {
          bt.setAttribute('onclick', bt.getAttribute('onclick').replace(/\(\s*[^,)]+/, "('" + k + "'"));
        });
        box.appendChild(r);
      });
    }
    var rows = box.querySelectorAll('.cart-row').length;
    box.classList.toggle('hidden', !rows);
    var es = document.getElementById('empty-state'); if (es) es.classList.toggle('hidden', !!rows);
    if (window.recalculateTotal) window.recalculateTotal();
    var fromDom = function () {
      var c = {};
      document.querySelectorAll('.cart-row').forEach(function (r) {
        var k = r.getAttribute('data-id'), o = S.cart[k] || {}, h = r.querySelector('h3');
        c[k] = { id: k, name: h ? h.textContent.trim() : o.name || 'Item', price: +r.getAttribute('data-unit-price'),
          qty: +r.getAttribute('data-qty'), unit: o.unit || '', img: o.img || '' };
      });
      S.cart = c; save(); paint();
    };
    ['adjustQty', 'removeItem', 'clearBasket', 'addQuickItem'].forEach(function (n) {
      var f = window[n]; if (typeof f !== 'function') return;
      window[n] = function () { var r = f.apply(this, arguments); fromDom(); return r; };
    });
    window.simulateCheckout = function () {
      if (!count()) { toast('Your basket is empty. Build Your Basket first.'); return; }
      var a = document.getElementById('area-select'), c = document.getElementById('city-select');
      S.area = a && a.options[a.selectedIndex] ? a.options[a.selectedIndex].text : '';
      S.city = c && c.options[c.selectedIndex] ? c.options[c.selectedIndex].text.split(' (')[0] : '';
      S.slot = 'Today, ' + (typeof activeSlotText !== 'undefined' ? activeSlotText : '10:00 AM - 12:00 PM');
      delete S.order; save(); location.href = P.checkout;
    };
  }

  window.FB = { S: S, save: save, fmt: fmt, count: count, sub: sub, add: add, toast: toast, paint: paint, P: P };
  paint(); setTimeout(paint, 400);
})();
