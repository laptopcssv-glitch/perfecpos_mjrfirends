// ── INVENTARIO ──
let invEditIdx=-1, stockEditIdx=-1;

function uniq(field){
  return [...new Set(dba('inventario').map(p=>(p[field]||'').trim()).filter(Boolean))].sort();
}
function fillSel(id,vals,cur){
  const s=g(id);
  s.innerHTML='<option value="">— Seleccionar —</option>'+
    vals.map(v=>`<option value="${v}"${v===cur?' selected':''}>${v}</option>`).join('')+
    '<option value="__new__">➕ Agregar nuevo...</option>';
}
function chkNew(selId,inpId){
  const v=g(selId).value;
  g(inpId).style.display=v==='__new__'?'':'none';
  if(v==='__new__')g(inpId).focus();
}
function getVal(selId,inpId){
  return g(selId).value==='__new__'?g(inpId).value.trim():g(selId).value;
}

// Show/hide caducidad field based on clasificacion
function toggleCaducidad(){
  const clasif=(getVal('mIClasif','mIClasifNew')||'').toUpperCase();
  const esMed=clasif.includes('CLÍNICA')||clasif.includes('CLINICA')||clasif.includes('MEDIC')||clasif.includes('FARMAC');
  g('caducidadRow').style.display=esMed?'':'none';
  if(!esMed) g('mICaducidad').value='';
}

function renderInventory(){
  const inv=dba('inventario');
  const q=(g('invSearch')||{value:''}).value.toLowerCase().trim();
  const list=q?inv.filter(p=>
    (p.descripcion||p.name||'').toLowerCase().includes(q)||
    (p.clave||p.code||'').toLowerCase().includes(q)||
    (p.marca||'').toLowerCase().includes(q)||
    (p.departamento||'').toLowerCase().includes(q)||
    String(p.articulo||'').includes(q)
  ):inv;
  if(g('invCount'))g('invCount').textContent=`(${list.length} de ${inv.length})`;
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const warn30=new Date(hoy); warn30.setDate(warn30.getDate()+30);
  g('invTbody').innerHTML=list.map(p=>{
    const ri=inv.indexOf(p);
    const s=p.stock||0;
    const sc=s<=0?'szero2':(s<=2?'slow2':'sok2');
    const sw=s<=0?'⛔ 0':(s<=2?'⚠️ '+s:String(s));
    // Caducidad badge
    let cadBadge='';
    if(p.caducidad){
      const cadDate=new Date(p.caducidad+'T12:00:00');
      if(cadDate<hoy) cadBadge=`<span style="background:#f44336;color:white;font-size:10px;padding:1px 5px;border-radius:3px;margin-left:4px">VENCIDO</span>`;
      else if(cadDate<=warn30) cadBadge=`<span style="background:#ff9800;color:white;font-size:10px;padding:1px 5px;border-radius:3px;margin-left:4px">Por vencer</span>`;
    }
    let btns=`<button class="tstock" onclick="openStockModal(${ri})" title="Stock">📦</button> <button class="tedit" onclick="openInvModal(${ri})" title="Editar">✏️</button> <button style="background:#3f51b5;color:white;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-size:11px" onclick="printBarcodeDirect(${ri})" title="Imprimir código">🔢</button>`;
    if(S.role==='admin')btns+=` <button class="tdel" onclick="delProduct(${ri})" title="Eliminar">🗑</button>`;
    return `<tr>
      <td>${p.articulo||''}</td>
      <td style="font-size:11px;max-width:90px;word-break:break-all">${p.clave||p.code||''}</td>
      <td style="text-align:left;font-weight:500">${p.descripcion||p.name||''}${cadBadge}</td>
      <td style="font-size:11px">${p.clasificacion||''}</td>
      <td style="font-size:11px">${p.departamento||''}</td>
      <td style="font-size:11px">${p.linea||''}</td>
      <td style="font-size:11px">${p.marca||''}</td>
      <td style="font-size:11px">${p.unidad||''}</td>
      <td class="${sc}">${sw}</td>
      <td style="font-weight:700">$${parseFloat(p.precio||p.price||0).toFixed(2)}</td>
      <td style="font-size:11px;color:#bbb">${p.caducidad||''}</td>
      <td style="font-size:11px;color:#bbb">${p.fecha||''}</td>
      <td style="white-space:nowrap">${btns}</td>
    </tr>`;
  }).join('');
}

function openInvModal(idx){
  invEditIdx=idx;
  const fields=['clasificacion','departamento','linea','marca','unidad'];
  const sels=['mIClasif','mIDepto','mILinea','mIMarca','mIUnidad'];
  const news=['mIClasifNew','mIDeptoNew','mILineaNew','mIMarcaNew','mIUnidadNew'];
  fields.forEach((f,i)=>{fillSel(sels[i],uniq(f),'');g(news[i]).style.display='none';g(news[i]).value='';});
  if(idx===-1){
    g('mInvTitle').textContent='Agregar Producto';
    ['mIArt','mIClave','mIDesc','mIStock','mIPrecio','mICaducidad'].forEach(id=>g(id).value='');
    g('barcodePreviewBox').style.display='none';
    g('caducidadRow').style.display='none';
  } else {
    g('mInvTitle').textContent='Editar Producto';
    const p=dba('inventario')[idx];
    g('mIArt').value=p.articulo||'';
    g('mIClave').value=p.clave||p.code||'';
    g('mIDesc').value=p.descripcion||p.name||'';
    g('mIStock').value=p.stock||0;
    g('mIPrecio').value=p.precio||p.price||'';
    g('mICaducidad').value=p.caducidad||'';
    fields.forEach((f,i)=>{fillSel(sels[i],uniq(f),p[f]||'');g(news[i]).style.display='none';});
    setTimeout(()=>{previewBarcode();toggleCaducidad();},50);
  }
  openModal('mInv');
}

function saveInvProduct(){
  const clave=g('mIClave').value.trim(), desc=g('mIDesc').value.trim(), precio=g('mIPrecio').value.trim();
  if(!clave||!desc||!precio){toast('Clave, descripción y precio son requeridos');return;}
  const inv=dba('inventario');
  const prod={
    articulo:g('mIArt').value.trim(), clave, descripcion:desc,
    clasificacion:getVal('mIClasif','mIClasifNew'),
    departamento:getVal('mIDepto','mIDeptoNew'),
    linea:getVal('mILinea','mILineaNew'),
    marca:getVal('mIMarca','mIMarcaNew'),
    unidad:getVal('mIUnidad','mIUnidadNew'),
    stock:parseInt(g('mIStock').value)||0,
    precio:parseFloat(precio),
    caducidad:g('mICaducidad').value||'',
    fecha:new Date().toLocaleDateString('es-MX')
  };
  const isEdit=invEditIdx!==-1;
  if(isEdit)inv[invEditIdx]=prod; else inv.push(prod);
  db('inventario',inv);
  addMov({tipo:'inventario',desc:(isEdit?'Editado':'Agregado')+': '+desc,
    monto:0,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  renderInventory();closeModal('mInv');toast(isEdit?'✅ Actualizado':'✅ Producto agregado');
}

function delProduct(idx){
  if(S.role!=='admin'){toast('Sin permisos');return;}
  const inv=dba('inventario');
  if(!confirm('¿Eliminar "'+( inv[idx].descripcion||inv[idx].name)+'"?'))return;
  addMov({tipo:'inventario',desc:'Eliminado: '+(inv[idx].descripcion||inv[idx].name),
    monto:0,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  inv.splice(idx,1);db('inventario',inv);renderInventory();toast('🗑 Eliminado');
}

function openStockModal(idx){
  stockEditIdx=idx;
  const p=dba('inventario')[idx];
  g('mStockName').textContent=(p.descripcion||p.name||'')+'  —  Stock actual: '+(p.stock||0)+' uds';
  g('mStockQty').value='';g('mStockRazon').value='';g('mStockOp').value='add';
  openModal('mStock');
}
function saveStock(){
  const op=g('mStockOp').value, qty=parseInt(g('mStockQty').value)||0, razon=g('mStockRazon').value.trim();
  if(qty<=0){toast('Cantidad inválida');return;}
  if(op==='sub'&&!razon){toast('Ingresa una razón para restar stock');return;}
  const inv=dba('inventario'), p=inv[stockEditIdx], prev=p.stock||0;
  if(op==='sub'&&qty>prev){toast('No puedes restar más del stock actual ('+prev+')');return;}
  inv[stockEditIdx].stock=op==='add'?prev+qty:prev-qty;
  db('inventario',inv);
  addMov({tipo:'inventario',
    desc:(op==='add'?'Stock +'+qty:' Stock -'+qty+' ('+razon+')')+': '+(p.descripcion||p.name),
    monto:0,fechaISO:today(),fecha:nowStr(),caja:S.caja});
  renderInventory();closeModal('mStock');toast(op==='add'?'✅ Stock agregado':'✅ Stock ajustado');
}

function checkStockAlerts(){
  const inv=dba('inventario');
  const low=inv.filter(p=>(p.stock||0)<=2);
  if(low.length) toast('⚠️ '+low.length+' producto(s) con stock bajo o agotado',5000);
  // Caducidad alerts
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const warn30=new Date(hoy); warn30.setDate(warn30.getDate()+30);
  const vencidos=inv.filter(p=>p.caducidad&&new Date(p.caducidad+'T12:00:00')<hoy);
  const porVencer=inv.filter(p=>p.caducidad&&new Date(p.caducidad+'T12:00:00')>=hoy&&new Date(p.caducidad+'T12:00:00')<=warn30);
  if(vencidos.length) setTimeout(()=>toast('🔴 '+vencidos.length+' producto(s) VENCIDO(S)',6000),2000);
  if(porVencer.length) setTimeout(()=>toast('🟡 '+porVencer.length+' producto(s) por vencer en 30 días',6000),4000);
  if(typeof updateNotifBadge==='function') setTimeout(updateNotifBadge,500);
}

// ── GENERADOR EAN-13 ──
function generarEAN13(){
  const existentes=new Set(dba('inventario').map(p=>p.clave||p.code||''));
  let intento=0;
  while(intento<200){
    let base='750';
    for(let i=0;i<9;i++)base+=Math.floor(Math.random()*10);
    let suma=0;
    for(let i=0;i<12;i++){const d=parseInt(base[i]);suma+=(i%2===0)?d:d*3;}
    const ean=base+((10-(suma%10))%10);
    if(!existentes.has(ean))return ean;
    intento++;
  }
  return 'ERR-'+Date.now();
}

function previewBarcode(){
  const clave=g('mIClave').value.trim();
  const box=g('barcodePreviewBox');
  if(!clave||!/^\d{8,13}$/.test(clave)){box.style.display='none';return;}
  if(typeof JsBarcode==='undefined'){box.style.display='none';return;}
  try{
    JsBarcode('#barcodePreviewSvg',clave,{format:'EAN13',width:2,height:55,displayValue:true,fontSize:13,margin:6,background:'#f9f9f9'});
    box.style.display='';
  }catch(e){box.style.display='none';}
}

function printBarcodeLabel(){
  const clave=g('mIClave').value.trim();
  const desc=g('mIDesc').value.trim();
  const precio=g('mIPrecio').value.trim();
  if(!clave){toast('Genera o ingresa una clave primero');return;}
  const win=window.open('','_blank','width=420,height=320');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Etiqueta</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/bin/JsBarcode.all.min.js"><\/script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;padding:8px}
  .label{border:1px dashed #aaa;padding:8px 12px;text-align:center;width:60mm}
  .name{font-size:9px;font-weight:700;margin-bottom:4px;word-break:break-word}
  .price{font-size:13px;font-weight:700;margin-top:4px}
  svg{display:block;margin:0 auto;max-width:56mm}
  .btn{margin:14px auto;display:block;padding:9px 24px;background:#00bcd4;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700}
  @media print{.btn{display:none}@page{size:62mm 40mm;margin:1mm}}
</style></head><body>
<div class="label">
  ${desc?`<div class="name">${desc}</div>`:''}
  <svg id="bc"></svg>
  ${precio?`<div class="price">$${parseFloat(precio).toFixed(2)}</div>`:''}
</div>
<button class="btn" onclick="window.print()">🖨 Imprimir Etiqueta</button>
<script>window.onload=function(){JsBarcode('#bc','${clave}',{format:'EAN13',width:2,height:50,displayValue:true,fontSize:12,margin:4});};<\/script>
</body></html>`);
  win.document.close();
}

// Genera SVG de EAN-13 puro, sin librerías externas
function ean13SVG(code){
  // Tablas EAN-13
  const L={'0':'0001101','1':'0011001','2':'0010011','3':'0111101','4':'0100011',
           '5':'0110001','6':'0101111','7':'0111011','8':'0110111','9':'0001011'};
  const G={'0':'0100111','1':'0110011','2':'0011011','3':'0100001','4':'0011101',
           '5':'0111001','6':'0000101','7':'0010001','8':'0001001','9':'0010111'};
  const R={'0':'1110010','1':'1100110','2':'1101100','3':'1000010','4':'1011100',
           '5':'1001110','6':'1010000','7':'1000100','8':'1001000','9':'1110100'};
  const PARITY=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL',
                'LGLGLG','LGLGGL','LGGLGL'];
  if(code.length!==13) return '';
  const first=parseInt(code[0]);
  const parity=PARITY[first];
  const W=2, H=60, TH=8, GUARD=5;
  const SW=95*W, SH=H+TH+4;
  let bars=[];
  // Start guard 101
  bars.push({x:0,w:W,full:true});
  bars.push({x:W,w:W,full:false});
  bars.push({x:2*W,w:W,full:true});
  // Left 6 digits
  let x=3*W;
  for(let i=1;i<=6;i++){
    const d=code[i];
    const enc=parity[i-1]==='G'?G[d]:L[d];
    for(let b=0;b<7;b++){
      if(enc[b]==='1') bars.push({x:x+b*W,w:W,full:false});
    }
    x+=7*W;
  }
  // Middle guard 01010
  bars.push({x,w:W,full:true});
  bars.push({x:x+2*W,w:W,full:true});
  x+=5*W;
  // Right 6 digits
  for(let i=7;i<=12;i++){
    const d=code[i];
    const enc=R[d];
    for(let b=0;b<7;b++){
      if(enc[b]==='1') bars.push({x:x+b*W,w:W,full:false});
    }
    x+=7*W;
  }
  // End guard 101
  bars.push({x,w:W,full:true});
  bars.push({x:x+2*W,w:W,full:true});
  // Build SVG
  const rects=bars.map(b=>{
    const bh=b.full?H+GUARD:H;
    return `<rect x="${b.x+6}" y="4" width="${b.w}" height="${bh}" fill="black"/>`;
  }).join('');
  // Digit labels
  const digits=`
    <text x="3" y="${H+TH+2}" font-size="9" font-family="Arial" text-anchor="middle">${code[0]}</text>
    <text x="${6+3*W+3*7*W}" y="${H+TH+2}" font-size="9" font-family="Arial" text-anchor="middle">${code.slice(1,7)}</text>
    <text x="${6+3*W+6*7*W+5*W+3*7*W}" y="${H+TH+2}" font-size="9" font-family="Arial" text-anchor="middle">${code.slice(7,13)}</text>
  `;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SW+12}" height="${SH}" viewBox="0 0 ${SW+12} ${SH}">
    <rect width="100%" height="100%" fill="white"/>
    ${rects}${digits}
  </svg>`;
}

function printBarcodeDirect(idx){
  const p=dba('inventario')[idx];
  if(!p){toast('Producto no encontrado');return;}
  const clave=p.clave||p.code||'';
  if(!clave||!/^\d{13}$/.test(clave)){
    toast('⚠️ Este producto necesita un código EAN-13 (13 dígitos numéricos)');return;
  }
  const desc=p.descripcion||p.name||'';
  const precio=parseFloat(p.precio||p.price||0);
  const svgCode=ean13SVG(clave);
  const win=window.open('','_blank','width=480,height=400');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Etiqueta - ${desc}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#f0f0f0;display:flex;flex-direction:column;
       align-items:center;justify-content:center;min-height:100vh;padding:16px;gap:14px}
  .label{background:white;border:1px dashed #bbb;padding:10px 14px;text-align:center;
         width:62mm;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .name{font-size:9px;font-weight:700;margin-bottom:6px;word-break:break-word;
        line-height:1.4;text-transform:uppercase}
  .price{font-size:14px;font-weight:700;margin-top:4px;color:#1e1e2f}
  svg{display:block;margin:0 auto;width:100%;height:auto}
  .controls{background:white;border-radius:10px;padding:12px 18px;display:flex;gap:12px;
            align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .lbl{font-size:13px;color:#555;display:flex;align-items:center;gap:8px}
  input[type=number]{width:60px;padding:6px;border:1px solid #ddd;border-radius:6px;
                     text-align:center;font-size:15px;font-weight:700;outline:none}
  .btn{padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;
       font-weight:700;background:#00bcd4;color:white}
  .btn:hover{background:#0097a7}
  @media print{
    body{background:white;padding:0;display:block}
    .controls{display:none!important}
    .label{border:none;box-shadow:none;padding:1mm;width:60mm;page-break-inside:avoid}
    @page{size:62mm auto;margin:1mm}
  }
</style></head><body>
<div class="label" id="lbl">
  ${desc?`<div class="name">${desc}</div>`:''}
  ${svgCode}
  <div class="price">$${precio.toFixed(2)}</div>
</div>
<div class="controls">
  <span class="lbl">Copias:
    <input type="number" id="copies" value="1" min="1" max="100">
  </span>
  <button class="btn" onclick="doPrint()">🖨 Imprimir</button>
</div>
<script>
function doPrint(){
  var n=parseInt(document.getElementById('copies').value)||1;
  var lbl=document.getElementById('lbl').innerHTML;
  var body=document.body;
  body.innerHTML='';
  for(var i=0;i<n;i++){
    var d=document.createElement('div');
    d.className='label';
    if(i<n-1)d.style.pageBreakAfter='always';
    d.innerHTML=lbl;
    body.appendChild(d);
  }
  setTimeout(function(){window.print();},150);
}
<\/script>
</body></html>`);
  win.document.close();
}
