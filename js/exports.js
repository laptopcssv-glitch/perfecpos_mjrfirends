// ── EXPORTS ──
function dlCSV(data,fname){
  const BOM='\uFEFF';
  const csv=BOM+data.map(r=>r.map(v=>{
    // Force text format for numeric-looking strings (claves)
    const s=String(v==null?'':v);
    const needsQuote=s.includes(',')||s.includes('"')||s.includes('\n');
    // Prefix with tab to force text in Excel for long numeric strings
    const isLongNum=/^\d{6,}$/.test(s);
    const val=isLongNum?'\t'+s:s;
    return needsQuote?'"'+val.replace(/"/g,'""')+'"':val;
  }).join(',')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download=fname;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

// ── BACKUP / RESTAURAR ──
function exportBackup(){
  const backup={
    inventario:dba('inventario'), historial:dba('historial'), movimientos:dba('movimientos'),
    usuarios:dba('usuarios'), devoluciones:dba('devoluciones'), cortes:dba('cortes'),
    fecha:nowStr(), version:'1.0'
  };
  const json=JSON.stringify(backup,null,2);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  a.download='backup_perfectpet_'+today()+'.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('💾 Backup descargado');
}

function importBackup(input){
  const file=input.files[0];
  if(!file)return;
  if(!confirm('⚠️ Esto reemplazará TODOS los datos actuales. ¿Continuar?')){input.value='';return;}
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const backup=JSON.parse(e.target.result);
      if(backup.inventario)db('inventario',backup.inventario);
      if(backup.historial)db('historial',backup.historial);
      if(backup.movimientos)db('movimientos',backup.movimientos);
      if(backup.usuarios)db('usuarios',backup.usuarios);
      if(backup.devoluciones)db('devoluciones',backup.devoluciones);
      if(backup.cortes)db('cortes',backup.cortes);
      toast('✅ Backup restaurado. Recargando...');
      setTimeout(()=>location.reload(),1500);
    }catch(err){
      toast('❌ Archivo de backup inválido');
    }
  };
  reader.readAsText(file);
  input.value='';
}

function exportInvCSV(){
  const inv=dba('inventario');
  const hdr=['Artículo','Clave','Descripción','Clasificación','Departamento','Línea','Marca','Unidad','Stock','Precio','Fecha'];
  const rows=inv.map(p=>[
    p.articulo||'', p.clave||p.code||'', p.descripcion||p.name||'',
    p.clasificacion||'', p.departamento||'', p.linea||'', p.marca||'',
    p.unidad||'', p.stock||0, p.precio||p.price||0, p.fecha||''
  ]);
  dlCSV([hdr,...rows],'inventario_perfectpet.csv');
  toast('📥 Inventario exportado');
}

function exportHistCSV(){
  const list=getHistFiltered();
  if(!list.length){toast('Sin datos para exportar');return;}
  const hdr=['ID','Seq','Fecha','Caja','Cajero','Clave','Descripción','Clasificación',
    'Precio Unit.','Desc% Prod','Cantidad','Total Producto',
    'Subtotal Venta','Desc. General','Swirvle','Promo','Total Venta',
    'Efectivo','Tarjeta','Transferencia','Cambio','Método'];
  const rows=[];
  list.forEach(v=>v.items.forEach(it=>rows.push([
    v.id, v.seqLabel||'', v.fecha, v.caja, v.cajero,
    it.clave||it.codigo||'', it.descripcion||it.nombre||it.name||'',
    it.clasificacion||'',
    it.precio||it.price||0, it.descPct||0, it.qty||it.cantidad||0, it.total||0,
    v.subtotal||0, v.descuento||0, v.swirvle||0, v.promo||0, v.total,
    v.efectivo||0, v.tarjeta||0, v.transferencia||0, v.cambio||0,
    (v.metodo||'').replace(/\n/g,' | ')
  ])));
  dlCSV([hdr,...rows],'historial_perfectpet.csv');
  toast('📥 Historial exportado');
}

function exportInvPDF(){
  const inv=dba('inventario');
  const q=(g('invSearch')||{value:''}).value.toLowerCase().trim();
  const list=q?inv.filter(p=>(p.descripcion||p.name||'').toLowerCase().includes(q)||(p.clave||p.code||'').toLowerCase().includes(q)):inv;
  const rows=list.map(p=>`<tr>
    <td>${p.articulo||''}</td>
    <td>${p.clave||p.code||''}</td>
    <td><b>${p.descripcion||p.name||''}</b></td>
    <td>${p.clasificacion||''}</td><td>${p.departamento||''}</td>
    <td>${p.linea||''}</td><td>${p.marca||''}</td><td>${p.unidad||''}</td>
    <td style="font-weight:700;color:${(p.stock||0)<=0?'#c62828':((p.stock||0)<=2?'#e65100':'#2e7d32')}">${p.stock||0}</td>
    <td style="font-weight:700">$${parseFloat(p.precio||p.price||0).toFixed(2)}</td>
    <td>${p.fecha||''}</td>
  </tr>`).join('');
  const win=window.open('','_blank','width=1200,height=700');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inventario Perfect Pet</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:16px;color:#222}
    h2{text-align:center;font-size:16px;margin-bottom:4px}
    p{text-align:center;color:#888;margin-bottom:12px;font-size:11px}
    table{width:100%;border-collapse:collapse}
    th{background:#1e1e2f;color:white;padding:6px 5px;text-align:left;font-size:10px}
    td{padding:5px;border-bottom:1px solid #eee;vertical-align:top}
    tr:nth-child(even){background:#f9f9f9}
    .btn{display:block;margin:16px auto;padding:10px 30px;background:#00bcd4;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700}
    @media print{.btn{display:none}@page{size:letter landscape;margin:10mm}}
  </style></head><body>
  <h2>🐾 Perfect Pet — Inventario Completo</h2>
  <p>Generado: ${nowStr()} &nbsp;|&nbsp; ${list.length} productos${q?' &nbsp;|&nbsp; Filtro: '+q:''}</p>
  <button class="btn" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
  <table>
    <thead><tr><th>Art.</th><th>Clave</th><th>Descripción</th><th>Clasif.</th><th>Depto.</th><th>Línea</th><th>Marca</th><th>Unidad</th><th>Stock</th><th>Precio</th><th>Fecha</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <button class="btn" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
  </body></html>`);
  win.document.close();
  toast('📄 PDF abierto en nueva pestaña');
}

