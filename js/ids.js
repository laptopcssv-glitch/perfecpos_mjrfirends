// ── ID CONSECUTIVO POR CAJA ──
function nextId(caja){
  const key='seq_caja_'+caja;
  const n=(db(key)||0)+1;
  db(key,n);
  return n;
}

