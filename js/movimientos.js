// ── MOVIMIENTOS ──
function addMov(m){
  const movs=dba('movimientos');
  // ID consecutivo global por caja
  const key='seq_mov_caja_'+m.caja;
  const seqN=(db(key)||0)+1;
  db(key,seqN);
  m.seqN=seqN;
  m.seqLabel='#'+String(seqN).padStart(4,'0');
  movs.push(m);
  db('movimientos',movs);
}

function renderMov(){
  const caja=S.caja;
  let all=dba('movimientos').filter(m=>m.caja===caja);
  const df=g('movDate').value;
  const sq=(g('movSearch')?.value||'').toLowerCase().trim();
  if(df)all=all.filter(m=>m.fechaISO===df);
  if(sq)all=all.filter(m=>(m.seqLabel||'').toLowerCase().includes(sq));
  const list=all;
  const colors={venta:'#00bcd4',ingreso:'#4caf50',retiro:'#f44336',devolucion:'#ff9800',inventario:'#9c27b0',ajuste:'#607d8b',saldo_inicial:'#2196f3'};
  const icons={venta:'🧾',ingreso:'➕',retiro:'➖',devolucion:'↩️',inventario:'📦',ajuste:'⚙️',saldo_inicial:'💵'};
  g('movRes').textContent=list.length?list.length+' movimientos':'';
  const c=g('movContainer');
  if(!list.length){c.innerHTML='<p class="empty">Sin movimientos en este período</p>';return;}
  c.innerHTML=[...list].reverse().map(m=>{
    const neutral=['inventario','ajuste','saldo_inicial'].includes(m.tipo);
    const cls=neutral?'neu':(m.monto>=0?'pos':'neg');
    const amt=neutral?'—':(m.monto>=0?'+':'')+' $'+Math.abs(m.monto).toFixed(2);
    return `<div class="mitem" style="border-left-color:${colors[m.tipo]||'#ddd'}">
      <div>
        <div class="mtype" style="color:${colors[m.tipo]||'#333'}">
          <span class="idbadge" style="background:#e3f2fd;color:#1565c0">${m.seqLabel||''}</span>
          ${icons[m.tipo]||'•'} ${m.tipo.replace('_',' ').toUpperCase()}
        </div>
        <div class="mdesc">${m.desc}</div>
        <div class="mdate">${m.fecha}</div>
      </div>
      <div class="mamount ${cls}">${amt}</div>
    </div>`;
  }).join('');
}

