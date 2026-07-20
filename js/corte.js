// ── CORTE DE CAJA ──
const DENOMS=[
  {v:1000,label:'$1,000',tipo:'Billete',e:'💵'},
  {v:500, label:'$500', tipo:'Billete',e:'💵'},
  {v:200, label:'$200', tipo:'Billete',e:'💵'},
  {v:100, label:'$100', tipo:'Billete',e:'💵'},
  {v:50,  label:'$50',  tipo:'Billete',e:'💵'},
  {v:20,  label:'$20',  tipo:'Billete',e:'💵'},
  {v:10,  label:'$10',  tipo:'Moneda', e:'🪙'},
  {v:5,   label:'$5',   tipo:'Moneda', e:'🪙'},
  {v:2,   label:'$2',   tipo:'Moneda', e:'🪙'},
  {v:1,   label:'$1',   tipo:'Moneda', e:'🪙'},
  {v:0.5, label:'50¢',  tipo:'Moneda', e:'🪙'},
];

function buildDenomGrid(){
  g('denomGrid').innerHTML=DENOMS.map((d,i)=>`
    <div class="dcard">
      <div class="demoji">${d.e}</div>
      <div class="dlabel">${d.label}</div>
      <div class="dtype">${d.tipo}</div>
      <input type="number" id="den${i}" value="0" min="0" oninput="calcCounter()">
      <div class="dsub" id="denT${i}"></div>
    </div>`).join('');
}

function calcCounter(){
  let total=0;
  DENOMS.forEach((d,i)=>{
    const q=parseInt(g('den'+i).value)||0;
    const sub=q*d.v; total+=sub;
    g('denT'+i).textContent=sub>0?'= $'+sub.toFixed(2):'';
  });
  g('counterTotal').textContent='$'+total.toFixed(2);
  const debeEl=g('cDebe');
  if(debeEl){
    const debe=parseFloat(debeEl.textContent.replace('$','').replace(',',''))||0;
    if(debe>0){
      const diff=total-debe;
      const el=g('counterDiff');
      el.textContent=(diff>=0?'+':'')+diff.toFixed(2);
      el.style.color=Math.abs(diff)<0.01?'#4caf50':(diff>0?'#ff9800':'#f44336');
      const w=g('counterWarn');
      if(Math.abs(diff)>0.01){
        w.style.display='';
        w.innerHTML=diff>0?`⚠️ Sobran $${diff.toFixed(2)}.`:`⚠️ Faltan $${Math.abs(diff).toFixed(2)}.`;
      } else {
        w.style.display='';w.innerHTML='✅ El conteo cuadra perfectamente.';
      }
    }
  }
}

function getCorteDay(){
  return g('corteFecha').value || today();
}

function renderCorte(){
  const caja=S.caja;
  const td=getCorteDay();
  const isToday=td===today();
  // Show/hide contador only for today
  g('contadorSection').style.display=isToday?'':'none';
  const movs=dba('movimientos').filter(m=>m.caja===caja);
  // Saldo inicial
  const saldoH=movs.filter(m=>m.tipo==='saldo_inicial'&&m.fechaISO===td);
  const lastS=saldoH.length?saldoH[saldoH.length-1]:null;
  const saldoIni=lastS?lastS.monto:0;
  g('cSaldoIni').textContent='$'+saldoIni.toFixed(2);
  g('cSaldoIniSub').textContent=lastS?'Registrado: '+lastS.fecha:'Sin apertura ese día';
  // Ventas
  const ventasH=movs.filter(m=>m.tipo==='venta'&&m.fechaISO===td);
  const tV=ventasH.reduce((s,m)=>s+m.monto,0);
  const tE=ventasH.reduce((s,m)=>s+(m.efectivo||0),0);
  const tT=ventasH.reduce((s,m)=>s+(m.tarjeta||0),0);
  const tTr=ventasH.reduce((s,m)=>s+(m.transferencia||0),0);
  g('cVentas').textContent='$'+tV.toFixed(2);
  g('cVentasSub').textContent=ventasH.length+' ventas';
  g('cDesglose').innerHTML=
    '💵 Efectivo: <strong>$'+tE.toFixed(2)+'</strong>&emsp;'+
    '💳 Tarjeta: <strong>$'+tT.toFixed(2)+'</strong>&emsp;'+
    '🏦 Transfer: <strong>$'+tTr.toFixed(2)+'</strong>';
  // Movimientos
  const movsH=movs.filter(m=>['ingreso','retiro'].includes(m.tipo)&&m.fechaISO===td);
  const netoM=movsH.reduce((s,m)=>s+m.monto,0);
  g('cMovNeto').textContent=(netoM>=0?'+':'')+netoM.toFixed(2);
  // Devoluciones
  const devsH=movs.filter(m=>m.tipo==='devolucion'&&m.fechaISO===td);
  const tDev=Math.abs(devsH.reduce((s,m)=>s+m.monto,0));
  g('cDevol').textContent='$'+tDev.toFixed(2);
  g('cDevolSub').textContent=devsH.length+' devoluciones';
  // Total recaudado
  const debe=saldoIni+tV+netoM-tDev;
  g('cDebe').textContent='$'+debe.toFixed(2);
  // Resumen por clasificación
  renderResumenClasif(td);
  if(isToday)calcCounter();
}

function renderResumenClasif(td){
  const hist=dba('historial').filter(v=>v.fechaISO===td&&v.caja===S.caja);
  const map={};
  hist.forEach(v=>v.items.forEach(it=>{
    const cl=it.clasificacion||'Sin clasificación';
    map[cl]=(map[cl]||0)+(it.total||0);
  }));
  const keys=Object.keys(map).sort();
  const total=Object.values(map).reduce((a,b)=>a+b,0);
  const tb=g('resumenClasifBody');
  if(!keys.length){
    tb.innerHTML='<tr><td colspan="2" style="text-align:center;color:#bbb;padding:12px">Sin ventas ese día</td></tr>';
    return;
  }
  tb.innerHTML=keys.map(k=>`
    <tr>
      <td>${k}</td>
      <td style="text-align:right;font-weight:600">$${map[k].toFixed(2)}</td>
    </tr>`).join('')+`
    <tr>
      <td><strong>Total Vendido</strong></td>
      <td style="text-align:right"><strong>$${total.toFixed(2)}</strong></td>
    </tr>`;
}

function openSaldoModal(){g('mSaldoAmt').value='';openModal('mSaldo');}
function saveSaldo(){
  const amt=parseFloat(g('mSaldoAmt').value)||0;
  if(amt<=0){toast('Monto inválido');return;}
  addMov({tipo:'saldo_inicial',desc:'Saldo inicial — '+S.user,monto:amt,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  closeModal('mSaldo');renderCorte();renderMov();toast('✅ Saldo inicial registrado');
}

let movTipo='ingreso';
function openMovModal(t){
  movTipo=t;
  g('mMovTitle').textContent=t==='ingreso'?'➕ Agregar a Caja':'➖ Retirar de Caja';
  g('mMovAmt').value='';g('mMovRazon').value='';openModal('mMov');
}
function saveMov(){
  const amt=parseFloat(g('mMovAmt').value)||0, razon=g('mMovRazon').value.trim();
  if(amt<=0){toast('Monto inválido');return;}
  if(!razon){toast('Ingresa una razón');return;}
  const monto=movTipo==='retiro'?-amt:amt;
  addMov({tipo:movTipo,desc:razon,monto,efectivo:monto,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  closeModal('mMov');renderCorte();renderMov();toast('✅ Movimiento registrado');
}

function realizarCorte(){
  const td=getCorteDay();
  if(td!==today()){toast('Solo puedes imprimir el corte del día actual');return;}
  const caja=S.caja;
  const movs=dba('movimientos').filter(m=>m.caja===caja);
  const saldoH=movs.filter(m=>m.tipo==='saldo_inicial'&&m.fechaISO===td);
  const lastS=saldoH.length?saldoH[saldoH.length-1]:null;
  const saldoIni=lastS?lastS.monto:0;
  const ventasH=movs.filter(m=>m.tipo==='venta'&&m.fechaISO===td);
  const tV=ventasH.reduce((s,m)=>s+m.monto,0);
  const tE=ventasH.reduce((s,m)=>s+(m.efectivo||0),0);
  const tT=ventasH.reduce((s,m)=>s+(m.tarjeta||0),0);
  const tTr=ventasH.reduce((s,m)=>s+(m.transferencia||0),0);
  const movsH=movs.filter(m=>['ingreso','retiro'].includes(m.tipo)&&m.fechaISO===td);
  const netoM=movsH.reduce((s,m)=>s+m.monto,0);
  const devsH=movs.filter(m=>m.tipo==='devolucion'&&m.fechaISO===td);
  const tDev=Math.abs(devsH.reduce((s,m)=>s+m.monto,0));
  const debe=saldoIni+tV+netoM-tDev;
  // Contador
  let contado=0; const dlines=[];
  DENOMS.forEach((d,i)=>{
    const q=parseInt(g('den'+i).value)||0;
    if(q>0){const sub=q*d.v;contado+=sub;dlines.push(d.label+' × '+q+' = $'+sub.toFixed(2));}
  });
  const diff=contado-debe;
  // Resumen por clasificación
  const hist=dba('historial').filter(v=>v.fechaISO===td&&v.caja===caja);
  const clasifMap={};
  hist.forEach(v=>v.items.forEach(it=>{
    const cl=it.clasificacion||'Sin clasificación';
    clasifMap[cl]=(clasifMap[cl]||0)+(it.total||0);
  }));
  const clasifTotal=Object.values(clasifMap).reduce((a,b)=>a+b,0);
  const clasifRows=Object.keys(clasifMap).sort().map(k=>`
    <tr><td>${k}</td><td align="right">$${clasifMap[k].toFixed(2)}</td></tr>`).join('');
  const todayMovs=movs.filter(m=>m.fechaISO===td);
  const pa=g('printArea');
  pa.innerHTML=`
    <h2>🐾 Perfect Pet — Corte de Caja</h2>
    <hr>
    <p><b>Fecha:</b> ${new Date(td+'T12:00:00').toLocaleDateString('es-MX')}</p>
    <p><b>Hora:</b> ${new Date().toLocaleTimeString('es-MX')}</p>
    <p><b>Caja:</b> ${caja} &nbsp;|&nbsp; <b>Realizado por:</b> ${S.user}</p>
    <hr>
    <h3>RESUMEN DEL DÍA</h3>
    <p>Saldo inicial: $${saldoIni.toFixed(2)}</p>
    <p>Total ventas: $${tV.toFixed(2)} (${ventasH.length} ventas)</p>
    <p>&nbsp;&nbsp;└ Efectivo: $${tE.toFixed(2)}</p>
    <p>&nbsp;&nbsp;└ Tarjeta: $${tT.toFixed(2)}</p>
    <p>&nbsp;&nbsp;└ Transferencia: $${tTr.toFixed(2)}</p>
    <p>Movimientos neto: ${netoM>=0?'+':''}$${netoM.toFixed(2)}</p>
    <p>Devoluciones: -$${tDev.toFixed(2)}</p>
    <hr>
    <h3>VENTAS POR CLASIFICACIÓN</h3>
    <table>
      <thead><tr><th>Clasificación</th><th align="right">Importe</th></tr></thead>
      <tbody>
        ${clasifRows}
        <tr><td><b>Total Vendido</b></td><td align="right"><b>$${clasifTotal.toFixed(2)}</b></td></tr>
      </tbody>
    </table>
    <hr>
    <p><b>TOTAL RECAUDADO: $${debe.toFixed(2)}</b></p>
    <hr>
    <h3>CONTEO FÍSICO</h3>
    ${dlines.length?dlines.map(l=>'<p>'+l+'</p>').join(''):'<p>Sin conteo registrado</p>'}
    <p><b>TOTAL CONTADO: $${contado.toFixed(2)}</b></p>
    <p><b>DIFERENCIA: ${diff>=0?'+':''}$${diff.toFixed(2)} ${Math.abs(diff)<0.01?'✅ CUADRA':(diff>0?'⚠️ SOBRA':'❌ FALTA')}</b></p>
    <hr>
    <h3>MOVIMIENTOS DEL DÍA (${todayMovs.length})</h3>
    <table>
      <thead><tr><th>ID</th><th>Tipo</th><th>Descripción</th><th align="right">Monto</th></tr></thead>
      <tbody>${todayMovs.map(m=>`<tr>
        <td>${m.seqLabel||''}</td>
        <td>${m.tipo.toUpperCase()}</td>
        <td>${m.desc}</td>
        <td align="right">${['inventario','ajuste'].includes(m.tipo)?'—':(m.monto>=0?'+':'')+'$'+Math.abs(m.monto).toFixed(2)}</td>
      </tr>`).join('')}</tbody>
    </table>
    <hr>
    <p style="text-align:center">Corte: ${nowStr()}</p>
    <p style="text-align:center">Sistema Perfect Pet</p>`;
  pa.style.display='block';window.print();
  setTimeout(()=>{pa.style.display='none';pa.innerHTML='';},800);
  addMov({tipo:'ajuste',
    desc:'Corte realizado por '+S.user+'. Contado: $'+contado.toFixed(2)+', Dif: '+(diff>=0?'+':'')+'$'+diff.toFixed(2),
    monto:0,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  // Guardar el corte como registro histórico
  const corteRecord={
    id:'C-'+Date.now(), fecha:nowStr(), fechaISO:td, caja, realizadoPor:S.user,
    saldoIni, tV, tE, tT, tTr, ventasCount:ventasH.length,
    netoM, tDev, debe, contado, diff, denomLines:dlines,
    clasifMap, clasifTotal, movimientos:todayMovs
  };
  const cortes=dba('cortes');
  cortes.push(corteRecord);
  db('cortes',cortes);
  toast('🖨 Corte impreso y registrado');
}

function renderCortesHistorial(){
  const cortes=dba('cortes').filter(c=>c.caja===S.caja);
  const df=g('corteHistDate')?.value;
  const list=df?cortes.filter(c=>c.fechaISO===df):cortes;
  const c=g('cortesHistContainer');
  if(!c)return;
  if(!list.length){c.innerHTML='<p class="empty">Sin cortes registrados</p>';return;}
  c.innerHTML=[...list].reverse().map(ct=>`
    <div class="hcard">
      <div class="hcard-hdr">
        <div>
          <strong>${ct.fecha}</strong>
          <span style="font-size:11px;color:#999;margin-left:8px">Caja ${ct.caja} — ${ct.realizadoPor}</span>
        </div>
        <button class="bc" style="padding:4px 10px;border:none;border-radius:6px;cursor:pointer;color:white;font-size:11px" onclick="reprintCorte('${ct.id}')">🖨 Reimprimir</button>
      </div>
      <div class="hcard-items">
        Ventas: $${ct.tV.toFixed(2)} (${ct.ventasCount}) &nbsp;|&nbsp;
        Contado: $${ct.contado.toFixed(2)} &nbsp;|&nbsp;
        Diferencia: <strong style="color:${Math.abs(ct.diff)<0.01?'#4caf50':(ct.diff>0?'#ff9800':'#f44336')}">${ct.diff>=0?'+':''}$${ct.diff.toFixed(2)}</strong>
      </div>
    </div>`).join('');
}

function reprintCorte(id){
  const ct=dba('cortes').find(x=>x.id===id);
  if(!ct)return;
  const clasifRows=Object.keys(ct.clasifMap||{}).sort().map(k=>`
    <tr><td>${k}</td><td align="right">$${ct.clasifMap[k].toFixed(2)}</td></tr>`).join('');
  const pa=g('printArea');
  pa.innerHTML=`
    <h2>🐾 Perfect Pet — Corte de Caja</h2>
    <hr>
    <p><b>Fecha:</b> ${new Date(ct.fechaISO+'T12:00:00').toLocaleDateString('es-MX')}</p>
    <p><b>Caja:</b> ${ct.caja} &nbsp;|&nbsp; <b>Realizado por:</b> ${ct.realizadoPor}</p>
    <hr>
    <h3>RESUMEN DEL DÍA</h3>
    <p>Saldo inicial: $${ct.saldoIni.toFixed(2)}</p>
    <p>Total ventas: $${ct.tV.toFixed(2)} (${ct.ventasCount} ventas)</p>
    <p>&nbsp;&nbsp;└ Efectivo: $${ct.tE.toFixed(2)}</p>
    <p>&nbsp;&nbsp;└ Tarjeta: $${ct.tT.toFixed(2)}</p>
    <p>&nbsp;&nbsp;└ Transferencia: $${ct.tTr.toFixed(2)}</p>
    <p>Movimientos neto: ${ct.netoM>=0?'+':''}$${ct.netoM.toFixed(2)}</p>
    <p>Devoluciones: -$${ct.tDev.toFixed(2)}</p>
    <hr>
    <h3>VENTAS POR CLASIFICACIÓN</h3>
    <table><thead><tr><th>Clasificación</th><th align="right">Importe</th></tr></thead>
    <tbody>${clasifRows}<tr><td><b>Total Vendido</b></td><td align="right"><b>$${ct.clasifTotal.toFixed(2)}</b></td></tr></tbody></table>
    <hr>
    <p><b>TOTAL RECAUDADO: $${ct.debe.toFixed(2)}</b></p>
    <hr>
    <h3>CONTEO FÍSICO</h3>
    ${(ct.denomLines||[]).map(l=>'<p>'+l+'</p>').join('')||'<p>Sin conteo</p>'}
    <p><b>TOTAL CONTADO: $${ct.contado.toFixed(2)}</b></p>
    <p><b>DIFERENCIA: ${ct.diff>=0?'+':''}$${ct.diff.toFixed(2)} ${Math.abs(ct.diff)<0.01?'✅ CUADRA':(ct.diff>0?'⚠️ SOBRA':'❌ FALTA')}</b></p>
    <hr>
    <h3>MOVIMIENTOS DEL DÍA (${(ct.movimientos||[]).length})</h3>
    <table><thead><tr><th>ID</th><th>Tipo</th><th>Descripción</th><th align="right">Monto</th></tr></thead>
    <tbody>${(ct.movimientos||[]).map(m=>`<tr>
      <td>${m.seqLabel||''}</td><td>${m.tipo.toUpperCase()}</td><td>${m.desc}</td>
      <td align="right">${['inventario','ajuste'].includes(m.tipo)?'—':(m.monto>=0?'+':'')+'$'+Math.abs(m.monto).toFixed(2)}</td>
    </tr>`).join('')}</tbody></table>
    <hr>
    <p style="text-align:center">Reimpreso: ${nowStr()}</p>
    <p style="text-align:center">Sistema Perfect Pet</p>`;
  pa.style.display='block';window.print();
  setTimeout(()=>{pa.style.display='none';pa.innerHTML='';},800);
}

