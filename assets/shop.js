/* Mhuri Furniture: the shop, the cart, and the photo backdrop. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '27604624900';
  const money = n => '$' + n.toLocaleString('en-US');
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- the stock (sample pricing, USD) ---------- */
  const PRODUCTS = [
    { id: 'sofa-teak', cat: 'seating', badge: 'Restored', name: 'Teak-frame three-seater', note: 'Original teak frame, new foam, rust woven fabric.', price: 450 },
    { id: 'armchair-green', cat: 'seating', badge: 'Reupholstered', name: 'Bottle-green armchair', note: 'Solid wood arms, new webbing and fabric.', price: 180 },
    { id: 'loveseat-linen', cat: 'seating', badge: 'Restored', name: 'Linen two-seater', note: 'Turned legs, new natural linen covers.', price: 320 },
    { id: 'coffee-teak', cat: 'storage', badge: 'Restored', name: 'Teak coffee table', note: 'Slatted lower shelf, oiled top. 120 × 60 cm.', price: 160 },
    { id: 'dining-teak', cat: 'dining', badge: 'Restored', name: 'Six-seater teak dining table', note: 'Stripped, repaired, oiled and sealed. 180 cm.', price: 380 },
    { id: 'chairs-cane', cat: 'dining', badge: 'Restored', name: 'Mukwa dining chairs, pair', note: 'New cane seats, every joint re-glued.', price: 140 },
    { id: 'sideboard-mukwa', cat: 'storage', badge: 'Restored', name: 'Mukwa sideboard', note: 'Four doors, brass pulls, hand-oiled.', price: 420 },
    { id: 'round-pine', cat: 'dining', badge: 'Ready now', name: 'Round pine table and two chairs', note: 'Waxed pine top, painted chairs.', price: 210 },
    { id: 'bed-mukwa', cat: 'bedroom', badge: 'Made to order', name: 'Mukwa queen bed', note: 'Solid headboard, pegged joints.', price: 520 },
    { id: 'wardrobe-mukwa', cat: 'bedroom', badge: 'Made to order', name: 'Two-door mukwa wardrobe', note: 'Hanging rail, shelf, brass handles.', price: 480 },
    { id: 'drawers-teak', cat: 'bedroom', badge: 'Restored', name: 'Teak chest of drawers', note: 'Eight drawers, new runners, brass pulls.', price: 260 },
    { id: 'tv-teak', cat: 'storage', badge: 'Made to order', name: 'Teak TV cabinet', note: 'Slatted sliding doors, cable holes at the back.', price: 240 }
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const img = id => `assets/img/p/${id}.svg`;

  /* ---------- render the shop ---------- */
  const grid = $('#products');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="product" data-cat="${p.cat}" data-id="${p.id}">
      <div class="ph">
        <img src="${img(p.id)}" alt="${p.name}" loading="lazy" width="600" height="600">
        <span class="badge">${p.badge}</span>
      </div>
      <div class="body">
        <h3>${p.name}</h3>
        <p>${p.note}</p>
        <div class="foot">
          <span class="price">${money(p.price)}</span>
          <button class="add" type="button" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button>
        </div>
      </div>
    </article>`).join('');
  // a photo that is not in yet shows an honest placeholder, never a broken image
  $$('.product .ph img', grid).forEach(im => im.addEventListener('error', () => {
    const d = document.createElement('div'); d.className = 'pending'; d.textContent = 'Photo coming soon';
    im.replaceWith(d);
  }, { once: true }));

  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
    const cat = ch.dataset.cat;
    $$('.product', grid).forEach(el => { el.hidden = cat !== 'all' && el.dataset.cat !== cat; });
  }));

  /* ---------- the cart (kept in this browser only) ---------- */
  const KEY = 'mhuri-cart';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { cart = {}; }
  for (const id of Object.keys(cart)) if (!byId[id] || !(cart[id] > 0)) delete cart[id];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} };
  const countEl = $('#cart-count'), itemsEl = $('#cart-items'), totalEl = $('#cart-total'), orderBtn = $('#cart-order');
  const openBtn = $('#cart-open'), closeBtn = $('#cart-close'), scrim = $('#cart-scrim'), drawer = $('#cart');
  const toast = $('#toast');
  let toastT = 0;

  function render() {
    const ids = Object.keys(cart);
    const n = ids.reduce((s, id) => s + cart[id], 0);
    countEl.textContent = n;
    const total = ids.reduce((s, id) => s + cart[id] * byId[id].price, 0);
    totalEl.textContent = money(total);
    orderBtn.disabled = n === 0;
    if (!ids.length) { itemsEl.innerHTML = '<p class="empty">Your cart is empty. Every piece is one of a kind, so add what you love before someone else does.</p>'; return; }
    itemsEl.innerHTML = ids.map(id => {
      const p = byId[id], q = cart[id];
      return `<div class="line" data-id="${id}">
        <div class="thumb" style="background-image:url('${img(id)}')"></div>
        <div><h4>${p.name}</h4><div class="each">${money(p.price)} each</div>
          <div class="qty"><button type="button" data-dec="${id}" aria-label="One less ${p.name}">−</button><span>${q}</span><button type="button" data-inc="${id}" aria-label="One more ${p.name}">+</button></div></div>
        <div><div class="sum">${money(p.price * q)}</div><button class="rm" type="button" data-rm="${id}">Remove</button></div>
      </div>`;
    }).join('');
  }
  function bump() { countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump'); }
  function say(text) {
    toast.textContent = text; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const id = b.dataset.add;
    cart[id] = (cart[id] || 0) + 1; save(); render(); bump();
    b.classList.add('added'); b.textContent = 'Added';
    setTimeout(() => { b.classList.remove('added'); b.textContent = 'Add to cart'; }, 1600);
    say(`${byId[id].name} is in your cart`);
  });
  itemsEl.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const id = t.dataset.inc || t.dataset.dec || t.dataset.rm; if (!id) return;
    if (t.dataset.inc) cart[id]++;
    if (t.dataset.dec) cart[id]--;
    if (t.dataset.rm || cart[id] <= 0) delete cart[id];
    save(); render();
    (itemsEl.querySelector(`[data-${t.dataset.inc ? 'inc' : 'dec'}="${id}"]`) || closeBtn).focus();
  });

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    document.body.classList.add('cart-open');
    openBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => closeBtn.focus(), 50);
  }
  function closeCart() {
    document.body.classList.remove('cart-open');
    openBtn.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  openBtn.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('cart-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {                                   // keep focus inside the open drawer
      const f = $$('button:not([disabled]), input', drawer);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  orderBtn.addEventListener('click', () => {
    const ids = Object.keys(cart); if (!ids.length) return;
    const lines = ids.map(id => `• ${cart[id]} × ${byId[id].name} (${money(byId[id].price)})`);
    const total = ids.reduce((s, id) => s + cart[id] * byId[id].price, 0);
    const area = $('#cart-area').value.trim();
    const text = `Hi Mhuri, I'd like to order:\n${lines.join('\n')}\nTotal: ${money(total)}` + (area ? `\nDeliver to: ${area}` : '') + `\nPlease confirm stock and the delivery fee.`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
  render();

  /* ---------- the photo backdrop: one fixed layer, crossfading per section ---------- */
  const SOURCES = { workshop: 'assets/img/workshop-band.jpg', sideboard: 'assets/img/hero-after.jpg', worn: 'assets/img/hero-before.jpg' };
  const backdrop = $('#backdrop');
  const layers = Object.fromEntries($$('.bg', backdrop).map(el => [el.dataset.key, el]));
  let current = null;
  function show(key) {
    if (key === current || !layers[key]) return;
    const el = layers[key];
    if (!el.style.backgroundImage) el.style.backgroundImage = `url('${SOURCES[key]}')`;
    if (current) layers[current].classList.remove('on');
    el.classList.add('on'); current = key;
  }
  const secIO = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) show(e.target.dataset.bg); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  $$('[data-bg]').forEach(s => secIO.observe(s));
  new IntersectionObserver(es => backdrop.classList.toggle('live', es[0].isIntersecting && !RM.matches)).observe($('main'));
  // start on the first section's photo so the page never shows a flat colour
  show($('[data-bg]').dataset.bg);
})();
