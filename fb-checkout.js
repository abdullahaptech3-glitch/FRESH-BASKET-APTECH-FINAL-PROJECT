/* Mock checkout: sign-up (test data) -> mock payment -> confirmation. No real payment or order is created. */
(function () {
  'use strict';
  var F = window.FB, S = F.S, fmt = F.fmt;
  function $(i) { return document.getElementById(i); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var OFFER = 0.2;
  var items = Object.keys(S.cart).map(function (k) { return S.cart[k]; });
  function totals(list) {
    var sub = list.reduce(function (a, i) { return a + i.price * i.qty; }, 0), off = Math.round(sub * OFFER);
    return { sub: sub, off: off, fee: 0, total: sub - off };
  }
  function summary(list, t) {
    var rows = list.map(function (i) {
      return '<div class="flex justify-between gap-3 py-1"><span class="text-on-surface">' + esc(i.name) + ' <span class="text-on-surface-variant">\u00D7 ' + i.qty +
        '</span></span><span class="font-semibold whitespace-nowrap">' + fmt(i.price * i.qty) + '</span></div>';
    }).join('');
    $('co-sum').innerHTML = '<h2 class="font-headline-sm text-headline-sm mb-space-md">Order summary</h2><div class="font-body-md text-body-md divide-y divide-outline-variant">' + rows + '</div>' +
      '<dl class="mt-space-md pt-space-md border-t border-outline-variant font-body-md text-body-md space-y-2">' +
      '<div class="flex justify-between"><dt>Subtotal</dt><dd>' + fmt(t.sub) + '</dd></div>' +
      '<div class="flex justify-between text-primary"><dt>First-order offer (simulated)</dt><dd>- ' + fmt(t.off) + '</dd></div>' +
      '<div class="flex justify-between"><dt>Delivery fee (simulated)</dt><dd>Free</dd></div>' +
      '<div class="flex justify-between font-bold text-title-md font-title-md pt-2 border-t border-outline-variant"><dt>Total</dt><dd>' + fmt(t.total) + '</dd></div></dl>' +
      '<p class="mt-space-md font-body-sm text-body-sm text-on-surface-variant">Offer terms: 20% off one mock first order and free delivery. Simulated for this demo only; no discount or charge is real.</p>';
  }
  function step(n) {
    ['p1', 'p2', 'p3'].forEach(function (p, i) { $(p).classList.toggle('hidden', i !== n - 1); });
    $('co-step').textContent = n === 3 ? 'Order placed (demo)' : 'Step ' + n + ' of 2 \u2022 ' + (n === 1 ? 'Your details' : 'Mock payment');
    window.scrollTo({ top: 0 });
  }
  function err(m) { var e = $('co-err'); e.textContent = m; e.classList.toggle('hidden', !m); }

  var SUG = [[/milk|egg|butter|dairy/i, [['Sourdough Loaf', 320], ['Grass-Fed Butter 200g', 450]]],
    [/mango|fruit|apple|kinnow|pear|berr|lemon/i, [['Juicy Lemons 250g', 80], ['Fresh Mint Bunch', 40]]],
    [/rice|biryani|masala|ghee/i, [['Desi Ghee 250g', 690], ['Biryani Masala', 120]]]];
  function suggestions(list) {
    var names = list.map(function (i) { return i.name.toLowerCase(); }), out = [];
    SUG.forEach(function (r) { if (list.some(function (i) { return r[0].test(i.name); })) r[1].forEach(function (s) { out.push(s); }); });
    [['Juicy Lemons 250g', 80], ['Fresh Mint Bunch', 40], ['Organic Brown Sugar 500g', 180]].forEach(function (s) { out.push(s); });
    var seen = {};
    return out.filter(function (s) { var k = s[0].toLowerCase(); if (seen[k] || names.indexOf(k) > -1) return false; return (seen[k] = 1); }).slice(0, 3);
  }

  function confirm(o) {
    summary(o.items, o);
    var code = 'FRIEND-' + o.id.replace(/\D/g, '');
    var share = 'Try FreshBasket (demo project)! Use code ' + code + ' on your first mock order.';
    var sg = suggestions(o.items).map(function (s, i) {
      return '<div class="flex items-center justify-between gap-3 border border-outline-variant rounded-xl p-space-md"><div><p class="font-title-md text-title-md">' + esc(s[0]) +
        '</p><p class="font-body-md text-body-md text-on-surface-variant">' + fmt(s[1]) + '</p></div><button type="button" data-sg="' + i + '" class="px-space-md py-space-sm rounded-xl bg-primary-fixed text-on-primary-fixed font-label-lg text-label-lg min-h-[44px]">Add to next basket</button></div>';
    }).join('');
    var list = suggestions(o.items);
    $('p3').innerHTML =
      '<div class="rounded-xl border-2 border-dashed border-error p-space-md mb-space-lg text-center"><p class="font-title-lg text-title-lg text-error">SAMPLE/DEMO \u2013 NOT A VALID ORDER</p>' +
      '<p class="font-body-md text-body-md text-on-surface-variant mt-1">Nothing was ordered, paid for or delivered.</p></div>' +
      '<h2 class="font-headline-md text-headline-md mb-1">Thanks' + (o.name ? ', ' + esc(o.name) : '') + '!</h2>' +
      '<p class="font-body-lg text-body-lg text-on-surface-variant mb-space-md">Mock order <b class="text-on-surface">' + esc(o.id) + '</b> is confirmed.</p>' +
      '<dl class="grid sm:grid-cols-2 gap-space-md font-body-md text-body-md mb-space-lg"><div><dt class="text-on-surface-variant">Delivery slot (simulated)</dt><dd class="font-semibold">' + esc(o.slot) + '</dd></div>' +
      '<div><dt class="text-on-surface-variant">Area (simulated)</dt><dd class="font-semibold">' + esc(o.area) + (o.city ? ', ' + esc(o.city) : '') + '</dd></div>' +
      '<div><dt class="text-on-surface-variant">Payment</dt><dd class="font-semibold">' + esc(o.pay) + '</dd></div><div><dt class="text-on-surface-variant">Total</dt><dd class="font-semibold">' + fmt(o.total) + '</dd></div></dl>' +
      '<h3 class="font-headline-sm text-headline-sm mb-1">Buy again</h3><p class="font-body-md text-body-md text-on-surface-variant mb-space-md">You may also need these, based on the items in this sample basket.</p>' +
      '<div class="grid gap-space-sm mb-space-lg" id="co-sg">' + sg + '</div>' +
      '<div class="rounded-xl bg-surface-container-low p-space-lg mb-space-lg"><h3 class="font-headline-sm text-headline-sm mb-1">Share FreshBasket</h3>' +
      '<p class="font-body-md text-body-md mb-space-md">' + esc(share) + '</p><button type="button" id="co-copy" class="px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-title-md text-title-md min-h-[44px]">Copy share message</button>' +
      '<p class="font-body-sm text-body-sm text-on-surface-variant mt-space-md">Sample reward: \u20A8 200 off a friend\u2019s first mock order. Demo only; no reward is issued.</p></div>' +
      '<button type="button" id="co-new" class="px-space-lg py-space-sm rounded-xl border border-primary text-primary font-title-md text-title-md min-h-[44px]">Start a new demo basket</button>';
    $('co-sg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sg]'); if (!b) return;
      var s = list[+b.dataset.sg]; F.add({ id: 'sg-' + s[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: s[0], price: s[1] }, 1);
      b.textContent = 'Added'; b.disabled = true; b.classList.add('opacity-60');
    });
    $('co-copy').addEventListener('click', function () {
      try { navigator.clipboard.writeText(share).then(function () { F.toast('Share message copied'); }, function () { F.toast(share); }); } catch (e) { F.toast(share); }
    });
    $('co-new').addEventListener('click', function () { delete S.order; F.save(); location.href = F.P.home; });
    step(3);
  }

  if (S.order && S.order.id && !items.length) { confirm(S.order); return; }
  if (!items.length) { $('co-wrap').classList.add('hidden'); $('co-empty').classList.remove('hidden'); return; }
  var t = totals(items); summary(items, t); step(1);

  $('f1').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('f-name').value.trim(), ph = $('f-phone').value.replace(/\D/g, ''), em = $('f-email').value.trim();
    if (n.length < 2) return err('Enter a test name.');
    if (ph.length < 10) return err('Enter a test phone number with at least 10 digits.');
    if (!/^\S+@\S+\.\S+$/.test(em)) return err('Enter a test email like test@example.com.');
    if (!$('f-ok').checked) return err('Please confirm you are using test data.');
    err(''); S.user = { name: n.split(' ')[0] }; F.save(); step(2);
  });
  $('back1').addEventListener('click', function () { step(1); });
  $('f2').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = document.querySelector('input[name="pay"]:checked');
    S.order = { id: 'FB-' + (10000 + Math.floor(Math.random() * 89999)), items: items, sub: t.sub, off: t.off, fee: t.fee, total: t.total,
      slot: S.slot || 'Today, 10:00 AM - 12:00 PM', area: S.area || 'DHA Phase 6 & Phase 8', city: S.city || 'Karachi',
      pay: (p ? p.value : 'Cash on delivery') + ' (mock)', name: S.user && S.user.name || '' };
    S.cart = {}; F.save(); F.paint(); confirm(S.order);
  });
})();
