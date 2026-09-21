const DEFAULT_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];
const DEFAULT_FONTES = ['Salário', 'Vale Alimentação', 'Seguro Desemprego', 'Alimentação', 'Outros'];

const state = {
  config: loadConfig(),
  data: null, // {gastos, receitas, investimentos, metas}
  selectedMonth: currentMonthKey(),
  editing: null // {type, row}
};

const charts = {};

// ---------- Config ----------

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem('cf_config') || 'null');
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  localStorage.setItem('cf_config', JSON.stringify(cfg));
  state.config = cfg;
}

function isConfigured() {
  return !!(state.config && state.config.url && state.config.token);
}

// ---------- Navigation ----------

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  const btn = document.querySelector(`.tab-btn[data-view="${name}"]`);
  if (btn) btn.classList.add('active');
  if (name === 'dashboard') refreshDashboard();
  if (name === 'lista') refreshLista();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

document.getElementById('btnMetas').addEventListener('click', () => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-metas').classList.add('active');
  refreshMetas();
});

document.getElementById('btnConfig').addEventListener('click', () => {
  document.getElementById('cfgUrl').value = state.config?.url || '';
  document.getElementById('cfgToken').value = state.config?.token || '';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-config').classList.add('active');
});

document.getElementById('btnSaveConfig').addEventListener('click', () => {
  const url = document.getElementById('cfgUrl').value.trim();
  const token = document.getElementById('cfgToken').value.trim();
  saveConfig(url && token ? { url, token } : null);
  const status = document.getElementById('cfgStatus');
  status.textContent = url && token ? 'Salvo! Indo pro dashboard...' : 'Config limpa — voltando ao modo demonstração.';
  state.data = null;
  setTimeout(() => showView('dashboard'), 600);
});

// ---------- API ----------

let loadingCount = 0;
let loadingTimer = null;

function beginLoading() {
  loadingCount++;
  if (loadingCount === 1) {
    loadingTimer = setTimeout(() => {
      document.getElementById('loadingBar').hidden = false;
    }, 150);
  }
}

function endLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    clearTimeout(loadingTimer);
    document.getElementById('loadingBar').hidden = true;
  }
}

async function apiGet() {
  if (!isConfigured()) return demoData();
  beginLoading();
  try {
    const res = await fetch(`${state.config.url}?token=${encodeURIComponent(state.config.token)}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados');
    return json;
  } finally {
    endLoading();
  }
}

async function apiPost(type, data, action = 'create', row = null) {
  if (!isConfigured()) {
    throw new Error('Configure a URL do Apps Script no botão de configurações antes de salvar lançamentos reais.');
  }
  const body = { token: state.config.token, type, action };
  if (data) body.data = data;
  if (row) body.row = row;
  beginLoading();
  try {
    const res = await fetch(state.config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Erro ao salvar');
    return json;
  } finally {
    endLoading();
  }
}

let pendingGet = null;

async function getData(force = false) {
  if (state.data && !force) return state.data;
  if (pendingGet) return pendingGet;
  pendingGet = apiGet()
    .then(data => {
      state.data = data;
      return data;
    })
    .finally(() => {
      pendingGet = null;
    });
  return pendingGet;
}

// ---------- Demo data ----------

function demoData() {
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const gastos = [
    { Data: iso(today), Categoria: 'Alimentação', Descrição: 'Supermercado', Valor: 320, 'Forma de Pagamento': 'Pix' },
    { Data: iso(today), Categoria: 'Transporte', Descrição: 'Combustível', Valor: 180, 'Forma de Pagamento': 'Cartão de crédito' },
    { Data: iso(today), Categoria: 'Lazer', Descrição: 'Cinema', Valor: 60, 'Forma de Pagamento': 'Pix' },
    { Data: iso(today), Categoria: 'Moradia', Descrição: 'Aluguel', Valor: 1200, 'Forma de Pagamento': 'Pix' },
    { Data: iso(today), Categoria: 'Saúde', Descrição: 'Farmácia', Valor: 90, 'Forma de Pagamento': 'Cartão de débito' }
  ];
  const receitas = [
    { Data: iso(today), Fonte: 'Salário', Descrição: 'Salário mensal', Valor: 3500 }
  ];
  const investimentos = [0, 1, 2, 3].map(i => {
    const d = new Date(today.getFullYear(), today.getMonth() - (3 - i), 5);
    return { Data: iso(d), Tipo: 'Renda Fixa', Corretora: 'XP', 'Valor Aportado': 500, 'Valor Atual': 500 + i * 180 };
  });
  const metas = [
    { Categoria: 'Moradia', 'Meta Mensal': 1300 },
    { Categoria: 'Alimentação', 'Meta Mensal': 600 },
    { Categoria: 'Transporte', 'Meta Mensal': 300 },
    { Categoria: 'Lazer', 'Meta Mensal': 200 },
    { Categoria: 'Saúde', 'Meta Mensal': 200 }
  ];
  const saldos = [
    { Data: iso(today), Conta: 'Banco Principal', Saldo: 2450.30 },
    { Data: iso(today), Conta: 'Carteira Digital', Saldo: 380 }
  ];
  return { ok: true, gastos, receitas, investimentos, metas, saldos, demo: true };
}

// ---------- Dashboard ----------

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function shiftMonthKey(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  return currentMonthKey(new Date(y, m - 1 + delta, 1));
}

function updateMonthLabels() {
  document.querySelectorAll('.month-label').forEach(el => {
    el.textContent = formatMonthLabel(state.selectedMonth);
  });
}

function bindMonthNav(prevId, nextId, onChange) {
  document.getElementById(prevId).addEventListener('click', () => {
    state.selectedMonth = shiftMonthKey(state.selectedMonth, -1);
    onChange();
  });
  document.getElementById(nextId).addEventListener('click', () => {
    state.selectedMonth = shiftMonthKey(state.selectedMonth, 1);
    onChange();
  });
}

bindMonthNav('prevMonth', 'nextMonth', refreshDashboard);
bindMonthNav('prevMonthList', 'nextMonthList', refreshLista);

function fmtMoney(n) {
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function refreshDashboard() {
  let data;
  try {
    data = await getData();
  } catch (err) {
    ['cardSaldo', 'cardGasto', 'cardInvestido'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    const errorBanner = document.getElementById('errorBanner');
    errorBanner.textContent = `Não foi possível carregar a planilha: ${err.message}. Confira a URL/token no botão de configurações.`;
    errorBanner.hidden = false;
    document.getElementById('demoBanner').hidden = true;
    console.error(err);
    return;
  }

  document.getElementById('errorBanner').hidden = true;
  document.getElementById('demoBanner').hidden = !data.demo;
  updateMonthLabels();

  const monthKey = state.selectedMonth;
  const gastosMes = data.gastos.filter(g => String(g.Data).startsWith(monthKey));
  const receitasMes = data.receitas.filter(r => String(r.Data).startsWith(monthKey));

  const totalGasto = gastosMes.reduce((s, g) => s + Number(g.Valor || 0), 0);
  const totalReceita = receitasMes.reduce((s, r) => s + Number(r.Valor || 0), 0);
  const totalInvestido = data.investimentos.reduce((s, i) => s + Number(i['Valor Atual'] || 0), 0);

  document.getElementById('cardSaldo').textContent = fmtMoney(totalReceita - totalGasto);
  document.getElementById('cardGasto').textContent = fmtMoney(totalGasto);
  document.getElementById('cardInvestido').textContent = fmtMoney(totalInvestido);

  renderSaldos(data.saldos || []);
  renderAlerts(gastosMes, data.metas);
  renderPizzaChart(gastosMes);
  renderMetasChart(gastosMes, data.metas);
  renderGastoMensalChart(data.gastos);
  renderInvestChart(data.investimentos);
}

function renderGastoMensalChart(gastos, meses = 12) {
  const keys = [];
  let cursor = currentMonthKey();
  for (let i = meses - 1; i >= 0; i--) {
    keys.push(shiftMonthKey(cursor, -i));
  }

  const totals = keys.map(key => {
    return gastos
      .filter(g => String(g.Data).startsWith(key))
      .reduce((sum, g) => sum + Number(g.Valor || 0), 0);
  });

  const labels = keys.map(key => {
    const [y, m] = key.split('-').map(Number);
    return `${MONTH_NAMES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
  });

  const hoje = currentMonthKey();
  const cores = keys.map(key => (key === hoje ? '#4f8cff' : '#4f8cff88'));

  upsertChart('chartGastoMensal', 'bar', {
    labels,
    datasets: [{ label: 'Gasto total', data: totals, backgroundColor: cores }]
  }, { scales: { y: { beginAtZero: true } } });
}

function renderAlerts(gastosMes, metas) {
  const container = document.getElementById('budgetAlerts');
  const byCategoria = {};
  gastosMes.forEach(g => {
    byCategoria[g.Categoria] = (byCategoria[g.Categoria] || 0) + Number(g.Valor || 0);
  });

  const alerts = (metas || [])
    .map(m => {
      const meta = Number(m['Meta Mensal'] || 0);
      if (!meta) return null;
      const gasto = byCategoria[m.Categoria] || 0;
      const pct = gasto / meta;
      if (pct < 0.8) return null;
      return { categoria: m.Categoria, gasto, meta, pct };
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct);

  if (!alerts.length) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  container.hidden = false;
  container.innerHTML = alerts.map(a => {
    const over = a.pct >= 1;
    const pctLabel = Math.round(a.pct * 100);
    const msg = over
      ? `${a.categoria} já passou da meta: ${fmtMoney(a.gasto)} de ${fmtMoney(a.meta)} (${pctLabel}%)`
      : `${a.categoria} já passou de 80% da meta: ${fmtMoney(a.gasto)} de ${fmtMoney(a.meta)} (${pctLabel}%)`;
    return `
      <p class="banner alert ${over ? 'error' : 'warn'}">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>${msg}</span>
      </p>
    `;
  }).join('');
}

function renderSaldos(saldos) {
  const container = document.getElementById('listaSaldos');
  if (!saldos.length) {
    container.innerHTML = '<p class="hint">Nenhum saldo registrado ainda.</p>';
    return;
  }

  const latestByConta = {};
  saldos.forEach(s => {
    const conta = s.Conta;
    if (!latestByConta[conta] || String(s.Data) > String(latestByConta[conta].Data)) {
      latestByConta[conta] = s;
    }
  });

  const entries = Object.values(latestByConta).sort((a, b) => Number(b.Saldo) - Number(a.Saldo));
  const total = entries.reduce((sum, s) => sum + Number(s.Saldo || 0), 0);

  container.innerHTML = entries.map(s => `
    <div class="list-item">
      <span>${s.Conta} <span class="muted">(${fmtShortDate(s.Data)})</span></span>
      <span>${fmtMoney(Number(s.Saldo))}</span>
    </div>
  `).join('') + `
    <div class="list-item total-row">
      <span>Total</span>
      <span>${fmtMoney(total)}</span>
    </div>
  `;
}

// ---------- Lista ----------

async function refreshLista() {
  let data;
  try {
    data = await getData();
  } catch (err) {
    document.getElementById('listaGastosPorCategoria').innerHTML = `<p class="hint">Não foi possível carregar a planilha: ${err.message}</p>`;
    document.getElementById('listaReceitasPorFonte').innerHTML = '';
    return;
  }

  updateMonthLabels();
  const monthKey = state.selectedMonth;
  const gastosMes = data.gastos.filter(g => String(g.Data).startsWith(monthKey));
  const receitasMes = data.receitas.filter(r => String(r.Data).startsWith(monthKey));

  renderGroupList('listaGastosPorCategoria', gastosMes, 'Categoria', 'Nenhum gasto neste mês.', 'gasto');
  renderGroupList('listaReceitasPorFonte', receitasMes, 'Fonte', 'Nenhuma receita neste mês.', 'receita');
}

function renderGroupList(containerId, items, groupField, emptyMsg, type) {
  const container = document.getElementById(containerId);
  if (!items.length) {
    container.innerHTML = `<p class="hint">${emptyMsg}</p>`;
    return;
  }

  const groups = {};
  items.forEach(item => {
    const key = item[groupField] || '(sem categoria)';
    (groups[key] = groups[key] || []).push(item);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => groupTotal(groups[b]) - groupTotal(groups[a]));

  container.innerHTML = sortedKeys.map(key => {
    const groupItems = [...groups[key]].sort((a, b) => String(b.Data).localeCompare(String(a.Data)));
    const total = groupTotal(groupItems);
    const itemsHtml = groupItems.map(item => `
      <div class="list-item clickable" data-row="${item._row}">
        <span>${fmtShortDate(item.Data)} · ${item.Descrição || '(sem descrição)'}</span>
        <span>${fmtMoney(Number(item.Valor))}</span>
      </div>
    `).join('');
    return `
      <div class="group-card">
        <div class="group-header">
          <span>${key} <span class="count">(${groupItems.length})</span></span>
          <span class="group-total">${fmtMoney(total)} <span class="chevron">▾</span></span>
        </div>
        <div class="group-items collapsed">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('open');
      header.nextElementSibling.classList.toggle('collapsed');
    });
  });

  container.querySelectorAll('.list-item[data-row]').forEach(el => {
    el.addEventListener('click', () => {
      const row = Number(el.dataset.row);
      const item = items.find(it => it._row === row);
      if (item) openEditModal(type, item);
    });
  });
}

function groupTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.Valor || 0), 0);
}

function fmtShortDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return d && m ? `${d}/${m}` : String(iso);
}

function renderPizzaChart(gastosMes) {
  const byCategoria = {};
  gastosMes.forEach(g => {
    byCategoria[g.Categoria] = (byCategoria[g.Categoria] || 0) + Number(g.Valor || 0);
  });
  const labels = Object.keys(byCategoria);
  const values = Object.values(byCategoria);
  upsertChart('chartPizza', 'pie', {
    labels,
    datasets: [{ data: values, backgroundColor: palette(labels.length) }]
  });
}

function renderMetasChart(gastosMes, metas) {
  const byCategoria = {};
  gastosMes.forEach(g => {
    byCategoria[g.Categoria] = (byCategoria[g.Categoria] || 0) + Number(g.Valor || 0);
  });
  const labels = metas.map(m => m.Categoria);
  const realizado = labels.map(c => byCategoria[c] || 0);
  const meta = metas.map(m => Number(m['Meta Mensal'] || 0));
  const cores = labels.map((c, i) => (realizado[i] > meta[i] ? '#ff5c6c' : '#3ddc84'));
  upsertChart('chartMetas', 'bar', {
    labels,
    datasets: [
      { label: 'Gasto', data: realizado, backgroundColor: cores },
      { label: 'Meta', data: meta, backgroundColor: '#4f8cff55' }
    ]
  }, { scales: { y: { beginAtZero: true } } });
}

function renderInvestChart(investimentos) {
  const sorted = [...investimentos].sort((a, b) => String(a.Data).localeCompare(String(b.Data)));
  upsertChart('chartInvest', 'line', {
    labels: sorted.map(i => i.Data),
    datasets: [{
      label: 'Valor atual',
      data: sorted.map(i => Number(i['Valor Atual'] || 0)),
      borderColor: '#4f8cff',
      backgroundColor: '#4f8cff33',
      fill: true,
      tension: 0.25
    }]
  });
}

function upsertChart(canvasId, type, data, extraOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type,
    data,
    options: { responsive: true, plugins: { legend: { labels: { color: getComputedStyle(document.body).color } } }, ...extraOptions }
  });
}

function palette(n) {
  const base = ['#4f8cff', '#3ddc84', '#ffb84f', '#ff5c6c', '#b084f7', '#4fd6ff', '#f77fb0'];
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

// ---------- Metas ----------

async function refreshMetas() {
  try {
    await getData();
  } catch (err) {
    document.getElementById('metasFields').innerHTML = `<p class="hint">Não foi possível carregar a planilha: ${err.message}</p>`;
    return;
  }
  populateMetasForm();
}

function populateMetasForm() {
  const metas = state.data?.metas || [];
  const container = document.getElementById('metasFields');
  container.innerHTML = metas.map(m => `
    <label>${m.Categoria}</label>
    <input type="number" step="0.01" min="0" data-row="${m._row}" data-categoria="${m.Categoria}" data-original="${Number(m['Meta Mensal'] || 0)}" value="${Number(m['Meta Mensal'] || 0)}">
  `).join('') || '<p class="hint">Nenhuma meta cadastrada ainda. Adicione uma categoria abaixo.</p>';
}

let metasBusy = false;
document.getElementById('formMetas').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (metasBusy) return;
  const status = document.getElementById('metasFormStatus');
  const inputs = [...document.querySelectorAll('#metasFields input[data-row]')]
    .filter(input => Number(input.value) !== Number(input.dataset.original));

  if (!inputs.length) {
    status.textContent = 'Nada para salvar.';
    status.className = 'formStatus';
    return;
  }

  metasBusy = true;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  status.textContent = 'Salvando...';
  status.className = 'formStatus';
  try {
    for (const input of inputs) {
      const data = { categoria: input.dataset.categoria, metaMensal: input.value };
      await apiPost('meta', data, 'update', Number(input.dataset.row));
      patchLocalRecord('meta', 'update', Number(input.dataset.row), data);
    }
    status.textContent = 'Metas salvas!';
    status.className = 'formStatus ok';
    populateMetasForm();
    populateCategorias();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'formStatus err';
  } finally {
    metasBusy = false;
    submitBtn.disabled = false;
  }
});

let novaMetaBusy = false;
document.getElementById('formNovaMeta').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (novaMetaBusy) return;
  novaMetaBusy = true;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  const status = document.getElementById('novaMetaStatus');
  status.textContent = 'Salvando...';
  status.className = 'formStatus';
  try {
    const fd = new FormData(e.target);
    const categoria = fd.get('categoria').trim();
    const existentes = (state.data?.metas || []).map(m => m.Categoria.toLowerCase());
    if (existentes.includes(categoria.toLowerCase())) {
      throw new Error('Essa categoria já tem uma meta cadastrada.');
    }
    const metaMensal = fd.get('metaMensal');
    const res = await apiPost('meta', { categoria, metaMensal }, 'create');
    status.textContent = 'Categoria adicionada!';
    status.className = 'formStatus ok';
    e.target.reset();
    if (state.data && res.row) {
      state.data.metas.push(buildStateObject('meta', { categoria, metaMensal }, res.row));
    }
    populateMetasForm();
    populateCategorias();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'formStatus err';
  } finally {
    novaMetaBusy = false;
    submitBtn.disabled = false;
  }
});

// ---------- Forms ----------

function populateCategorias() {
  const select = document.getElementById('categoriaSelect');
  const metas = state.data?.metas;
  const cats = metas && metas.length ? metas.map(m => m.Categoria) : DEFAULT_CATEGORIES;
  select.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

function populateFontes() {
  const select = document.getElementById('fonteSelect');
  const usadas = (state.data?.receitas || []).map(r => r.Fonte).filter(Boolean);
  const fontes = [...new Set([...DEFAULT_FONTES, ...usadas])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  select.innerHTML = fontes.map(f => `<option>${f}</option>`).join('');
}

// ---------- Importar PDF (comprovante BB) ----------

function friendlyError(message) {
  const err = new Error(message);
  err.friendly = true;
  return err;
}

let pdfJsLoadPromise = null;

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  if (pdfJsLoadPromise) return pdfJsLoadPromise;
  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(friendlyError('Não foi possível carregar o leitor de PDF.'));
    document.head.appendChild(script);
  });
  return pdfJsLoadPromise;
}

async function extractPdfItems(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  let items = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    items = items.concat(content.items.map(item => item.str));
  }
  return items.map(s => s.trim()).filter(Boolean);
}

function parseComprovanteBB(items) {
  const text = items.join(' ');
  const result = {};

  const valorMatch = text.match(/R\$\s*([\d.,]+)/);
  if (valorMatch) {
    const num = Number(valorMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) result.valor = num.toFixed(2);
  }

  const dataMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dataMatch) {
    result.data = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
  }

  if (/pix/i.test(text)) result.formaPagamento = 'Pix';

  // No comprovante do BB, o nome do recebedor vem logo depois do item "Pix - QR Code".
  const pixIdx = items.findIndex(s => /^pix\b/i.test(s));
  if (pixIdx !== -1 && items[pixIdx + 1]) {
    result.descricao = items[pixIdx + 1];
  }

  return result;
}

document.getElementById('btnImportarPdf').addEventListener('click', () => {
  document.getElementById('pdfInput').click();
});

document.getElementById('pdfInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  const form = document.getElementById('formGasto');
  const status = form.querySelector('.formStatus');
  const btn = document.getElementById('btnImportarPdf');
  btn.disabled = true;
  status.textContent = 'Lendo PDF...';
  status.className = 'formStatus';

  try {
    await loadPdfJs();
    const items = await extractPdfItems(file);
    const dados = parseComprovanteBB(items);

    if (!dados.valor || !dados.data) {
      throw friendlyError('Não consegui identificar os dados neste PDF automaticamente. Preencha manualmente.');
    }

    form.querySelector('[name="data"]').value = dados.data;
    form.querySelector('[name="valor"]').value = dados.valor;
    if (dados.descricao) form.querySelector('[name="descricao"]').value = dados.descricao;
    if (dados.formaPagamento) form.querySelector('[name="formaPagamento"]').value = dados.formaPagamento;

    status.textContent = 'Dados extraídos do PDF — confira e escolha a categoria antes de salvar.';
    status.className = 'formStatus ok';
  } catch (err) {
    status.textContent = err.friendly
      ? err.message
      : 'Não consegui ler esse PDF automaticamente. Preencha manualmente.';
    status.className = 'formStatus err';
  } finally {
    btn.disabled = false;
  }
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function setupForm(formId, type, buildData, onSuccess) {
  const form = document.getElementById(formId);
  const status = form.querySelector('.formStatus');
  const submitBtn = form.querySelector('button[type="submit"]');
  form.querySelector('input[type="date"]').value = todayISO();
  let busy = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    submitBtn.disabled = true;
    status.textContent = 'Salvando...';
    status.className = 'formStatus';
    try {
      const fd = new FormData(form);
      const data = buildData(fd);
      const res = await apiPost(type, data);
      status.textContent = 'Salvo!';
      status.className = 'formStatus ok';
      form.reset();
      form.querySelector('input[type="date"]').value = todayISO();
      if (state.data && res.row) {
        state.data[TYPE_STATE_KEY[type]].push(buildStateObject(type, data, res.row));
      }
      if (onSuccess) onSuccess(data);
    } catch (err) {
      status.textContent = err.message;
      status.className = 'formStatus err';
    } finally {
      busy = false;
      submitBtn.disabled = false;
    }
  });
}

setupForm('formGasto', 'gasto', fd => ({
  data: fd.get('data'),
  categoria: fd.get('categoria'),
  descricao: fd.get('descricao'),
  valor: fd.get('valor'),
  formaPagamento: fd.get('formaPagamento')
}));

setupForm('formReceita', 'receita', fd => ({
  data: fd.get('data'),
  fonte: fd.get('fonte'),
  descricao: fd.get('descricao'),
  valor: fd.get('valor')
}), populateFontes);

setupForm('formInvestimento', 'investimento', fd => ({
  data: fd.get('data'),
  tipo: fd.get('tipo'),
  corretora: fd.get('corretora'),
  valorAportado: fd.get('valorAportado'),
  valorAtual: fd.get('valorAtual')
}), renderListaInvestimentos);

async function renderListaInvestimentos() {
  const data = await getData();
  const list = document.getElementById('listaInvestimentos');
  const items = [...data.investimentos].reverse().slice(0, 8);
  list.innerHTML = items.map(i => `
    <div class="list-item clickable" data-row="${i._row}">
      <span>${i.Data} · ${i.Tipo} <span class="muted">(${i.Corretora})</span></span>
      <span>${fmtMoney(Number(i['Valor Atual']))}</span>
    </div>
  `).join('') || '<p class="hint">Nenhum investimento lançado ainda.</p>';

  list.querySelectorAll('.list-item[data-row]').forEach(el => {
    el.addEventListener('click', () => {
      const row = Number(el.dataset.row);
      const item = items.find(it => it._row === row);
      if (item) openEditModal('investimento', item);
    });
  });
}

// ---------- Editar / Excluir ----------

const TYPE_FIELDS = {
  gasto: [
    { key: 'data', sheetKey: 'Data', label: 'Data', type: 'date' },
    { key: 'categoria', sheetKey: 'Categoria', label: 'Categoria', type: 'select-categoria' },
    { key: 'descricao', sheetKey: 'Descrição', label: 'Descrição', type: 'text' },
    { key: 'valor', sheetKey: 'Valor', label: 'Valor (R$)', type: 'number' },
    { key: 'formaPagamento', sheetKey: 'Forma de Pagamento', label: 'Forma de pagamento', type: 'select-forma' }
  ],
  receita: [
    { key: 'data', sheetKey: 'Data', label: 'Data', type: 'date' },
    { key: 'fonte', sheetKey: 'Fonte', label: 'Fonte', type: 'select-fonte' },
    { key: 'descricao', sheetKey: 'Descrição', label: 'Descrição', type: 'text' },
    { key: 'valor', sheetKey: 'Valor', label: 'Valor (R$)', type: 'number' }
  ],
  investimento: [
    { key: 'data', sheetKey: 'Data', label: 'Data', type: 'date' },
    { key: 'tipo', sheetKey: 'Tipo', label: 'Tipo', type: 'text' },
    { key: 'corretora', sheetKey: 'Corretora', label: 'Corretora', type: 'text' },
    { key: 'valorAportado', sheetKey: 'Valor Aportado', label: 'Valor Aportado (R$)', type: 'number' },
    { key: 'valorAtual', sheetKey: 'Valor Atual', label: 'Valor Atual (R$)', type: 'number' }
  ],
  meta: [
    { key: 'categoria', sheetKey: 'Categoria', label: 'Categoria', type: 'text' },
    { key: 'metaMensal', sheetKey: 'Meta Mensal', label: 'Meta Mensal (R$)', type: 'number' }
  ]
};

const TYPE_TITLES = { gasto: 'gasto', receita: 'receita', investimento: 'investimento', meta: 'meta' };

const TYPE_STATE_KEY = { gasto: 'gastos', receita: 'receitas', investimento: 'investimentos', meta: 'metas' };

// Constrói o objeto local (mesmo formato que vem da planilha) a partir dos dados enviados,
// evitando ter que reler a planilha inteira depois de cada gravação.
function buildStateObject(type, data, row) {
  const obj = { _row: row };
  TYPE_FIELDS[type].forEach(f => {
    obj[f.sheetKey] = f.type === 'number' ? Number(data[f.key]) : data[f.key];
  });
  return obj;
}

function patchLocalRecord(type, action, row, data) {
  if (!state.data) return;
  const list = state.data[TYPE_STATE_KEY[type]];
  if (!list) return;
  const idx = list.findIndex(it => it._row === row);
  if (action === 'update') {
    if (idx !== -1) list[idx] = buildStateObject(type, data, row);
  } else if (action === 'delete') {
    if (idx !== -1) list.splice(idx, 1);
  }
}

function fieldInputHtml(f) {
  if (f.type === 'select-categoria') return `<select name="${f.key}">${document.getElementById('categoriaSelect').innerHTML}</select>`;
  if (f.type === 'select-fonte') return `<select name="${f.key}">${document.getElementById('fonteSelect').innerHTML}</select>`;
  if (f.type === 'select-forma') return `<select name="${f.key}"><option>Pix</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro</option><option>Outro</option></select>`;
  const step = f.type === 'number' ? ' step="0.01" min="0"' : '';
  return `<input type="${f.type}" name="${f.key}"${step}>`;
}

function setModalBusy(busy) {
  document.querySelector('#formEdit button[type="submit"]').disabled = busy;
  document.getElementById('btnDeleteEdit').disabled = busy;
}

function openEditModal(type, item) {
  state.editing = { type, row: item._row, busy: false };
  document.getElementById('editModalTitle').textContent = 'Editar ' + TYPE_TITLES[type];
  const fields = TYPE_FIELDS[type];
  const container = document.getElementById('editFields');
  container.innerHTML = fields.map(f => `<label>${f.label}</label>${fieldInputHtml(f)}`).join('');

  fields.forEach(f => {
    const el = container.querySelector(`[name="${f.key}"]`);
    if (el) el.value = item[f.sheetKey] ?? '';
  });

  document.getElementById('editStatus').textContent = '';
  const deleteBtn = document.getElementById('btnDeleteEdit');
  deleteBtn.textContent = 'Excluir';
  deleteBtn.dataset.confirming = 'false';
  setModalBusy(false);
  document.getElementById('editModal').hidden = false;
}

function closeEditModal() {
  document.getElementById('editModal').hidden = true;
  state.editing = null;
}

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editModal').addEventListener('click', (e) => {
  if (e.target.id === 'editModal') closeEditModal();
});

document.getElementById('formEdit').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.editing || state.editing.busy) return;
  state.editing.busy = true;
  setModalBusy(true);
  const status = document.getElementById('editStatus');
  status.textContent = 'Salvando...';
  status.className = 'formStatus';
  try {
    const fd = new FormData(e.target);
    const data = {};
    TYPE_FIELDS[state.editing.type].forEach(f => { data[f.key] = fd.get(f.key); });
    await apiPost(state.editing.type, data, 'update', state.editing.row);
    patchLocalRecord(state.editing.type, 'update', state.editing.row, data);
    closeEditModal();
    await refreshActiveView();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'formStatus err';
    state.editing.busy = false;
    setModalBusy(false);
  }
});

document.getElementById('btnDeleteEdit').addEventListener('click', async (e) => {
  if (!state.editing || state.editing.busy) return;
  const btn = e.currentTarget;
  if (btn.dataset.confirming !== 'true') {
    btn.dataset.confirming = 'true';
    btn.textContent = 'Confirmar exclusão?';
    setTimeout(() => {
      if (btn.dataset.confirming === 'true') {
        btn.dataset.confirming = 'false';
        btn.textContent = 'Excluir';
      }
    }, 3000);
    return;
  }
  btn.dataset.confirming = 'false';
  btn.textContent = 'Excluir';
  state.editing.busy = true;
  setModalBusy(true);
  const status = document.getElementById('editStatus');
  status.textContent = 'Excluindo...';
  status.className = 'formStatus';
  try {
    await apiPost(state.editing.type, null, 'delete', state.editing.row);
    patchLocalRecord(state.editing.type, 'delete', state.editing.row);
    closeEditModal();
    await refreshActiveView();
  } catch (err) {
    state.editing.busy = false;
    setModalBusy(false);
    status.textContent = err.message;
    status.className = 'formStatus err';
  }
});

async function refreshActiveView() {
  const active = document.querySelector('.view.active');
  if (!active) return;
  if (active.id === 'view-dashboard') await refreshDashboard();
  else if (active.id === 'view-lista') await refreshLista();
  else if (active.id === 'view-investimento') await renderListaInvestimentos();
}

// ---------- Init ----------

(async function init() {
  document.getElementById('cfgUrl').value = state.config?.url || '';
  document.getElementById('cfgToken').value = state.config?.token || '';
  try {
    await getData();
  } catch (err) {
    console.error(err);
  }
  populateCategorias();
  populateFontes();
  renderListaInvestimentos();
  showView('dashboard');
})();
