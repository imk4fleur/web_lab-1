document.addEventListener('DOMContentLoaded', () => {

  const SKEY = 'ct_cart_v2';

  const btnCart = document.getElementById('btnCart');    
  const cnt = document.getElementById('cnt');       
  const cartBox = document.getElementById('cartBox'); 
  const list = document.getElementById('list');       
  const sumEl = document.getElementById('sum');         
  const btnCloseCart = document.getElementById('btnCloseCart'); 
  const btnCheckout = document.getElementById('btnCheckout');  

  const orderBox = document.getElementById('orderBox');  
  const orderForm = document.getElementById('orderForm');
  const phone = document.getElementById('phone');      
  const phErr = document.getElementById('phErr');       
  const cancel = document.getElementById('cancel');     

  const doneBox = document.getElementById('doneBox');  
  const doneClose = document.getElementById('doneClose');

  const toast = document.getElementById('toast');

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(SKEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveCart(arr) {
    localStorage.setItem(SKEY, JSON.stringify(arr));
  }

  let _tTimer = null;
  function showToast(txt, ms = 1400) {
    toast.textContent = txt;
    toast.classList.remove('hidden');
    if (_tTimer) clearTimeout(_tTimer);
    _tTimer = setTimeout(() => toast.classList.add('hidden'), ms);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }

  function redraw() {
    const cart = loadCart();
    list.innerHTML = ''; 
    let total = 0;

    cart.forEach(item => {
      total += item.p * item.q;
      const li = document.createElement('li');
      li.dataset.sku = item.s; 
      li.innerHTML = `
        <div class="meta">
          <strong>${esc(item.n)}</strong>
        </div>
        <div class="right">
          <button class="minus" data-s="${item.s}" aria-label="minus">-</button>
          <span class="qty">${item.q}</span>
          <button class="plus" data-s="${item.s}" aria-label="plus">+</button>
          <span style="width:10px"></span>
          <span class="line-sum">${(item.p * item.q).toLocaleString()}</span> ₽
          <button class="rm" data-s="${item.s}" aria-label="rm">×</button>
        </div>
      `;
      list.appendChild(li);
    });

    const count = cart.reduce((acc, it) => acc + it.q, 0);
    cnt.textContent = count;
    sumEl.textContent = total.toLocaleString();

    document.querySelectorAll('.card').forEach(card => {
      const sku = card.dataset.sku;
      syncCardControls(sku);
    });
  }

  function syncCardControls(sku) {
    const cart = loadCart();
    const card = document.querySelector(`.card[data-sku="${sku}"]`);
    if (!card) return;
    const bag = cart.find(i => i.s === sku);
    const old = card.querySelector('.qty-wrap');
    if (old) old.remove();

    const btn = card.querySelector('.toCart');
    if (bag && bag.q > 0) {
      btn.style.display = 'none';
      const wrap = document.createElement('div');
      wrap.className = 'qty-wrap';
      wrap.innerHTML = `<button class="c-minus">-</button><span class="c-q">${bag.q}</span><button class="c-plus">+</button>`;
      card.querySelector('.card-actions').appendChild(wrap);

      wrap.querySelector('.c-plus').addEventListener('click', () => {
        bag.q += 1;
        saveCart(cart);
        redraw();
      });
      wrap.querySelector('.c-minus').addEventListener('click', () => {
        bag.q -= 1;
        if (bag.q <= 0) {
          const idx = cart.findIndex(x => x.s === sku);
          cart.splice(idx,1);
        }
        saveCart(cart);
        redraw();
      });
    } else {
      btn.style.display = 'inline-block';
    }
  }

  document.querySelectorAll('.toCart').forEach(b => {
    b.addEventListener('click', (ev) => {
      const card = ev.target.closest('.card');
      const sku = card.dataset.sku;
      const price = Number(card.dataset.price) || 0;
      const name = card.querySelector('.name').textContent.trim();
      const cart = loadCart();
      const ex = cart.find(i => i.s === sku);
      if (ex) ex.q += 1;
      else cart.push({ s: sku, n: name, p: price, q: 1 });
      saveCart(cart);
      redraw();
      showToast('Товар добавлен в корзину');
    });
  });

  list.addEventListener('click', (e) => {
    const s = e.target.dataset.s;
    if (!s) return;
    let cart = loadCart();

    if (e.target.classList.contains('rm')) {
      cart = cart.filter(i => i.s !== s);
    } else if (e.target.classList.contains('plus')) {
      const it = cart.find(i => i.s === s);
      if (it) it.q += 1;
    } else if (e.target.classList.contains('minus')) {
      const it = cart.find(i => i.s === s);
      if (it) {
        it.q -= 1;
        if (it.q <= 0) cart = cart.filter(i => i.s !== s);
      }
    }
    saveCart(cart);
    redraw();
  });

  function open(el){ el.classList.remove('hidden'); }
  function close(el){ el.classList.add('hidden'); }

  btnCart.addEventListener('click', () => {
    redraw();
    open(cartBox);
  });
  btnCloseCart.addEventListener('click', () => close(cartBox));
  cartBox.querySelectorAll('.backdrop, .close').forEach(x => {
    x.addEventListener('click', () => close(cartBox));
  });

  btnCheckout.addEventListener('click', () => {
    const cart = loadCart();
    if (!cart.length) { showToast('Корзина пуста'); return; }
    close(cartBox);
    open(orderBox);
    setTimeout(() => orderForm.querySelector('input[name="f"]').focus(), 40);
  });

  cancel.addEventListener('click', () => close(orderBox));
  orderBox.querySelectorAll('.backdrop, .close').forEach(x => {
    x.addEventListener('click', () => close(orderBox));
  });

  if (phone) {
    phone.addEventListener('input', () => {
      let val = phone.value.replace(/[^\d+]/g, '');
      if (val.startsWith('+')) {
        val = '+' + val.slice(1).replace(/\+/g, '');
      } else {
        val = val.replace(/\+/g, '');
      }
      let digits = val.replace(/\D/g, '');
      if (digits.length > 15) digits = digits.slice(0,15);
      phone.value = val.startsWith('+') ? '+' + digits : digits;
      if (digits.length > 0 && digits.length < 10) phErr.textContent = 'Введите не менее 10 цифр';
      else phErr.textContent = '';
    });
  }

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(orderForm);
    if (!fd.get('f') || !fd.get('l') || !fd.get('addr') || !fd.get('phone')) {
      phErr.textContent = 'Заполните все поля';
      return;
    }
    const digits = (fd.get('phone') || '').replace(/\D/g, '');
    if (digits.length < 10) {
      phErr.textContent = 'Телефон некорректен';
      return;
    }
    saveCart([]);
    redraw();
    close(orderBox);
    close(cartBox);
    open(doneBox);
    btnCart.style.display = 'none';
  });

  doneClose.addEventListener('click', () => {
    close(doneBox);
    btnCart.style.display = ''; 
  });
  doneBox.addEventListener('click', (e) => {
    if (e.target === doneBox) {
      close(doneBox);
      btnCart.style.display = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close(cartBox); close(orderBox); close(doneBox);
      btnCart.style.display = '';
    }
  });
  redraw();
});
