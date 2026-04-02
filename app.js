/* ===================================================
   VALORIZA STOCK — APPLICATION LOGIC
   =================================================== */

// ===== STATE =====
const DB = {
  users: JSON.parse(localStorage.getItem('vs_users') || '[]'),
  empresa: JSON.parse(localStorage.getItem('vs_empresa') || 'null'),
  produtos: JSON.parse(localStorage.getItem('vs_produtos') || '[]'),
  compras: JSON.parse(localStorage.getItem('vs_compras') || '[]'),
  vendas: JSON.parse(localStorage.getItem('vs_vendas') || '[]'),
  clientes: JSON.parse(localStorage.getItem('vs_clientes') || '[]'),
  fornecedores: JSON.parse(localStorage.getItem('vs_fornecedores') || '[]'),
  faturas: JSON.parse(localStorage.getItem('vs_faturas') || '[]'),
  config: JSON.parse(localStorage.getItem('vs_config') || '{"metodo":"FIFO","tema":"theme-default"}'),
  currentUser: JSON.parse(localStorage.getItem('vs_session') || 'null'),
};

function saveDB(key) {
  localStorage.setItem('vs_' + key, JSON.stringify(DB[key]));
}

// ===== IDs =====
let idCounter = parseInt(localStorage.getItem('vs_id_counter') || '1000');
function newId() { idCounter++; localStorage.setItem('vs_id_counter', idCounter); return idCounter; }

// ===== SCREENS =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name)?.classList.add('active');
}

// ===== AUTH =====
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!user || !pass) { showToast('Preencha todos os campos', 'error'); return; }
  const found = DB.users.find(u => (u.email === user || u.nome === user) && u.senha === pass);
  if (!found) { showToast('Credenciais inválidas', 'error'); return; }
  DB.currentUser = found;
  saveDB('currentUser');
  localStorage.setItem('vs_session', JSON.stringify(found));
  initApp();
}

function doRegister() {
  const nome = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-pass').value;
  const empresa = document.getElementById('reg-company').value.trim();
  const nif = document.getElementById('reg-nif').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const address = document.getElementById('reg-address').value.trim();
  const regime = document.getElementById('reg-regime').value;
  if (!nome || !email || !senha || !empresa) { showToast('Preencha os campos obrigatórios', 'error'); return; }
  if (DB.users.find(u => u.email === email)) { showToast('Email já cadastrado', 'error'); return; }
  const user = { id: newId(), nome, email, senha, empresa, role: 'Gestor' };
  DB.users.push(user);
  saveDB('users');
  const empData = { id: newId(), nome: empresa, nif, phone, address, regime, createdAt: new Date().toISOString() };
  DB.empresa = empData;
  saveDB('empresa');
  DB.currentUser = user;
  localStorage.setItem('vs_session', JSON.stringify(user));
  showToast('Conta criada com sucesso!', 'success');
  setTimeout(() => initApp(), 600);
}

function doLogout() {
  localStorage.removeItem('vs_session');
  DB.currentUser = null;
  showScreen('welcome');
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ===== APP INIT =====
function initApp() {
  if (!DB.currentUser) { showScreen('welcome'); return; }
  applyTheme(DB.config.tema);
  document.getElementById('sidebar-username').textContent = DB.currentUser.nome;
  document.getElementById('sidebar-role').textContent = DB.currentUser.role || 'Gestor';
  document.getElementById('sidebar-avatar').textContent = DB.currentUser.nome.charAt(0).toUpperCase();
  document.getElementById('current-method-display').textContent = DB.config.metodo;
  updateTopbarDate();
  setInterval(updateTopbarDate, 60000);
  showScreen('app');
  navigate('dashboard');
  checkAlerts();
}

function updateTopbarDate() {
  const now = new Date();
  document.getElementById('topbar-date').textContent = now.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.querySelector('.main-content');
  sb.classList.toggle('collapsed');
  main.classList.toggle('sidebar-collapsed');
}

function toggleAlerts() {
  document.getElementById('alerts-panel').classList.toggle('hidden');
}

// ===== NAVIGATION =====
function navigate(page, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard:'Dashboard', empresa:'Gestão de Empresa', produtos:'Produtos', compras:'Compras', vendas:'Vendas', clientes:'Clientes', fornecedores:'Fornecedores', faturas:'Faturas', relatorios:'Relatórios', operacoes:'Operações Mensais', configuracoes:'Configurações' };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('page-breadcrumb').textContent = 'Início / ' + (titles[page] || page);
  const pages = { dashboard: renderDashboard, empresa: renderEmpresa, produtos: renderProdutos, compras: renderCompras, vendas: renderVendas, clientes: renderClientes, fornecedores: renderFornecedores, faturas: renderFaturas, relatorios: renderRelatorios, operacoes: renderOperacoes, configuracoes: renderConfiguracoes };
  const pc = document.getElementById('page-content');
  pc.innerHTML = '';
  if (pages[page]) pages[page](pc);
  document.getElementById('alerts-panel').classList.add('hidden');
}

// ===== ALERTS =====
function checkAlerts() {
  const alerts = DB.produtos.filter(p => p.quantidade <= p.stockMinimo);
  document.getElementById('alert-count').textContent = alerts.length;
  document.getElementById('alert-count').style.display = alerts.length ? 'flex' : 'none';
  const list = document.getElementById('alerts-list');
  if (alerts.length === 0) { list.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">Sem alertas activos</p>'; return; }
  list.innerHTML = alerts.map(p => `<div class="alert-item">⚠️ Stock mínimo atingido: <strong>${p.nome}</strong> — ${p.quantidade} unid. (mín: ${p.stockMinimo})</div>`).join('');
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const icons = { success:'✅', error:'❌', warn:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ===== MODAL =====
function openModal(html, wide = false) {
  document.getElementById('modal-content').innerHTML = html;
  const box = document.getElementById('modal-box');
  box.style.maxWidth = wide ? '800px' : '600px';
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.add('hidden'); }

// ===== APPLY THEME =====
function applyTheme(t) {
  document.body.className = t || 'theme-default';
  DB.config.tema = t;
  saveDB('config');
}

// ===== FORMAT =====
function fmtMoney(v) { return new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', minimumFractionDigits:2 }).format(v||0); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('pt-PT') : '—'; }
function today() { return new Date().toISOString().split('T')[0]; }

// ============================
// PAGES
// ============================

// ===== DASHBOARD =====
function renderDashboard(c) {
  const totalVendas = DB.vendas.reduce((s,v) => s + (v.total||0), 0);
  const totalCompras = DB.compras.reduce((s,v) => s + (v.total||0), 0);
  const lucro = totalVendas - totalCompras;
  const stockVal = DB.produtos.reduce((s,p) => s + (p.quantidade * p.precoCompra), 0);
  const alertas = DB.produtos.filter(p => p.quantidade <= p.stockMinimo).length;
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const now = new Date();
  const vendasMes = Array(6).fill(0).map((_,i) => {
    const m = (now.getMonth() - 5 + i + 12) % 12;
    return DB.vendas.filter(v => new Date(v.data).getMonth() === m).reduce((s,v) => s + (v.total||0), 0);
  });
  const maxV = Math.max(...vendasMes, 1);
  const lastSix = Array(6).fill(0).map((_,i) => meses[(now.getMonth()-5+i+12)%12]);
  const recentVendas = [...DB.vendas].sort((a,b) => new Date(b.data)-new Date(a.data)).slice(0,5);
  const lowStock = DB.produtos.filter(p => p.quantidade <= p.stockMinimo).slice(0,5);

  c.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Vendas</div><div class="stat-value">${fmtMoney(totalVendas)}</div><div class="stat-icon">💰</div><div class="stat-change">Todas as vendas</div></div>
      <div class="stat-card blue"><div class="stat-label">Total Compras</div><div class="stat-value">${fmtMoney(totalCompras)}</div><div class="stat-icon">🛒</div></div>
      <div class="stat-card ${lucro>=0?'':'danger'}"><div class="stat-label">Lucro</div><div class="stat-value">${fmtMoney(lucro)}</div><div class="stat-icon">📈</div></div>
      <div class="stat-card warn"><div class="stat-label">Valor em Stock</div><div class="stat-value">${fmtMoney(stockVal)}</div><div class="stat-icon">📦</div></div>
      <div class="stat-card ${alertas?'danger':''}"><div class="stat-label">Produtos</div><div class="stat-value">${DB.produtos.length}</div><div class="stat-icon">🏷️</div>${alertas?`<div class="stat-change" style="color:var(--danger)">⚠️ ${alertas} alertas</div>`:''}</div>
      <div class="stat-card"><div class="stat-label">Clientes</div><div class="stat-value">${DB.clientes.length}</div><div class="stat-icon">👥</div></div>
    </div>
    <div class="dashboard-grid" style="margin-bottom:1rem">
      <div class="card">
        <div class="card-title">Vendas — Últimos 6 Meses <span>AOA</span></div>
        <div class="chart-bars">
          ${vendasMes.map((v,i) => `<div class="bar-col"><div class="bar" style="height:${Math.max(5,Math.round(v/maxV*100))}%"></div><div class="bar-label">${lastSix[i]}</div></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Alertas de Stock</div>
        ${lowStock.length ? lowStock.map(p => `<div class="alert-item">⚠️ <strong>${p.nome}</strong> — ${p.quantidade} unid.</div>`).join('') : '<p style="color:var(--text3);font-size:0.85rem;padding:1rem 0">✅ Todos os stocks estão OK</p>'}
      </div>
    </div>
    <div class="card">
      <div class="card-title">Últimas Vendas</div>
      <div class="table-container">
        <table>
          <thead><tr><th>#</th><th>Data</th><th>Cliente</th><th>Produto</th><th>Qtd</th><th>Total</th><th>Tipo</th></tr></thead>
          <tbody>${recentVendas.length ? recentVendas.map(v => `<tr><td>#${v.id}</td><td>${fmtDate(v.data)}</td><td>${v.cliente||'—'}</td><td>${v.produtoNome||'—'}</td><td>${v.quantidade}</td><td>${fmtMoney(v.total)}</td><td><span class="badge ${v.tipo==='pronto'?'badge-green':'badge-blue'}">${v.tipo==='pronto'?'Pronto':'Prazo'}</span></td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem vendas registadas</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

// ===== EMPRESA =====
function renderEmpresa(c) {
  const e = DB.empresa || {};
  c.innerHTML = `
    <div class="page-header"><div><h2>Gestão de Empresa</h2><p>Informações da empresa</p></div><button class="btn-sm primary" onclick="saveEmpresa()">💾 Guardar</button></div>
    <div class="form-card">
      <h3>Dados da Empresa</h3>
      <div class="form-row">
        <div class="form-group"><label>Nome da Empresa</label><input class="form-control" id="e-nome" value="${e.nome||''}" placeholder="Nome da empresa"></div>
        <div class="form-group"><label>NIF</label><input class="form-control" id="e-nif" value="${e.nif||''}" placeholder="500000000"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Contacto</label><input class="form-control" id="e-phone" value="${e.phone||''}" placeholder="+244 900 000 000"></div>
        <div class="form-group"><label>Regime Jurídico</label>
          <select class="form-control" id="e-regime">
            <option value="">Selecione...</option>
            ${['Sociedade Unipessoal','Sociedade por Quotas','Empresa Individual','Cooperativa'].map(r => `<option ${e.regime===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Endereço</label><input class="form-control" id="e-address" value="${e.address||''}" placeholder="Rua, Nº, Cidade"></div>
    </div>
    ${e.nome ? `<div class="card"><div class="card-title">Resumo</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:0.5rem">
        ${[['🏢 Nome',e.nome],['🔢 NIF',e.nif||'—'],['📞 Contacto',e.phone||'—'],['📍 Endereço',e.address||'—'],['⚖️ Regime',e.regime||'—']].map(([l,v]) => `<div><p style="font-size:0.75rem;color:var(--text3)">${l}</p><p style="font-weight:600;color:var(--text);margin-top:0.2rem">${v}</p></div>`).join('')}
      </div>
    </div>` : ''}`;
}
function saveEmpresa() {
  DB.empresa = { ...DB.empresa, nome: document.getElementById('e-nome').value, nif: document.getElementById('e-nif').value, phone: document.getElementById('e-phone').value, regime: document.getElementById('e-regime').value, address: document.getElementById('e-address').value };
  saveDB('empresa');
  showToast('Empresa actualizada', 'success');
  navigate('empresa');
}

// ===== PRODUTOS =====
function renderProdutos(c) {
  const q = document.getElementById('search-prod')?.value?.toLowerCase() || '';
  const prods = DB.produtos.filter(p => !q || p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
  c.innerHTML = `
    <div class="page-header"><div><h2>Produtos</h2><p>${DB.produtos.length} produto(s) cadastrado(s)</p></div>
      <div class="page-actions"><button class="btn-sm primary" onclick="openProdutoModal()">+ Novo Produto</button></div>
    </div>
    <div class="filter-bar">
      <div class="search-box"><input type="text" id="search-prod" placeholder="Pesquisar produto..." oninput="renderProdutos(document.getElementById('page-content'))" value="${q}"></div>
      <select class="form-control" style="width:auto" id="filter-cat" onchange="renderProdutos(document.getElementById('page-content'))">
        <option value="">Todas as categorias</option>
        <option>Bens Alimentícios</option><option>Farmacêuticos</option><option>Bens em Geral</option>
      </select>
    </div>
    <div class="card"><div class="table-container">
      <table><thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>P. Compra</th><th>P. Venda</th><th>Qtd</th><th>Stk.Min</th><th>Código Barras</th><th>Estado</th><th>Ações</th></tr></thead>
      <tbody>${prods.length ? prods.map(p => `
        <tr>
          <td><code>${p.codigo}</code></td>
          <td><strong>${p.nome}</strong></td>
          <td><span class="badge badge-gray">${p.categoria}</span></td>
          <td>${fmtMoney(p.precoCompra)}</td>
          <td>${fmtMoney(p.precoVenda)}</td>
          <td><strong ${p.quantidade<=p.stockMinimo?'style="color:var(--danger)"':''}>${p.quantidade}</strong></td>
          <td>${p.stockMinimo}</td>
          <td><code>${p.barcode||'—'}</code></td>
          <td>${p.quantidade<=p.stockMinimo ? '<span class="badge badge-danger">⚠️ Baixo</span>' : '<span class="badge badge-green">OK</span>'}</td>
          <td><button class="btn-sm" onclick="openProdutoModal(${p.id})">✏️</button> <button class="btn-sm danger" onclick="deleteProduto(${p.id})">🗑️</button></td>
        </tr>`).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:2rem">Sem produtos cadastrados</td></tr>'}
      </tbody></table>
    </div></div>`;
}

function openProdutoModal(id) {
  const p = id ? DB.produtos.find(x => x.id === id) : {};
  openModal(`
    <h3>${id ? '✏️ Editar Produto' : '+ Novo Produto'}</h3>
    <div class="form-row">
      <div class="form-group"><label>Código</label><input class="form-control" id="p-codigo" value="${p.codigo||'PROD'+String(newId()).slice(-4)}" placeholder="PROD001"></div>
      <div class="form-group"><label>Nome</label><input class="form-control" id="p-nome" value="${p.nome||''}" placeholder="Nome do produto"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label>
        <select class="form-control" id="p-cat">
          ${['Bens Alimentícios','Farmacêuticos','Bens em Geral'].map(c => `<option ${p.categoria===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Código de Barras</label>
        <div style="display:flex;gap:0.5rem">
          <input class="form-control" id="p-barcode" value="${p.barcode||''}" placeholder="Scan ou digite..." style="flex:1">
          <button class="btn-sm" onclick="scanBarcode()">📷</button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Preço de Compra (AOA)</label><input type="number" class="form-control" id="p-pcompra" value="${p.precoCompra||''}" placeholder="0.00"></div>
      <div class="form-group"><label>Preço de Venda (AOA)</label><input type="number" class="form-control" id="p-pvenda" value="${p.precoVenda||''}" placeholder="0.00"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quantidade em Stock</label><input type="number" class="form-control" id="p-qtd" value="${p.quantidade||0}" placeholder="0"></div>
      <div class="form-group"><label>Stock Mínimo</label><input type="number" class="form-control" id="p-smin" value="${p.stockMinimo||5}" placeholder="5"></div>
    </div>
    <button class="btn-primary full" onclick="saveProduto(${id||0})">💾 Guardar Produto</button>`);
}

function saveProduto(id) {
  const p = {
    id: id || newId(),
    codigo: document.getElementById('p-codigo').value,
    nome: document.getElementById('p-nome').value,
    categoria: document.getElementById('p-cat').value,
    barcode: document.getElementById('p-barcode').value,
    precoCompra: parseFloat(document.getElementById('p-pcompra').value)||0,
    precoVenda: parseFloat(document.getElementById('p-pvenda').value)||0,
    quantidade: parseInt(document.getElementById('p-qtd').value)||0,
    stockMinimo: parseInt(document.getElementById('p-smin').value)||5,
    lotes: id ? DB.produtos.find(x=>x.id===id)?.lotes || [] : [],
    custoMedio: parseFloat(document.getElementById('p-pcompra').value)||0,
  };
  if (!p.nome) { showToast('Preencha o nome do produto', 'error'); return; }
  if (id) { const i = DB.produtos.findIndex(x => x.id===id); DB.produtos[i] = p; }
  else DB.produtos.push(p);
  saveDB('produtos');
  closeModalDirect();
  showToast(id ? 'Produto actualizado' : 'Produto adicionado', 'success');
  renderProdutos(document.getElementById('page-content'));
  checkAlerts();
}

function deleteProduto(id) {
  if (!confirm('Eliminar este produto?')) return;
  DB.produtos = DB.produtos.filter(p => p.id !== id);
  saveDB('produtos');
  showToast('Produto eliminado', 'warn');
  renderProdutos(document.getElementById('page-content'));
  checkAlerts();
}

function scanBarcode() {
  const code = prompt('Introduza o código de barras (simulação):');
  if (!code) return;
  document.getElementById('p-barcode').value = code;
  const existing = DB.produtos.find(p => p.barcode === code);
  if (existing) { showToast('Produto encontrado: ' + existing.nome, 'info'); }
  else { showToast('Novo produto — preencha os dados', 'warn'); }
}

// ===== COMPRAS =====
function renderCompras(c) {
  const recent = [...DB.compras].sort((a,b) => new Date(b.data)-new Date(a.data));
  c.innerHTML = `
    <div class="page-header"><div><h2>Compras</h2><p>Entradas de stock</p></div>
      <button class="btn-sm primary" onclick="openCompraModal()">+ Nova Compra</button>
    </div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">Nova Compra — Entrada de Stock</div>
      ${renderCompraForm()}
    </div>
    <div class="card"><div class="card-title">Histórico de Compras</div>
      <div class="table-container"><table>
        <thead><tr><th>#</th><th>Data</th><th>Produto</th><th>Fornecedor</th><th>Qtd</th><th>P.Compra</th><th>Total</th></tr></thead>
        <tbody>${recent.length ? recent.map(v => `<tr><td>#${v.id}</td><td>${fmtDate(v.data)}</td><td>${v.produtoNome}</td><td>${v.fornecedor||'—'}</td><td>${v.quantidade}</td><td>${fmtMoney(v.precoCompra)}</td><td>${fmtMoney(v.total)}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem">Sem compras registadas</td></tr>'}
        </tbody>
      </table></div>
    </div>`;
}

function renderCompraForm() {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Produto</label>
        <div style="display:flex;gap:0.5rem;align-items:flex-end">
          <select class="form-control" id="c-prod" onchange="fillCompraPreco()" style="flex:1">
            <option value="">Selecione o produto...</option>
            ${DB.produtos.map(p => `<option value="${p.id}" data-price="${p.precoCompra}" data-barcode="${p.barcode||''}">${p.nome} (stock: ${p.quantidade})</option>`).join('')}
          </select>
          <button type="button" class="scanner-btn" onclick="openBarcodeScanner()" title="Scanear código de barras">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>
            Scanear
          </button>
        </div>
        <div id="scanner-found-info" style="display:none;margin-top:0.4rem;font-size:0.8rem;color:var(--accent)"></div>
      </div>
      <div class="form-group"><label>Fornecedor</label><input class="form-control" id="c-forn" list="forn-list" placeholder="Nome do fornecedor">
        <datalist id="forn-list">${DB.fornecedores.map(f => `<option>${f.nome}</option>`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quantidade</label><input type="number" class="form-control" id="c-qtd" value="1" min="1"></div>
      <div class="form-group"><label>Preço de Compra (AOA)</label><input type="number" class="form-control" id="c-preco" placeholder="0.00"></div>
      <div class="form-group"><label>Data</label><input type="date" class="form-control" id="c-data" value="${today()}"></div>
    </div>
    <button class="btn-sm primary" onclick="saveCompra()">✅ Registar Compra</button>`;
}

function fillCompraPreco() {
  const sel = document.getElementById('c-prod');
  const opt = sel.options[sel.selectedIndex];
  if (opt.dataset.price) document.getElementById('c-preco').value = opt.dataset.price;
}

function saveCompra() {
  const prodId = parseInt(document.getElementById('c-prod').value);
  const qtd = parseInt(document.getElementById('c-qtd').value)||0;
  const preco = parseFloat(document.getElementById('c-preco').value)||0;
  const data = document.getElementById('c-data').value;
  const forn = document.getElementById('c-forn').value;
  if (!prodId || !qtd || !preco) { showToast('Preencha todos os campos', 'error'); return; }
  const prod = DB.produtos.find(p => p.id === prodId);
  if (!prod) return;
  const compra = { id: newId(), produtoId: prodId, produtoNome: prod.nome, quantidade: qtd, precoCompra: preco, total: qtd*preco, data, fornecedor: forn };
  DB.compras.push(compra);
  saveDB('compras');
  // Update stock with lotes for FIFO/LIFO
  prod.quantidade += qtd;
  if (!prod.lotes) prod.lotes = [];
  prod.lotes.push({ data, quantidade: qtd, preco, original: qtd });
  // CMP recalc
  const totalQtd = prod.quantidade;
  const totalVal = prod.lotes.reduce((s,l) => s + l.quantidade * l.preco, 0);
  prod.custoMedio = totalQtd > 0 ? totalVal / totalQtd : preco;
  saveDB('produtos');
  // Auto add fornecedor
  if (forn && !DB.fornecedores.find(f => f.nome === forn)) {
    DB.fornecedores.push({ id: newId(), nome: forn, createdAt: today() });
    saveDB('fornecedores');
  }
  showToast(`Compra registada! Stock: ${prod.quantidade} unid.`, 'success');
  checkAlerts();
  navigate('compras');
}

// ===== VENDAS =====
function renderVendas(c) {
  const recent = [...DB.vendas].sort((a,b) => new Date(b.data)-new Date(a.data));
  c.innerHTML = `
    <div class="page-header"><div><h2>Vendas</h2><p>Saídas de stock</p></div></div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">Nova Venda</div>
      ${renderVendaForm()}
    </div>
    <div class="card"><div class="card-title">Histórico de Vendas</div>
      <div class="table-container"><table>
        <thead><tr><th>#</th><th>Data</th><th>Produto</th><th>Cliente</th><th>Qtd</th><th>Custo(${DB.config.metodo})</th><th>Total</th><th>Lucro</th><th>Tipo</th><th>Factura</th></tr></thead>
        <tbody>${recent.length ? recent.map(v => `<tr>
          <td>#${v.id}</td><td>${fmtDate(v.data)}</td><td>${v.produtoNome}</td><td>${v.cliente||'—'}</td>
          <td>${v.quantidade}</td><td>${fmtMoney(v.custoTotal)}</td><td>${fmtMoney(v.total)}</td>
          <td style="color:${(v.total-v.custoTotal)>=0?'var(--accent)':'var(--danger)'}">${fmtMoney(v.total-v.custoTotal)}</td>
          <td><span class="badge ${v.tipo==='pronto'?'badge-green':'badge-blue'}">${v.tipo==='pronto'?'Pronto':'Prazo'}</span></td>
          <td><button class="btn-sm blue" onclick="viewFatura(${v.id})">🧾</button></td>
        </tr>`).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:2rem">Sem vendas registadas</td></tr>'}
        </tbody>
      </table></div>
    </div>`;
}

function renderVendaForm() {
  return `
    <div class="form-row">
      <div class="form-group"><label>Produto</label>
        <select class="form-control" id="v-prod" onchange="fillVendaPreco()">
          <option value="">Selecione o produto...</option>
          ${DB.produtos.filter(p=>p.quantidade>0).map(p => `<option value="${p.id}" data-pvenda="${p.precoVenda}" data-qtd="${p.quantidade}">${p.nome} (stock: ${p.quantidade})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Cliente</label><input class="form-control" id="v-cliente" list="cli-list" placeholder="Nome do cliente">
        <datalist id="cli-list">${DB.clientes.map(c => `<option>${c.nome}</option>`).join('')}</datalist>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quantidade</label><input type="number" class="form-control" id="v-qtd" value="1" min="1"></div>
      <div class="form-group"><label>Preço de Venda (AOA)</label><input type="number" class="form-control" id="v-preco" placeholder="0.00"></div>
      <div class="form-group"><label>Data</label><input type="date" class="form-control" id="v-data" value="${today()}"></div>
    </div>
    <div class="form-group">
      <label>Tipo de Venda</label>
      <div style="display:flex;gap:1rem;margin-top:0.4rem">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--text)"><input type="radio" name="v-tipo" value="pronto" checked> Venda a Pronto (Factura-Recibo)</label>
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--text)"><input type="radio" name="v-tipo" value="prazo"> Venda a Prazo (Factura)</label>
      </div>
    </div>
    <div style="padding:0.8rem;background:var(--bg2);border-radius:var(--radius-sm);margin-bottom:1rem;font-size:0.85rem;color:var(--text2)">
      Método activo: <strong style="color:var(--accent)">${DB.config.metodo}</strong> — O custo será calculado automaticamente
    </div>
    <button class="btn-sm primary" onclick="saveVenda()">✅ Registar Venda</button>`;
}

function fillVendaPreco() {
  const sel = document.getElementById('v-prod');
  const opt = sel.options[sel.selectedIndex];
  if (opt.dataset.pvenda) document.getElementById('v-preco').value = opt.dataset.pvenda;
}

function saveVenda() {
  const prodId = parseInt(document.getElementById('v-prod').value);
  const qtd = parseInt(document.getElementById('v-qtd').value)||0;
  const preco = parseFloat(document.getElementById('v-preco').value)||0;
  const data = document.getElementById('v-data').value;
  const cliente = document.getElementById('v-cliente').value;
  const tipo = document.querySelector('input[name="v-tipo"]:checked').value;
  if (!prodId || !qtd || !preco) { showToast('Preencha todos os campos', 'error'); return; }
  const prod = DB.produtos.find(p => p.id === prodId);
  if (!prod) return;
  if (prod.quantidade < qtd) { showToast('Stock insuficiente! Disponível: ' + prod.quantidade, 'error'); return; }
  const custo = calcularCusto(prod, qtd);
  const venda = { id: newId(), produtoId: prodId, produtoNome: prod.nome, quantidade: qtd, precoVenda: preco, total: qtd*preco, custoTotal: custo, data, cliente, tipo, metodo: DB.config.metodo, faturaNr: gerarNrFatura(tipo) };
  DB.vendas.push(venda);
  saveDB('vendas');
  // Update faturas
  DB.faturas.push({ ...venda, tipo_doc: tipo==='pronto' ? 'Factura-Recibo' : 'Factura' });
  saveDB('faturas');
  // Auto add cliente
  if (cliente && !DB.clientes.find(c => c.nome === cliente)) {
    DB.clientes.push({ id: newId(), nome: cliente, createdAt: today() });
    saveDB('clientes');
  }
  showToast(`Venda registada! Lucro: ${fmtMoney(qtd*preco - custo)}`, 'success');
  checkAlerts();
  navigate('vendas');
}

function gerarNrFatura(tipo) {
  const prefix = tipo === 'pronto' ? 'FR' : 'FT';
  const num = String(DB.faturas.length + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  return `${prefix}/${year}/${num}`;
}

// ===== STOCK VALUATION METHODS =====
function calcularCusto(prod, qtdSaida) {
  const metodo = DB.config.metodo;
  if (!prod.lotes || prod.lotes.length === 0) { return prod.precoCompra * qtdSaida; }
  if (metodo === 'CMP') {
    return prod.custoMedio * qtdSaida;
  }
  let lotes = prod.lotes.filter(l => l.quantidade > 0).map(l => ({...l}));
  if (metodo === 'LIFO') lotes = lotes.reverse();
  let restante = qtdSaida, custoTotal = 0;
  for (const lote of lotes) {
    if (restante <= 0) break;
    const usar = Math.min(restante, lote.quantidade);
    custoTotal += usar * lote.preco;
    restante -= usar;
  }
  // Update lotes
  let r2 = qtdSaida;
  const lotesOrig = metodo === 'FIFO' ? prod.lotes : [...prod.lotes].reverse();
  for (const lote of lotesOrig) {
    if (r2 <= 0) break;
    const usar = Math.min(r2, lote.quantidade);
    lote.quantidade -= usar;
    r2 -= usar;
  }
  prod.lotes = prod.lotes.filter(l => l.quantidade > 0);
  prod.quantidade -= qtdSaida;
  if (metodo === 'CMP') {
    const tv = prod.lotes.reduce((s,l) => s+l.quantidade*l.preco, 0);
    prod.custoMedio = prod.quantidade > 0 ? tv/prod.quantidade : 0;
  }
  saveDB('produtos');
  return custoTotal;
}

// ===== CLIENTES =====
function renderClientes(c) {
  c.innerHTML = `
    <div class="page-header"><div><h2>Clientes</h2><p>${DB.clientes.length} cliente(s)</p></div>
      <button class="btn-sm primary" onclick="openClienteModal()">+ Novo Cliente</button>
    </div>
    <div class="card"><div class="table-container"><table>
      <thead><tr><th>#</th><th>Nome</th><th>Email</th><th>Contacto</th><th>NIF</th><th>Total Comprado</th><th>Ações</th></tr></thead>
      <tbody>${DB.clientes.length ? DB.clientes.map(cl => {
        const total = DB.vendas.filter(v => v.cliente === cl.nome).reduce((s,v) => s+v.total, 0);
        return `<tr><td>#${cl.id}</td><td><strong>${cl.nome}</strong></td><td>${cl.email||'—'}</td><td>${cl.contacto||'—'}</td><td>${cl.nif||'—'}</td><td>${fmtMoney(total)}</td><td><button class="btn-sm" onclick="openClienteModal(${cl.id})">✏️</button> <button class="btn-sm danger" onclick="deleteCliente(${cl.id})">🗑️</button></td></tr>`;
      }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem">Sem clientes cadastrados</td></tr>'}
      </tbody></table></div></div>`;
}
function openClienteModal(id) {
  const cl = id ? DB.clientes.find(x => x.id===id) : {};
  openModal(`<h3>${id?'✏️ Editar':'+ Novo'} Cliente</h3>
    <div class="form-group"><label>Nome</label><input class="form-control" id="cl-nome" value="${cl.nome||''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input type="email" class="form-control" id="cl-email" value="${cl.email||''}"></div>
      <div class="form-group"><label>Contacto</label><input class="form-control" id="cl-contacto" value="${cl.contacto||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>NIF</label><input class="form-control" id="cl-nif" value="${cl.nif||''}"></div>
      <div class="form-group"><label>Endereço</label><input class="form-control" id="cl-addr" value="${cl.address||''}"></div>
    </div>
    <button class="btn-primary full" onclick="saveCliente(${id||0})">💾 Guardar</button>`);
}
function saveCliente(id) {
  const cl = { id: id||newId(), nome: document.getElementById('cl-nome').value, email: document.getElementById('cl-email').value, contacto: document.getElementById('cl-contacto').value, nif: document.getElementById('cl-nif').value, address: document.getElementById('cl-addr').value };
  if (!cl.nome) { showToast('Nome obrigatório','error'); return; }
  if (id) { const i = DB.clientes.findIndex(x=>x.id===id); DB.clientes[i]=cl; } else DB.clientes.push(cl);
  saveDB('clientes'); closeModalDirect(); showToast('Cliente guardado','success'); renderClientes(document.getElementById('page-content'));
}
function deleteCliente(id) {
  if(!confirm('Eliminar cliente?')) return;
  DB.clientes = DB.clientes.filter(c=>c.id!==id); saveDB('clientes'); renderClientes(document.getElementById('page-content'));
}

// ===== FORNECEDORES =====
function renderFornecedores(c) {
  c.innerHTML = `
    <div class="page-header"><div><h2>Fornecedores</h2><p>${DB.fornecedores.length} fornecedor(es)</p></div>
      <button class="btn-sm primary" onclick="openFornModal()">+ Novo Fornecedor</button>
    </div>
    <div class="card"><div class="table-container"><table>
      <thead><tr><th>#</th><th>Nome</th><th>Email</th><th>Contacto</th><th>NIF</th><th>Total Fornecido</th><th>Ações</th></tr></thead>
      <tbody>${DB.fornecedores.length ? DB.fornecedores.map(f => {
        const total = DB.compras.filter(c => c.fornecedor===f.nome).reduce((s,v) => s+v.total, 0);
        return `<tr><td>#${f.id}</td><td><strong>${f.nome}</strong></td><td>${f.email||'—'}</td><td>${f.contacto||'—'}</td><td>${f.nif||'—'}</td><td>${fmtMoney(total)}</td><td><button class="btn-sm" onclick="openFornModal(${f.id})">✏️</button> <button class="btn-sm danger" onclick="deleteForn(${f.id})">🗑️</button></td></tr>`;
      }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem">Sem fornecedores cadastrados</td></tr>'}
      </tbody></table></div></div>`;
}
function openFornModal(id) {
  const f = id ? DB.fornecedores.find(x=>x.id===id) : {};
  openModal(`<h3>${id?'✏️ Editar':'+ Novo'} Fornecedor</h3>
    <div class="form-group"><label>Nome</label><input class="form-control" id="f-nome" value="${f.nome||''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input class="form-control" id="f-email" value="${f.email||''}"></div>
      <div class="form-group"><label>Contacto</label><input class="form-control" id="f-contacto" value="${f.contacto||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>NIF</label><input class="form-control" id="f-nif" value="${f.nif||''}"></div>
      <div class="form-group"><label>Morada</label><input class="form-control" id="f-addr" value="${f.address||''}"></div>
    </div>
    <button class="btn-primary full" onclick="saveForn(${id||0})">💾 Guardar</button>`);
}
function saveForn(id) {
  const f = { id:id||newId(), nome:document.getElementById('f-nome').value, email:document.getElementById('f-email').value, contacto:document.getElementById('f-contacto').value, nif:document.getElementById('f-nif').value, address:document.getElementById('f-addr').value };
  if(!f.nome){showToast('Nome obrigatório','error');return;}
  if(id){const i=DB.fornecedores.findIndex(x=>x.id===id);DB.fornecedores[i]=f;}else DB.fornecedores.push(f);
  saveDB('fornecedores');closeModalDirect();showToast('Fornecedor guardado','success');renderFornecedores(document.getElementById('page-content'));
}
function deleteForn(id){if(!confirm('Eliminar?'))return;DB.fornecedores=DB.fornecedores.filter(f=>f.id!==id);saveDB('fornecedores');renderFornecedores(document.getElementById('page-content'));}

// ===== FATURAS =====
function renderFaturas(c) {
  c.innerHTML = `
    <div class="page-header"><div><h2>Faturas</h2><p>${DB.faturas.length} documento(s)</p></div></div>
    <div class="card"><div class="table-container"><table>
      <thead><tr><th>Nº Fatura</th><th>Data</th><th>Tipo</th><th>Cliente</th><th>Produto</th><th>Total</th><th>Ações</th></tr></thead>
      <tbody>${DB.faturas.length ? [...DB.faturas].reverse().map(f => `
        <tr>
          <td><strong>${f.faturaNr||'—'}</strong></td>
          <td>${fmtDate(f.data)}</td>
          <td><span class="badge ${f.tipo==='pronto'?'badge-green':'badge-blue'}">${f.tipo_doc||f.tipo}</span></td>
          <td>${f.cliente||'—'}</td>
          <td>${f.produtoNome}</td>
          <td>${fmtMoney(f.total)}</td>
          <td><button class="btn-sm blue" onclick="viewFatura(${f.id})">👁️ Ver</button> <button class="btn-sm" onclick="printFatura(${f.id})">🖨️</button></td>
        </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem">Sem faturas emitidas</td></tr>'}
      </tbody></table></div></div>`;
}

function viewFatura(id) {
  const f = DB.faturas.find(x => x.id === id);
  if (!f) return;
  const emp = DB.empresa || {};
  const isRecibo = f.tipo === 'pronto';
  const iva = getIVA(f.produtoId);
  const subtotal = f.total;
  const ivaVal = subtotal * iva;
  const totalFinal = subtotal + ivaVal;
  openModal(`
    <div class="invoice-print" style="background:#fff;color:#000;padding:1.5rem;border-radius:8px">
      <div class="invoice-header">
        <div class="invoice-company">
          <h2>${emp.nome || 'VALORIZA STOCK'}</h2>
          <p>NIF: ${emp.nif||'—'} | ${emp.phone||''}</p>
          <p>${emp.address||''}</p>
          <p>${emp.regime||''}</p>
        </div>
        <div class="invoice-type">
          <h1>${isRecibo ? 'FACTURA-RECIBO' : 'FACTURA'}</h1>
          <p>Nº ${f.faturaNr||'—'}</p>
          <p>Data: ${fmtDate(f.data)}</p>
        </div>
      </div>
      <div class="invoice-info">
        <div class="invoice-info-block"><h4>Cliente</h4><p>${f.cliente||'Consumidor Final'}</p></div>
        <div class="invoice-info-block"><h4>Informação</h4><p>Método: ${f.metodo||DB.config.metodo}</p></div>
      </div>
      <table class="invoice-table">
        <thead><tr><th>Descrição</th><th>Qtd</th><th>P.Unit.</th><th>IVA</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>${f.produtoNome}</td><td>${f.quantidade}</td><td>${fmtMoney(f.precoVenda)}</td><td>${(iva*100).toFixed(0)}%</td><td>${fmtMoney(subtotal)}</td></tr>
        </tbody>
      </table>
      <div class="invoice-totals">
        <div class="total-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
        <div class="total-row"><span>IVA (${(iva*100).toFixed(0)}%)</span><span>${fmtMoney(ivaVal)}</span></div>
        <div class="total-row grand"><span>TOTAL</span><span>${fmtMoney(totalFinal)}</span></div>
      </div>
      ${isRecibo ? '<p style="margin-top:1.5rem;font-size:0.8rem;color:#999;text-align:center">✅ RECEBIDO — Documento processado por computador</p>' : '<p style="margin-top:1.5rem;font-size:0.8rem;color:#999;text-align:center">Documento processado por computador</p>'}
    </div>
    <button class="btn-sm primary" style="margin-top:1rem;width:100%" onclick="printFatura(${id})">🖨️ Imprimir</button>
  `, true);
}

function getIVA(prodId) {
  const p = DB.produtos.find(x => x.id === prodId);
  if (!p) return 0.14;
  if (p.categoria === 'Bens Alimentícios') return 0;
  if (p.categoria === 'Farmacêuticos') return 0.02;
  return 0.14;
}

function printFatura(id) {
  const f = DB.faturas.find(x => x.id === id);
  if (!f) return;
  const emp = DB.empresa || {};
  const isRecibo = f.tipo === 'pronto';
  const iva = getIVA(f.produtoId);
  const subtotal = f.total;
  const ivaVal = subtotal * iva;
  const totalFinal = subtotal + ivaVal;
  const w = window.open('','_blank','width=800,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>${f.faturaNr}</title>
  <style>body{font-family:Arial,sans-serif;padding:2rem;color:#000}h1{font-size:2rem;color:#00C896}h2{font-size:1.4rem}table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:0.7rem;text-align:left}td{padding:0.7rem;border-bottom:1px solid #eee}.header{display:flex;justify-content:space-between;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid #00C896}.totals{text-align:right}.t-row{display:flex;justify-content:flex-end;gap:3rem;padding:0.3rem 0}.grand{font-weight:700;font-size:1.1rem;border-top:2px solid #00C896;padding-top:0.5rem}</style>
  </head><body>
  <div class="header"><div><h2>${emp.nome||'VALORIZA STOCK'}</h2><p>NIF: ${emp.nif||'—'}</p><p>${emp.phone||''}</p><p>${emp.address||''}</p></div>
  <div style="text-align:right"><h1>${isRecibo?'FACTURA-RECIBO':'FACTURA'}</h1><p>Nº ${f.faturaNr||'—'}</p><p>${fmtDate(f.data)}</p></div></div>
  <p><strong>Cliente:</strong> ${f.cliente||'Consumidor Final'}</p><br>
  <table><thead><tr><th>Produto</th><th>Qtd</th><th>P.Unit.</th><th>IVA</th><th>Total</th></tr></thead>
  <tbody><tr><td>${f.produtoNome}</td><td>${f.quantidade}</td><td>${fmtMoney(f.precoVenda)}</td><td>${(iva*100).toFixed(0)}%</td><td>${fmtMoney(subtotal)}</td></tr></tbody></table>
  <br><div class="totals"><div class="t-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div><div class="t-row"><span>IVA</span><span>${fmtMoney(ivaVal)}</span></div><div class="t-row grand"><span>TOTAL</span><span>${fmtMoney(totalFinal)}</span></div></div>
  ${isRecibo?'<p style="margin-top:2rem;text-align:center;color:#999">✅ RECEBIDO</p>':''}
  <script>window.print();</script></body></html>`);
}

// ===== RELATÓRIOS =====
function renderRelatorios(c) {
  c.innerHTML = `
    <div class="page-header"><div><h2>Relatórios</h2><p>Exporte dados em PDF ou Excel</p></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem">
      ${[
        ['📦 Stock Actual','Situação actual do inventário','exportStockPDF','exportStockExcel'],
        ['💰 Relatório de Vendas','Histórico completo de vendas','exportVendasPDF','exportVendasExcel'],
        ['🛒 Relatório de Compras','Histórico completo de compras','exportComprasPDF','exportComprasExcel'],
        ['👥 Clientes','Lista de clientes e volume','exportClientesPDF','exportClientesExcel'],
        ['🚛 Fornecedores','Lista de fornecedores','exportFornPDF','exportFornExcel'],
      ].map(([t,d,pdf,xls]) => `
        <div class="card">
          <div class="card-title">${t}</div>
          <p style="font-size:0.84rem;color:var(--text2);margin-bottom:1rem">${d}</p>
          <div style="display:flex;gap:0.5rem">
            <button class="btn-sm danger" onclick="${pdf}()">📄 PDF</button>
            <button class="btn-sm blue" onclick="${xls}()">📊 Excel</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function exportStockExcel() { exportCSV('stock', DB.produtos.map(p => ({ Codigo:p.codigo, Nome:p.nome, Categoria:p.categoria, Quantidade:p.quantidade, StockMinimo:p.stockMinimo, PrecoCompra:p.precoCompra, PrecoVenda:p.precoVenda, CustoMedio:p.custoMedio?.toFixed(2)||p.precoCompra, ValorStock:(p.quantidade*p.precoCompra).toFixed(2) }))); }
function exportVendasExcel() { exportCSV('vendas', DB.vendas.map(v => ({ Nr:v.faturaNr, Data:fmtDate(v.data), Produto:v.produtoNome, Cliente:v.cliente, Qtd:v.quantidade, Preco:v.precoVenda, Total:v.total, Custo:v.custoTotal, Lucro:(v.total-v.custoTotal).toFixed(2), Metodo:v.metodo, Tipo:v.tipo }))); }
function exportComprasExcel() { exportCSV('compras', DB.compras.map(c => ({ Nr:c.id, Data:fmtDate(c.data), Produto:c.produtoNome, Fornecedor:c.fornecedor, Qtd:c.quantidade, Preco:c.precoCompra, Total:c.total }))); }
function exportClientesExcel() { exportCSV('clientes', DB.clientes.map(c => ({ ID:c.id, Nome:c.nome, Email:c.email||'', Contacto:c.contacto||'', NIF:c.nif||'' }))); }
function exportFornExcel() { exportCSV('fornecedores', DB.fornecedores.map(f => ({ ID:f.id, Nome:f.nome, Email:f.email||'', Contacto:f.contacto||'', NIF:f.nif||'' }))); }

function exportCSV(name, data) {
  if (!data.length) { showToast('Sem dados para exportar', 'warn'); return; }
  const headers = Object.keys(data[0]);
  const rows = [headers, ...data.map(r => headers.map(h => r[h]||''))];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `valoriza-stock-${name}-${today()}.csv`; a.click();
  showToast('Excel exportado com sucesso!', 'success');
}

function exportStockPDF() { printReport('Stock Actual', DB.produtos.map(p => [p.codigo, p.nome, p.categoria, p.quantidade, p.stockMinimo, fmtMoney(p.precoCompra), fmtMoney(p.precoVenda)]), ['Código','Nome','Categoria','Qtd','Stk.Min','P.Compra','P.Venda']); }
function exportVendasPDF() { printReport('Relatório de Vendas', DB.vendas.map(v => [v.faturaNr, fmtDate(v.data), v.produtoNome, v.cliente||'—', v.quantidade, fmtMoney(v.total)]), ['Nº','Data','Produto','Cliente','Qtd','Total']); }
function exportComprasPDF() { printReport('Relatório de Compras', DB.compras.map(c => [c.id, fmtDate(c.data), c.produtoNome, c.fornecedor||'—', c.quantidade, fmtMoney(c.total)]), ['Nº','Data','Produto','Fornecedor','Qtd','Total']); }
function exportClientesPDF() { printReport('Clientes', DB.clientes.map(c => [c.id, c.nome, c.email||'—', c.contacto||'—']), ['ID','Nome','Email','Contacto']); }
function exportFornPDF() { printReport('Fornecedores', DB.fornecedores.map(f => [f.id, f.nome, f.email||'—', f.contacto||'—']), ['ID','Nome','Email','Contacto']); }

function printReport(title, rows, headers) {
  const emp = DB.empresa || {};
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;padding:2rem}h1{color:#00C896;font-size:1.5rem}h3{color:#666}table{width:100%;border-collapse:collapse;margin-top:1rem}th{background:#0D0F14;color:#fff;padding:0.6rem 0.8rem;text-align:left;font-size:0.82rem}td{padding:0.6rem 0.8rem;border-bottom:1px solid #eee;font-size:0.85rem}tr:nth-child(even)td{background:#f9f9f9}.header{border-bottom:3px solid #00C896;padding-bottom:1rem;margin-bottom:1.5rem;display:flex;justify-content:space-between}</style>
  </head><body>
  <div class="header"><div><h1>VALORIZA STOCK</h1><h3>${emp.nome||''}</h3></div><div style="text-align:right"><h2>${title}</h2><p>Gerado em: ${new Date().toLocaleString('pt-PT')}</p><p>Método: ${DB.config.metodo}</p></div></div>
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p style="margin-top:2rem;font-size:0.75rem;color:#999">Total de registos: ${rows.length} | VALORIZA STOCK © ${new Date().getFullYear()}</p>
  <script>window.print();</script></body></html>`);
}

// ===== OPERAÇÕES MENSAIS =====
function renderOperacoes(c) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const year = new Date().getFullYear();
  const data = meses.map((m, i) => {
    const compras = DB.compras.filter(c => { const d = new Date(c.data); return d.getFullYear()===year && d.getMonth()===i; }).reduce((s,c) => s+c.total, 0);
    const vendas = DB.vendas.filter(v => { const d = new Date(v.data); return d.getFullYear()===year && d.getMonth()===i; }).reduce((s,v) => s+v.total, 0);
    const lucro = vendas - compras;
    return { mes: m, compras, vendas, lucro };
  });
  const maxVal = Math.max(...data.map(d => Math.max(d.compras, d.vendas)), 1);
  c.innerHTML = `
    <div class="page-header"><div><h2>Operações Mensais ${year}</h2><p>Resumo financeiro do ano</p></div></div>
    <div class="stats-grid" style="margin-bottom:1.5rem">
      <div class="stat-card"><div class="stat-label">Total Vendas ${year}</div><div class="stat-value">${fmtMoney(data.reduce((s,d)=>s+d.vendas,0))}</div></div>
      <div class="stat-card blue"><div class="stat-label">Total Compras ${year}</div><div class="stat-value">${fmtMoney(data.reduce((s,d)=>s+d.compras,0))}</div></div>
      <div class="stat-card"><div class="stat-label">Lucro ${year}</div><div class="stat-value">${fmtMoney(data.reduce((s,d)=>s+d.lucro,0))}</div></div>
    </div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">Comparativo Mensal — Vendas vs Compras</div>
      <div style="display:flex;align-items:flex-end;gap:0.5rem;height:160px;padding:0.5rem 0">
        ${data.map(d => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.2rem">
            <div style="width:100%;display:flex;gap:2px;align-items:flex-end;height:120px">
              <div style="flex:1;background:linear-gradient(180deg,#00C896,rgba(0,200,150,0.3));border-radius:3px 3px 0 0;height:${Math.max(3,Math.round(d.vendas/maxVal*100))}%;min-height:2px" title="Vendas: ${fmtMoney(d.vendas)}"></div>
              <div style="flex:1;background:linear-gradient(180deg,#0A84FF,rgba(10,132,255,0.3));border-radius:3px 3px 0 0;height:${Math.max(3,Math.round(d.compras/maxVal*100))}%;min-height:2px" title="Compras: ${fmtMoney(d.compras)}"></div>
            </div>
            <span style="font-size:0.65rem;color:var(--text3)">${d.mes}</span>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:1.5rem;margin-top:0.5rem">
        <span style="font-size:0.78rem;color:var(--accent)">■ Vendas</span>
        <span style="font-size:0.78rem;color:var(--accent2)">■ Compras</span>
      </div>
    </div>
    <div class="card"><div class="card-title">Detalhe Mensal</div>
      <div class="table-container"><table>
        <thead><tr><th>Mês</th><th>Compras</th><th>Vendas</th><th>Lucro</th><th>Margem</th></tr></thead>
        <tbody>${data.map(d => `<tr>
          <td><strong>${d.mes}/${year}</strong></td>
          <td>${fmtMoney(d.compras)}</td>
          <td>${fmtMoney(d.vendas)}</td>
          <td style="color:${d.lucro>=0?'var(--accent)':'var(--danger)'}"><strong>${fmtMoney(d.lucro)}</strong></td>
          <td>${d.vendas > 0 ? ((d.lucro/d.vendas)*100).toFixed(1)+'%' : '—'}</td>
        </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

// ===== CONFIGURAÇÕES =====
function renderConfiguracoes(c) {
  c.innerHTML = `
    <div class="page-header"><div><h2>Configurações</h2><p>Personalize o sistema</p></div></div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">🎨 Tema do Sistema</div>
      <div class="theme-options">
        <div class="theme-opt ${DB.config.tema==='theme-default'?'active':''}" onclick="applyTheme('theme-default');renderConfiguracoes(document.getElementById('page-content'))">
          <span class="theme-icon">🌙</span> Modo Escuro
        </div>
        <div class="theme-opt ${DB.config.tema==='theme-light'?'active':''}" onclick="applyTheme('theme-light');renderConfiguracoes(document.getElementById('page-content'))">
          <span class="theme-icon">🌞</span> Modo Claro
        </div>
        <div class="theme-opt ${DB.config.tema==='theme-system'?'active':''}" onclick="applyTheme('theme-system');renderConfiguracoes(document.getElementById('page-content'))">
          <span class="theme-icon">⚙️</span> Tema do Sistema
        </div>
        <div class="theme-opt ${DB.config.tema==='theme-orange'?'active':''}" onclick="applyTheme('theme-orange');renderConfiguracoes(document.getElementById('page-content'))">
          <span class="theme-icon">🔥</span> Preto &amp; Laranja
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">📊 Método de Avaliação de Stock</div>
      <p style="font-size:0.85rem;color:var(--text2);margin-bottom:1rem">Seleccione o método para calcular o custo dos produtos vendidos</p>
      <div class="method-options">
        ${[['FIFO','First In, First Out','O primeiro a entrar é o primeiro a sair'],['LIFO','Last In, First Out','O último a entrar é o primeiro a sair'],['CMP','Custo Médio Ponderado','Média ponderada de todos os custos']].map(([m,n,d]) => `
          <div class="method-opt ${DB.config.metodo===m?'active':''}" onclick="setMetodo('${m}')">
            <h3>${m}</h3>
            <strong style="font-size:0.8rem;color:var(--text2)">${n}</strong>
            <p>${d}</p>
          </div>`).join('')}
      </div>
    </div>
    <div class="card" style="margin-bottom:1rem">
      <div class="card-title">⚠️ Zona de Perigo</div>
      <p style="font-size:0.85rem;color:var(--text2);margin-bottom:1rem">Estas acções são irreversíveis</p>
      <button class="btn-sm danger" onclick="resetData()">🗑️ Limpar Todos os Dados</button>
    </div>
    <div class="card">
      <div class="card-title">ℹ️ Sobre o Sistema</div>
      <p style="font-size:0.85rem;color:var(--text2);line-height:1.8">
        <strong>VALORIZA STOCK</strong> — Sistema de Gestão de Stock e Logística<br>
        Versão: 1.0.0<br>
        Base de Dados: MySQL (WAMP)<br>
        Métodos suportados: FIFO, LIFO, CMP<br>
        Categorias fiscais: Bens Alimentícios (0%), Farmacêuticos (2%), Bens em Geral (14%)<br>
        © 2025 VALORIZA STOCK
      </p>
    </div>`;
}

function setMetodo(m) {
  DB.config.metodo = m;
  saveDB('config');
  document.getElementById('current-method-display').textContent = m;
  showToast(`Método alterado para ${m}`, 'success');
  renderConfiguracoes(document.getElementById('page-content'));
}

function resetData() {
  if (!confirm('⚠️ Tem a certeza? TODOS os dados serão apagados!\n\nEsta acção é irreversível.')) return;
  if (!confirm('Confirme novamente para apagar TODOS os dados:')) return;
  ['produtos','compras','vendas','clientes','fornecedores','faturas'].forEach(k => { DB[k] = []; saveDB(k); });
  showToast('Dados limpos', 'warn');
  navigate('dashboard');
}

// ===== BARCODE SCANNER =====
let _scannerStream = null;
let _scannerAnimFrame = null;
let _scannerActive = false;

function openBarcodeScanner() {
  if (document.getElementById('scanner-modal-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'scanner-modal-overlay';
  overlay.id = 'scanner-modal-overlay';
  overlay.innerHTML = `
    <div class="scanner-modal">
      <button class="scanner-close" onclick="closeBarcodeScanner()">✕</button>
      <h3>📷 Scanear Código de Barras</h3>
      <div class="scanner-video-wrap">
        <video id="scanner-video" autoplay playsinline muted></video>
        <div class="scanner-line"></div>
        <div class="scanner-frame"></div>
      </div>
      <div class="scanner-status" id="scanner-status">A iniciar câmera...</div>
      <div class="scanner-result" id="scanner-result"></div>
      <div class="scanner-manual">
        <input type="text" id="scanner-manual-input" placeholder="Ou introduza o código manualmente..." autocomplete="off"
          onkeydown="if(event.key==='Enter')applyManualBarcode()">
        <button class="btn-sm primary" onclick="applyManualBarcode()">✓</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  _scannerActive = true;
  startCamera();
}

async function startCamera() {
  const statusEl = document.getElementById('scanner-status');
  try {
    _scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    const video = document.getElementById('scanner-video');
    if (!video) return;
    video.srcObject = _scannerStream;
    await video.play();
    statusEl.textContent = 'Aponte para o código de barras do produto...';

    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['ean_13','ean_8','code_128','code_39','qr_code','upc_a','upc_e','itf','codabar'] });
      scanFrame(detector, video);
    } else {
      statusEl.textContent = 'Câmera activa. Use a introdução manual abaixo (browser sem suporte nativo).';
    }
  } catch (err) {
    if (statusEl) {
      if (err.name === 'NotAllowedError') {
        statusEl.innerHTML = '❌ Permissão da câmera negada.<br><small>Use a introdução manual abaixo.</small>';
      } else {
        statusEl.innerHTML = '❌ Câmera não disponível.<br><small>Use a introdução manual abaixo.</small>';
      }
    }
  }
}

function scanFrame(detector, video) {
  if (!_scannerActive) return;
  _scannerAnimFrame = requestAnimationFrame(async () => {
    if (!_scannerActive || !document.getElementById('scanner-video')) return;
    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        handleScannedCode(code);
        return;
      }
    } catch(e) {}
    scanFrame(detector, video);
  });
}

function handleScannedCode(code) {
  const resultEl = document.getElementById('scanner-result');
  const statusEl = document.getElementById('scanner-status');
  if (resultEl) { resultEl.style.display = 'block'; resultEl.textContent = '✅ Código: ' + code; }
  if (statusEl) statusEl.textContent = 'Código detectado! A procurar produto...';

  // Vibration feedback
  if (navigator.vibrate) navigator.vibrate(100);

  // Find product by barcode
  const prod = DB.produtos.find(p => p.barcode === code);
  if (prod) {
    applyScannedProduct(prod, code);
  } else {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--warn)">⚠️ Código <strong>${code}</strong> não encontrado nos produtos.</span>`;
    // Still close after 2s and put the barcode in manual input
    const manualInput = document.getElementById('scanner-manual-input');
    if (manualInput) manualInput.value = code;
  }
}

function applyScannedProduct(prod, code) {
  closeBarcodeScanner();
  const sel = document.getElementById('c-prod');
  if (sel) {
    sel.value = prod.id;
    fillCompraPreco();
  }
  const infoEl = document.getElementById('scanner-found-info');
  if (infoEl) {
    infoEl.style.display = 'block';
    infoEl.innerHTML = `✅ Produto encontrado por código de barras: <strong>${prod.nome}</strong> — Código: <code>${code}</code>`;
  }
  showToast(`Produto "${prod.nome}" seleccionado por scanner!`, 'success');
}

function applyManualBarcode() {
  const code = document.getElementById('scanner-manual-input')?.value?.trim();
  if (!code) { showToast('Introduza um código de barras', 'error'); return; }
  const prod = DB.produtos.find(p => p.barcode === code);
  if (prod) {
    applyScannedProduct(prod, code);
  } else {
    showToast(`Código "${code}" não encontrado nos produtos`, 'warn');
  }
}

function closeBarcodeScanner() {
  _scannerActive = false;
  if (_scannerAnimFrame) { cancelAnimationFrame(_scannerAnimFrame); _scannerAnimFrame = null; }
  if (_scannerStream) { _scannerStream.getTracks().forEach(t => t.stop()); _scannerStream = null; }
  const overlay = document.getElementById('scanner-modal-overlay');
  if (overlay) overlay.remove();
}

// ===== MYSQL SQL GENERATOR =====
// (Schema info for WAMP connectivity)
const SQL_SCHEMA = `
-- VALORIZA STOCK — MySQL Schema (WAMP)
CREATE DATABASE IF NOT EXISTS valoriza_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE valoriza_stock;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL, empresa VARCHAR(100), role VARCHAR(50) DEFAULT 'Gestor', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE empresa (
  id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(200) NOT NULL, nif VARCHAR(20), phone VARCHAR(30),
  address TEXT, regime VARCHAR(100), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(50) UNIQUE NOT NULL, nome VARCHAR(200) NOT NULL,
  categoria ENUM('Bens Alimentícios','Farmacêuticos','Bens em Geral') NOT NULL,
  preco_compra DECIMAL(15,2) DEFAULT 0, preco_venda DECIMAL(15,2) DEFAULT 0,
  quantidade INT DEFAULT 0, stock_minimo INT DEFAULT 5, barcode VARCHAR(100),
  custo_medio DECIMAL(15,2) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lotes_stock (
  id INT AUTO_INCREMENT PRIMARY KEY, produto_id INT, data DATE, quantidade INT,
  preco DECIMAL(15,2), quantidade_restante INT, FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE compras (
  id INT AUTO_INCREMENT PRIMARY KEY, produto_id INT, produto_nome VARCHAR(200),
  quantidade INT, preco_compra DECIMAL(15,2), total DECIMAL(15,2), data DATE,
  fornecedor VARCHAR(200), FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE vendas (
  id INT AUTO_INCREMENT PRIMARY KEY, produto_id INT, produto_nome VARCHAR(200),
  quantidade INT, preco_venda DECIMAL(15,2), total DECIMAL(15,2), custo_total DECIMAL(15,2),
  data DATE, cliente VARCHAR(200), tipo ENUM('pronto','prazo'), metodo ENUM('FIFO','LIFO','CMP'),
  fatura_nr VARCHAR(50), FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(200) NOT NULL, email VARCHAR(100),
  contacto VARCHAR(30), nif VARCHAR(20), address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(200) NOT NULL, email VARCHAR(100),
  contacto VARCHAR(30), nif VARCHAR(20), address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check session
  const session = localStorage.getItem('vs_session');
  if (session) {
    try {
      DB.currentUser = JSON.parse(session);
      initApp();
    } catch(e) {
      showScreen('welcome');
    }
  } else {
    showScreen('welcome');
  }
});
