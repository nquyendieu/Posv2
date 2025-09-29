// BlackTea POS v8 final - full logic with payment preview, discount, history filter and expandable history items

const KEY_MENU = 'BT8_MENU';
const KEY_CATS = 'BT8_CATS';
const KEY_TABLES = 'BT8_TABLES';
const KEY_HISTORY = 'BT8_HISTORY';
const KEY_GUEST = 'BT8_GUEST_CNT';

let MENU = JSON.parse(localStorage.getItem(KEY_MENU)) || [
  { id: 1, name: "Cà phê sữa", price: 25000, cat: "Cà phê" },
  { id: 2, name: "Cà phê đen", price: 20000, cat: "Cà phê" },
  { id: 3, name: "Trà đào", price: 30000, cat: "Trà" },
  { id: 4, name: "Nước ép cam", price: 28000, cat: "Nước ép" },
  { id: 5, name: "Sinh tố xoài", price: 35000, cat: "Sinh tố" }
];

let CATEGORIES = JSON.parse(localStorage.getItem(KEY_CATS)) || ["Tất cả","Cà phê","Trà","Nước ép","Sinh tố"];
let TABLES = JSON.parse(localStorage.getItem(KEY_TABLES)) || [];
let HISTORY = JSON.parse(localStorage.getItem(KEY_HISTORY)) || [];
let GUEST_CNT = parseInt(localStorage.getItem(KEY_GUEST) || '0');

let currentTable = null;
let createdFromMain = false;
let activeCategory = 'Tất cả';

// helpers
function $(id){ return document.getElementById(id); }
function fmtV(n){ return n.toLocaleString('vi-VN'); }
function nowStr(){ return new Date().toLocaleString('vi-VN'); }
function isoDateKey(t){ const d = new Date(t); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+day; }
function displayDateFromISO(iso){ const parts = iso.split('-'); return parts[2] + '/' + parts[1] + '/' + parts[0]; }
function saveAll(){ localStorage.setItem(KEY_MENU, JSON.stringify(MENU)); localStorage.setItem(KEY_CATS, JSON.stringify(CATEGORIES)); localStorage.setItem(KEY_TABLES, JSON.stringify(TABLES)); localStorage.setItem(KEY_HISTORY, JSON.stringify(HISTORY)); localStorage.setItem(KEY_GUEST, String(GUEST_CNT)); }

// render tables
function renderTables(){
  const div = $('tables'); div.innerHTML = '';
  if(!TABLES.length){ div.innerHTML = '<div class="small">Chưa có bàn nào</div>'; return; }
  TABLES.forEach(t=>{
    const card = document.createElement('div'); card.className='table-card';
    const info = document.createElement('div'); info.className='table-info';
    const name = document.createElement('div'); name.className='table-name'; name.innerText = t.name;
    info.appendChild(name);
    if(t.cart && t.cart.length){
      let qty=0, total=0; t.cart.forEach(it=>{ qty+=it.qty; total+=it.qty*it.price; });
      const meta = document.createElement('div'); meta.className='table-meta'; meta.innerText = qty + ' món • ' + fmtV(total) + ' VND';
      info.appendChild(meta);
    }
    card.appendChild(info);
    card.onclick = ()=> openTableFromMain(t.id);
    div.appendChild(card);
  });
}

// add guest
function addGuest(){
  GUEST_CNT += 1;
  const name = 'Khách vãng lai ' + GUEST_CNT;
  const id = Date.now();
  TABLES.push({ id, name, cart: [] });
  saveAll();
  createdFromMain = true;
  openTable(id);
}

// add named table
function addNamed(){
  const name = $('new-table-name').value.trim();
  if(!name){ alert('Nhập tên bàn'); return; }
  const id = Date.now();
  TABLES.push({ id, name, cart: [] });
  $('new-table-name').value = '';
  saveAll();
  createdFromMain = true;
  openTable(id);
}

// open from main
function openTableFromMain(id){ createdFromMain = false; openTable(id); }

function openTable(id){
  currentTable = TABLES.find(t=>t.id===id);
  if(!currentTable) return;
  $('table-screen').style.display = 'none';
  $('menu-screen').style.display = 'block';
  $('settings-screen').style.display = 'none';
  $('menu-settings-screen').style.display = 'none';
  $('printer-settings-screen').style.display = 'none';
  $('history-screen').style.display = 'none';
  $('payment-screen').style.display = 'none';
  $('table-title').innerText = currentTable.name;
  renderCategories();
  renderMenuList();
  renderCart();
  if(createdFromMain){
    $('primary-actions').style.display = 'flex';
    $('table-actions').style.display = 'none';
    $('menu-list').style.display = 'block';
  } else {
    $('primary-actions').style.display = 'none';
    $('table-actions').style.display = 'flex';
    $('menu-list').style.display = 'none';
  }
}

// back
function backToTables(){
  currentTable = null; createdFromMain = false;
  $('menu-screen').style.display = 'none';
  $('settings-screen').style.display = 'none';
  $('menu-settings-screen').style.display = 'none';
  $('printer-settings-screen').style.display = 'none';
  $('history-screen').style.display = 'none';
  $('payment-screen').style.display = 'none';
  $('table-screen').style.display = 'block';
  renderTables();
  saveAll();
}

// categories
function renderCategories(){
  const bar = $('category-bar'); bar.innerHTML = '';
  CATEGORIES.forEach(cat=>{
    const b = document.createElement('button'); b.className='category-btn' + (cat===activeCategory ? ' active' : '');
    b.innerText = cat;
    b.onclick = ()=>{ activeCategory = cat; renderMenuList(); renderCategories(); };
    bar.appendChild(b);
  });
}

// menu list
function renderMenuList(){
  const list = $('menu-list'); list.innerHTML = '';
  const items = MENU.filter(m=> activeCategory==='Tất cả' ? true : m.cat===activeCategory);
  items.forEach(item=>{
    const row = document.createElement('div'); row.className='menu-row';
    const left = document.createElement('div'); left.className='menu-left';
    left.innerHTML = '<div class="menu-name">'+item.name+'</div><div class="menu-price">'+fmtV(item.price)+' VND</div>';
    const controls = document.createElement('div'); controls.className='qty-controls';
    const minus = document.createElement('button'); minus.className='btn btn-secondary'; minus.innerText='-'; minus.onclick=(e)=>{ e.stopPropagation(); changeQty(item.id,-1); };
    const qty = document.createElement('span'); qty.id='qty-'+item.id; qty.innerText = getQty(item.id);
    const plus = document.createElement('button'); plus.className='btn btn-secondary'; plus.innerText='+'; plus.onclick=(e)=>{ e.stopPropagation(); changeQty(item.id,1); };
    controls.appendChild(minus); controls.appendChild(qty); controls.appendChild(plus);
    row.appendChild(left); row.appendChild(controls);
    list.appendChild(row);
  });
}

function getQty(id){ if(!currentTable) return 0; const it = currentTable.cart.find(c=>c.id===id); return it ? it.qty : 0; }

function changeQty(id,delta){ if(!currentTable) return; const item = MENU.find(m=>m.id===id); if(!item) return; let it = currentTable.cart.find(c=>c.id===id); if(it){ it.qty += delta; if(it.qty<=0) currentTable.cart = currentTable.cart.filter(c=>c.id!==id); } else if(delta>0){ currentTable.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 }); } renderMenuList(); renderCart(); }

// cart
function renderCart(){ const ul = $('cart-list'); ul.innerHTML = ''; if(!currentTable || !currentTable.cart.length){ ul.innerHTML = '<div class="small">Chưa có món</div>'; $('total').innerText='0'; return; } let total=0; currentTable.cart.forEach(it=>{ total += it.price*it.qty; const li=document.createElement('li'); li.innerHTML = '<div><div style="font-weight:700">'+it.name+'</div><div class="small">'+fmtV(it.price)+' x '+it.qty+'</div></div><div style="font-weight:700">'+fmtV(it.price*it.qty)+'</div>'; ul.appendChild(li); }); $('total').innerText = fmtV(total); }

// primary actions (new table)
function cancelOrder(){ if(!currentTable) return; if(confirm('Hủy đơn?')){ currentTable.cart=[]; renderMenuList(); renderCart(); } }

function saveOrder(){ if(!currentTable) return; if(!currentTable.cart.length){ alert('Giỏ hàng trống!'); return; } TABLES = TABLES.map(t=> t.id===currentTable.id ? currentTable : t); saveAll(); alert('Đã lưu đơn'); backToTables(); }

// table actions
function addMore(){ if(!currentTable) return; $('menu-list').style.display='block'; createdFromMain = true; $('primary-actions').style.display = 'flex'; $('table-actions').style.display='none'; renderMenuList(); }

function payTable(){ if(!currentTable) return; if(!currentTable.cart.length){ alert('Chưa có món!'); return; } // open payment screen with bill preview
  $('menu-screen').style.display = 'none'; $('payment-screen').style.display = 'block';
  $('pay-table-name').innerText = currentTable.name;
  renderPaymentPreview();
}

// payment preview with discount input
function renderPaymentPreview(){
  const container = $('pay-bill'); container.innerHTML = '';
  if(!currentTable) return;
  let total = 0;
  const table = document.createElement('table'); table.className='payment-table';
  const thead = document.createElement('tr');
  thead.innerHTML = '<th>Tên</th><th style="text-align:right">SL</th><th style="text-align:right">Thành</th>';
  table.appendChild(thead);
  currentTable.cart.forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>'+it.name+'</td><td style="text-align:right">'+it.qty+'</td><td style="text-align:right">'+fmtV(it.price*it.qty)+'</td>';
    table.appendChild(tr);
    total += it.price*it.qty;
  });
  container.appendChild(table);
  // show subtotal and set final total
  const sub = document.createElement('div'); sub.style.marginTop='8px'; sub.innerText = 'Tạm tính: ' + fmtV(total) + ' VND';
  container.appendChild(sub);
  $('discount-input').value = '0';
  updateFinalTotal();
}

// compute final total based on discount input
function updateFinalTotal(){
  if(!currentTable) return;
  const subtotal = currentTable.cart.reduce((s,i)=> s + i.price*i.qty, 0);
  const raw = $('discount-input').value.trim();
  let discount = 0;
  if(!raw) discount = 0;
  else if(raw.endsWith('%')){ const pct = parseFloat(raw.slice(0,-1)); if(!isNaN(pct)) discount = subtotal * (pct/100); }
  else { const v = parseFloat(raw.replace(/[^0-9.-]/g,'')); if(!isNaN(v)) discount = v; }
  const final = Math.max(0, Math.round(subtotal - discount));
  $('pay-final-total').innerText = fmtV(final);
  return { subtotal, discount, final };
}

// close payment (back to table screen)
function closePayment(){ $('payment-screen').style.display='none'; $('menu-screen').style.display='block'; renderCart(); renderMenuList(); }

// confirm payment: save to history, print, remove table
function confirmPayment(){
  if(!currentTable) return;
  const { subtotal, discount, final } = updateFinalTotal();
  const rec = { table: currentTable.name, time: nowStr(), iso: isoDateKey(nowStr()), items: currentTable.cart.slice(), subtotal, discount, total: final };
  HISTORY.push(rec);
  saveAll();
  // print using same layout but include discount and final
  printFinalBill(rec);
  // remove table
  TABLES = TABLES.filter(t=> t.id !== currentTable.id);
  saveAll();
  // go back home
  $('payment-screen').style.display='none';
  backToTables();
}

// print final bill
function printFinalBill(rec){
  const paper = $('paper-size') ? $('paper-size').value : '58';
  const showName = $('print-name') ? $('print-name').checked : true;
  const win = window.open('','_blank');
  let html = '<html><head><meta charset="utf-8"><title>Hóa đơn</title></head><body>';
  html += '<div style="font-family:monospace;width:300px;">';
  if(showName) html += '<h2 style="text-align:center;margin:0">BlackTea</h2>';
  html += '<div style="border-top:1px dashed #000;margin-top:6px"></div>';
  html += '<div>Bàn: ' + rec.table + '</div>';
  html += '<div>Thời gian: ' + rec.time + '</div>';
  html += '<table style="width:100%;border-collapse:collapse;margin-top:6px">';
  rec.items.forEach(i=>{
    const name = i.name.length>20 ? i.name.substring(0,20)+'...' : i.name;
    html += '<tr><td style="padding:6px">'+name+'</td><td style="padding:6px;text-align:right">'+i.qty+'</td><td style="padding:6px;text-align:right">'+fmtV(i.price*i.qty)+'</td></tr>';
  });
  html += '</table>';
  html += '<div style="border-top:1px dashed #000;margin-top:6px"></div>';
  html += '<div>Tạm tính: ' + fmtV(rec.subtotal) + ' VND</div>';
  html += '<div>Chiết khấu: -' + fmtV(Math.round(rec.discount)) + ' VND</div>';
  html += '<div style="text-align:right;font-weight:800;margin-top:6px">TỔNG: ' + fmtV(rec.total) + ' VND</div>';
  html += '</div></body></html>';
  win.document.write(html); win.document.close();
  setTimeout(()=> win.print(), 500);
}

// Settings screens
function openSettings(){ $('table-screen').style.display='none'; $('menu-screen').style.display='none'; $('history-screen').style.display='none'; $('settings-screen').style.display='block'; }
function openMenuSettings(){ $('settings-screen').style.display='none'; $('menu-settings-screen').style.display='block'; renderCategoriesList(); renderMenuSettings(); populateCatSelect(); }
function openPrinterSettings(){ $('settings-screen').style.display='none'; $('printer-settings-screen').style.display='block'; populatePrinterSettings(); }

// menu settings
function renderCategoriesList(){ const ul=$('categories-list'); ul.innerHTML=''; CATEGORIES.forEach((c,i)=>{ const li=document.createElement('li'); li.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><div>'+c+'</div>' + (i>0? '<div><button class="btn btn-secondary" onclick="deleteCategory('+i+')">Xóa</button></div>':'') + '</div>'; ul.appendChild(li); }); }
function addCategory(){ const name = $('new-cat-name').value.trim(); if(!name) return; if(CATEGORIES.includes(name)){ alert('Đã tồn tại'); return; } CATEGORIES.push(name); $('new-cat-name').value=''; saveAll(); renderCategoriesList(); renderCategories(); populateCatSelect(); }
function deleteCategory(i){ if(confirm('Xóa danh mục? Món thuộc danh mục đó sẽ chuyển về Tất cả')){ const cat=CATEGORIES[i]; MENU = MENU.map(m=> m.cat===cat? {...m,cat:'Tất cả'}:m); CATEGORIES.splice(i,1); saveAll(); renderCategoriesList(); renderMenuSettings(); renderMenuList(); renderCategories(); populateCatSelect(); } }
function populateCatSelect(){ const sel=$('cat-select'); sel.innerHTML=''; CATEGORIES.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.innerText=c; sel.appendChild(o); }); if(!CATEGORIES.includes(activeCategory)) activeCategory='Tất cả'; }
function renderMenuSettings(){ const ul=$('menu-settings-list'); ul.innerHTML=''; MENU.forEach((m,i)=>{ const li=document.createElement('li'); li.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><div><b>'+m.name+'</b><div class="small">'+m.cat+' • '+fmtV(m.price)+'</div></div><div><button class="btn btn-secondary" onclick="deleteMenu('+i+')">Xóa</button></div></div>'; ul.appendChild(li); }); }
function addMenuItem(){ const name=$('new-item-name').value.trim(); const price=parseInt($('new-item-price').value); const cat=$('cat-select').value||'Tất cả'; if(!name||!price){ alert('Nhập tên và giá'); return; } MENU.push({ id: Date.now(), name, price, cat }); $('new-item-name').value=''; $('new-item-price').value=''; saveAll(); renderMenuSettings(); renderMenuList(); }
function deleteMenu(i){ if(confirm('Xóa món?')){ MENU.splice(i,1); saveAll(); renderMenuSettings(); renderMenuList(); } }
function populatePrinterSettings(){ if($('paper-size')) $('paper-size').value = localStorage.getItem('BT8_PAPER') || '58'; if($('print-name')) $('print-name').checked = (localStorage.getItem('BT8_PRINTNAME')||'true')==='true'; }

// history with filter and expandable items
function openHistory(){ $('table-screen').style.display='none'; $('menu-screen').style.display='none'; $('settings-screen').style.display='none'; $('menu-settings-screen').style.display='none'; $('printer-settings-screen').style.display='none'; $('payment-screen').style.display='none'; $('history-screen').style.display='block'; renderHistory(); }
function clearDateFilter(){ if($('history-date')){ $('history-date').value=''; renderHistory(); } }

function renderHistory(){
  const container = $('history-container'); container.innerHTML = '';
  if(!HISTORY.length){ container.innerHTML = '<div class="small">Chưa có lịch sử</div>'; return; }
  // group by iso date
  const grouped = {};
  HISTORY.forEach(h=>{
    const key = isoDateKey(h.time || h.iso || h.time); // ensure compatibility
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(h);
  });
  const keys = Object.keys(grouped).sort((a,b)=> b.localeCompare(a));
  const filter = $('history-date') && $('history-date').value ? $('history-date').value : null;
  const showKeys = filter ? [filter] : keys;
  showKeys.forEach(k=>{
    if(!grouped[k]) return;
    const dayDiv = document.createElement('div'); dayDiv.className='history-day';
    const header = document.createElement('div'); header.innerHTML = '<b>' + displayDateFromISO(k) + '</b>';
    dayDiv.appendChild(header);
    let dailyTotal = 0;
    grouped[k].forEach(rec=>{
      const it = document.createElement('div'); it.className='history-item';
      // collapsed view with ability to expand
      const left = document.createElement('div');
      left.innerHTML = '<b>'+rec.table+'</b><div class="small">'+rec.time+'</div>';
      const right = document.createElement('div'); right.className='small'; right.innerText = rec.items.length + ' món • ' + fmtV(rec.total) + ' VND';
      it.appendChild(left); it.appendChild(right);
      // make expandable
      it.style.cursor = 'pointer';
      it.addEventListener('click', ()=>{
        // toggle detail
        if(it._expanded){
          // collapse
          if(it._details) it.removeChild(it._details);
          it._expanded = false;
        } else {
          const details = document.createElement('div'); details.style.marginTop='6px';
          rec.items.forEach(i=>{
            const r = document.createElement('div'); r.className='small'; r.innerText = i.name + ' x' + i.qty + ' • ' + fmtV(i.price*i.qty) + ' VND';
            details.appendChild(r);
          });
          it.appendChild(details);
          it._details = details;
          it._expanded = true;
        }
      });
      dayDiv.appendChild(it);
      dailyTotal += rec.total;
    });
    const foot = document.createElement('div'); foot.className='history-total'; foot.innerText = 'Tổng doanh số: ' + fmtV(dailyTotal) + ' VND';
    dayDiv.appendChild(foot);
    container.appendChild(dayDiv);
  });
}

// init
window.addEventListener('load', ()=>{
  if($('guest-btn')) $('guest-btn').addEventListener('click', addGuest);
  if($('add-table-btn')) $('add-table-btn').addEventListener('click', addNamed);
  if($('cancel-order-btn')) $('cancel-order-btn').addEventListener('click', cancelOrder);
  if($('save-btn')) $('save-btn').addEventListener('click', saveOrder);
  if($('addmore-btn')) $('addmore-btn').addEventListener('click', addMore);
  if($('pay-btn')) $('pay-btn').addEventListener('click', payTable);
  if($('history-date')) $('history-date').addEventListener('change', ()=> renderHistory());
  // brand clickable
  const brand = document.getElementById('brand'); if(brand) brand.addEventListener('click', ()=> backToTables());
  renderTables(); renderCategories(); populateCatSelect(); renderMenuSettings(); saveAll();
});


// ---- popup choose-table wiring (dine-in) ----
(function(){
  const modal = document.getElementById('choose-table-modal');
  let selectedName = null;
  function openChooseTable(){
    if(modal) modal.classList.remove('hidden');
    selectedName = null;
    document.querySelectorAll('.table-btn').forEach(b=>b.classList.remove('selected'));
  }
  function closeChooseTable(){
    if(modal) modal.classList.add('hidden');
    selectedName = null;
    document.querySelectorAll('.table-btn').forEach(b=>b.classList.remove('selected'));
  }
  window.openChooseTable = openChooseTable;
  window.closeChooseTable = closeChooseTable;

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'dinein-btn') openChooseTable();
  });

  const tableButtons = document.querySelectorAll('.table-btn');
  tableButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tableButtons.forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedName = btn.dataset.name || btn.getAttribute('data-name');
    });
  });

  const cancelBtn = document.getElementById('cancel-choose');
  if(cancelBtn) cancelBtn.addEventListener('click', ()=>{ closeChooseTable(); });

  const confirmBtn = document.getElementById('confirm-choose');
  if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
    if(!selectedName){
      alert('Vui lòng chọn bàn');
      return;
    }
    // create/open table with this name
    const id = Date.now();
    const existing = TABLES.find(t=>t.name===selectedName);
    if(existing){
      // open existing table
      openTable(existing.id);
    } else {
      // create and open
      TABLES.push({ id, name: selectedName, cart: [] });
      saveAll();
      createdFromMain = true;
      openTable(id);
    }
    closeChooseTable();
  });
})();