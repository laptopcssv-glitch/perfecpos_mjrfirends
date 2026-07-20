// ── SUGERENCIAS DE BÚSQUEDA ──
let _selectedProduct = null;

g('searchInput').addEventListener('input', function(){
  const q = this.value.toLowerCase().trim();
  const el = g('sug');
  if(!q){ el.classList.remove('open'); return; }
  const inv = dba('inventario');
  const res = [];
  for(let i=0; i<inv.length && res.length<14; i++){
    const p = inv[i];
    if((p.descripcion||p.name||'').toLowerCase().includes(q) ||
       (p.clave||p.code||'').toLowerCase().startsWith(q) ||
       String(p.articulo||'').includes(q) ||
       (p.marca||'').toLowerCase().includes(q)){
      res.push({p, i});
    }
  }
  if(!res.length){ el.classList.remove('open'); return; }
  el.innerHTML = res.map(({p, i}) => {
    const s = p.stock||0;
    const sc = s<=0?'szero':(s<=2?'slow':'sok');
    const precio = parseFloat(p.precio||p.price||0);
    return `<div class="sug-item" onclick="selectSugIdx(${i})">
      <span class="sug-name">${p.descripcion||p.name||''}</span>
      <span class="sug-right">
        <span class="sug-price">$${precio.toFixed(2)}</span>
        <span class="sug-stock ${sc}">[${s}]</span>
      </span>
    </div>`;
  }).join('');
  el.classList.add('open');
});

g('searchInput').addEventListener('keydown', e => {
  if(e.key==='Enter'){ e.preventDefault(); addProduct(); }
});
document.addEventListener('click', e => {
  if(!e.target.closest('.search-bar')) g('sug').classList.remove('open');
});

function selectSugIdx(idx){
  const p = dba('inventario')[idx];
  if(!p) return;
  _selectedProduct = p;
  g('searchInput').value = p.descripcion||p.name||'';
  g('sug').classList.remove('open');
  addProduct();
}

// ── VENTAS ──
function addProduct(){
  const q = g('searchInput').value.toLowerCase().trim();
  if(!q) return;
  let p = _selectedProduct;
  _selectedProduct = null;
  if(!p){
    const inv = dba('inventario');
    p = inv.find(x => {
      const c = (x.clave||x.code||'').toLowerCase();
      const d = (x.descripcion||x.name||'').toLowerCase();
      return c===q || d===q || d.includes(q);
    });
  }
  if(!p){ toast('❌ Producto no encontrado'); return; }
  const stk = p.stock||0;
  if(stk<=0){ toast('⛔ Sin stock: '+(p.descripcion||p.name)); return; }
  g('sug').classList.remove('open');
  const clave = p.clave||p.code||'';
  const tbody = g('saleTbody');
  for(const row of tbody.rows){
    if(row.dataset.clave===clave){
      const qi = row.cells[4].querySelector('input');
      const nq = parseInt(qi.value)+1;
      if(nq>stk){ toast('⚠️ Stock máximo: '+stk); return; }
      qi.value = nq; calcTotals();
      g('searchInput').value=''; g('searchInput').focus(); return;
    }
  }
  const precio = parseFloat(p.precio||p.price||0);
  const tr = document.createElement('tr');
  tr.dataset.clave = clave;
  tr.dataset.clasif = p.clasificacion||'Sin clasificación';
  tr.innerHTML = `
    <td style="font-size:11px;color:#aaa;max-width:80px;word-break:break-all">${clave}</td>
    <td style="text-align:left;font-weight:500">${p.descripcion||p.name||''}</td>
    <td><input type="number" value="${precio.toFixed(2)}" min="0" step="0.01"
      style="width:72px;padding:4px 5px;border:1px solid #e0e0e0;border-radius:5px;text-align:right;font-size:12px" onchange="calcTotals()"></td>
    <td><select style="padding:4px 5px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px" onchange="calcTotals()">
      <option value="0">0%</option><option value="5">5%</option><option value="10">10%</option>
      <option value="15">15%</option><option value="20">20%</option><option value="25">25%</option>
      <option value="30">30%</option><option value="50">50%</option>
    </select></td>
    <td><input type="number" value="1" min="1" max="${stk}"
      style="width:52px;padding:4px 5px;border:1px solid #e0e0e0;border-radius:5px;text-align:center;font-size:12px" onchange="calcTotals()"></td>
    <td class="rowT" style="font-weight:700;color:#1e1e2f">$${precio.toFixed(2)}</td>
    <td><button class="tdel" onclick="this.closest('tr').remove();calcTotals()">✕</button></td>`;
  tbody.appendChild(tr);
  g('saleEmpty').style.display = 'none';
  calcTotals(); g('searchInput').value=''; g('searchInput').focus();
}

function calcTotals(){
  const rows = [...g('saleTbody').rows];
  g('saleEmpty').style.display = rows.length?'none':'';
  let sub = 0;
  rows.forEach(r => {
    const pr = parseFloat(r.cells[2].querySelector('input').value)||0;
    const dp = parseFloat(r.cells[3].querySelector('select').value)||0;
    const qt = parseFloat(r.cells[4].querySelector('input').value)||0;
    const t = pr*qt*(1-dp/100);
    r.cells[5].textContent = '$'+t.toFixed(2); sub += t;
  });
  const dg = parseFloat(g('discSel').value)||0;
  const desc = sub*(dg/100);
  const efe = parseFloat(g('payEfe').value)||0;
  const tar = parseFloat(g('payTar').value)||0;
  const tra = parseFloat(g('payTra').value)||0;
  const swi = parseFloat(g('paySwi').value)||0;
  const pro = parseFloat(g('payPro').value)||0;
  const swiDesc = swi/10;
  const total = Math.max(0, sub-desc-swiDesc-pro);
  const ing = efe+tar+tra;
  g('sumSub').textContent = sub.toFixed(2);
  g('sumDesc').textContent = desc.toFixed(2);
  g('sumTotal').textContent = total.toFixed(2);
  g('sumIng').textContent = ing.toFixed(2);
  g('sumRest').textContent = Math.max(0,total-ing).toFixed(2);
  g('sumCambio').textContent = (ing>total?ing-total:0).toFixed(2);
}

function confirmSale(){
  const rows = [...g('saleTbody').rows];
  if(!rows.length){ toast('Sin productos'); return; }
  const total = parseFloat(g('sumTotal').textContent);
  const efe = parseFloat(g('payEfe').value)||0;
  const tar = parseFloat(g('payTar').value)||0;
  const tra = parseFloat(g('payTra').value)||0;
  const swi = parseFloat(g('paySwi').value)||0;
  const pro = parseFloat(g('payPro').value)||0;
  const swiDesc = swi/10;
  const desc = parseFloat(g('sumDesc').textContent);
  const sub = parseFloat(g('sumSub').textContent);
  const ing = efe+tar+tra;
  if(ing<total){ toast('⚠️ Monto insuficiente. Faltan $'+(total-ing).toFixed(2)); return; }
  const cambio = ing>total?ing-total:0;
  const items = rows.map(r => ({
    clave: r.dataset.clave,
    clasificacion: r.dataset.clasif||'Sin clasificación',
    descripcion: r.cells[1].textContent,
    precio: parseFloat(r.cells[2].querySelector('input').value),
    descPct: parseFloat(r.cells[3].querySelector('select').value)||0,
    qty: parseInt(r.cells[4].querySelector('input').value),
    total: parseFloat(r.cells[5].textContent.replace('$',''))
  }));
  const inv = dba('inventario');
  items.forEach(it => {
    const idx = inv.findIndex(p=>(p.clave||p.code)===it.clave);
    if(idx>=0) inv[idx].stock = Math.max(0,(inv[idx].stock||0)-it.qty);
  });
  db('inventario', inv);
  let metodo = '';
  if(efe>0) metodo += 'Efectivo: $'+efe.toFixed(2)+'\n';
  if(tar>0) metodo += 'Tarjeta: $'+tar.toFixed(2)+'\n';
  if(tra>0) metodo += 'Transferencia: $'+tra.toFixed(2)+'\n';
  if(swi>0) metodo += 'Swirvle: '+swi+'pts (-$'+swiDesc.toFixed(2)+')\n';
  if(pro>0) metodo += 'Promo: -$'+pro.toFixed(2)+'\n';
  metodo += 'TOTAL: $'+total.toFixed(2);
  const seq = nextId(S.caja);
  const venta = {
    id:'V-'+Date.now(), seq, seqLabel:'#'+String(seq).padStart(4,'0'),
    fecha:nowStr(), fechaISO:today(), caja:S.caja, cajero:S.user,
    items, subtotal:sub, descuento:desc, swirvle:swiDesc, promo:pro, total,
    efectivo:efe, tarjeta:tar, transferencia:tra, recibido:ing, cambio, metodo
  };
  const hist = dba('historial'); hist.push(venta); db('historial', hist);
  addMov({tipo:'venta', desc:'Venta '+venta.seqLabel+' '+venta.id+' — '+S.user,
    monto:total, efectivo:efe, tarjeta:tar, transferencia:tra,
    fechaISO:today(), fecha:venta.fecha, caja:S.caja, seq, seqLabel:venta.seqLabel});
  printTicket(venta);
  g('saleTbody').innerHTML=''; g('saleEmpty').style.display='';
  ['payEfe','payTar','payTra','paySwi','payPro'].forEach(id=>g(id).value=0);
  g('discSel').value='0'; calcTotals(); renderInventory();
  toast('✅ Venta '+venta.seqLabel+' completada — Cambio: $'+cambio.toFixed(2));
}

function printTicket(v){
  const pa = g('printArea');
  const itemRows = v.items.map(i => {
    const desc = i.descripcion||i.nombre||i.name||'';
    const qty = i.qty||i.cantidad||0;
    const dp = i.descPct||0;
    const tot = (i.total||0).toFixed(2);
    return `<tr>
      <td style="max-width:28mm;word-break:break-word">${desc}${dp?` <span style="font-size:8px">(-${dp}%)</span>`:''}</td>
      <td style="text-align:center;white-space:nowrap">${qty}</td>
      <td style="text-align:right;white-space:nowrap">$${tot}</td>
    </tr>`;
  }).join('');
  const metodoLines = v.metodo.split('\n').filter(l=>l&&!l.startsWith('TOTAL'));
  pa.innerHTML = `
    <div class="tk-title">Perfect Pet</div>
    <div class="tk-sub">AV. HIDALGO #65, AMECAMECA</div>
    <div class="tk-sub">@perfect_pet_amecameca</div>
    <hr class="tk-divider">
    <div class="tk-row"><span>Venta: <b>${v.seqLabel||v.id}</b></span><span>Caja ${v.caja}</span></div>
    <div class="tk-row"><span>${v.fecha}</span><span>${v.cajero}</span></div>
    <hr class="tk-divider">
    <table>
      <thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="tk-divider">
    ${v.descuento>0?`<div class="tk-row"><span>Subtotal:</span><span>$${v.subtotal.toFixed(2)}</span></div><div class="tk-row"><span>Descuento:</span><span>-$${v.descuento.toFixed(2)}</span></div>`:''}
    ${(v.swirvle||0)>0?`<div class="tk-row"><span>Swirvle:</span><span>-$${v.swirvle.toFixed(2)}</span></div>`:''}
    ${(v.promo||0)>0?`<div class="tk-row"><span>Promo:</span><span>-$${v.promo.toFixed(2)}</span></div>`:''}
    <div class="tk-total"><span>TOTAL</span><span>$${v.total.toFixed(2)}</span></div>
    <hr class="tk-divider">
    ${metodoLines.map(l=>`<div class="tk-row"><span>${l.trim()}</span></div>`).join('')}
    <div class="tk-row"><span>Recibido:</span><span>$${v.recibido.toFixed(2)}</span></div>
    <div class="tk-row"><span>Cambio:</span><span><b>$${v.cambio.toFixed(2)}</b></span></div>
    <hr class="tk-divider">
    <div class="tk-thanks">¡Gracias por su compra!</div>
    <div class="tk-note">Precios pueden variar segun condicion del pelo/piel.<br>Ectoparasitos: costo adicional.<br>Sin devoluciones despues de 24hrs.</div>`;
  pa.style.display='block';
  window.print();
  setTimeout(()=>{ pa.style.display='none'; pa.innerHTML=''; }, 800);
}
