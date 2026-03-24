// app.js — lógica principal do Playbook Hub

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let currentStep = 1;
let lastGeneratedContent = '';
let lastDados = null;

 
// ── NAVEGAÇÃO PRINCIPAL ───────────────────────────────────────────
function showView(name) {
  ['criar', 'dash', 'hist', 'raiox'].forEach(v => {
    document.getElementById('view-' + v).classList.toggle('active', v === name);
    document.getElementById('nav-' + v).classList.toggle('active', v === name);
  });
  if (name === 'dash')  renderDashboard();
  if (name === 'hist')  renderHistorico();
  if (name === 'raiox') initRaioX();
}
 

// ── STEPPER ───────────────────────────────────────────────────────
function goStep(n) {
  for (let i = 1; i <= 5; i++) {
    document.getElementById('step' + i).classList.toggle('active', i === n);
    const sb = document.getElementById('sb' + i);
    sb.classList.remove('active', 'done');
    if (i === n) sb.classList.add('active');
    else if (i < n) sb.classList.add('done');
  }
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(from) {
  if (from === 1) {
    const esc  = document.getElementById('f-esc').value.trim();
    const nome = document.getElementById('f-nome').value.trim();
    if (!esc || !nome) {
      alert('Preencha o nome do escritório e do responsável para continuar.');
      return;
    }
  }
  if (from < 5) goStep(from + 1);
}

// ── CAPA AO VIVO ──────────────────────────────────────────────────
function updateCover() {
  const esc   = document.getElementById('f-esc').value   || 'Nome do Escritório';
  const nome  = document.getElementById('f-nome').value  || 'Nome do Responsável';
  const cargo = document.getElementById('f-cargo').value || 'Sócio-Diretor';
  document.getElementById('cp-esc').textContent    = esc;
  document.getElementById('cp-nome').textContent   = nome;
  document.getElementById('cp-cargo').textContent  = cargo;
}

// ── TAGS ──────────────────────────────────────────────────────────
function toggleTag(el) { el.classList.toggle('sel'); }

function getSelectedTags(groupId) {
  return [...document.querySelectorAll('#' + groupId + ' .tag.sel')]
    .map(t => t.textContent.trim())
    .join(', ');
}

// ── COLETA DE DADOS ───────────────────────────────────────────────
function coletarDados() {
  const val = id => document.getElementById(id)?.value || '';
  return {
    escritorio:  val('f-esc')      || 'Escritório Contábil',
    nome:        val('f-nome')     || 'Responsável',
    cargo:       val('f-cargo')    || 'Sócio-Diretor',
    cidade:      val('f-cidade'),
    email:       val('f-email'),
    vendedor:    val('f-vendedor'),
    porte:       val('f-porte'),
    clientes:    val('f-cli'),
    faturamento: val('f-fat'),
    segmento:    val('f-seg'),
    dores:       getSelectedTags('tg-dores'),
    dorDesc:     val('f-dor'),
    objetivos:   getSelectedTags('tg-obj'),
    metaFat:     val('f-meta') + '%',
    prazo:       val('f-prazo'),
    servicos:    getSelectedTags('tg-serv'),
    msgPessoal:  val('f-msg'),
    secoes: {
      panorama:     document.getElementById('s1').checked,
      diagnostico:  document.getElementById('s2').checked,
      mapa:         document.getElementById('s3').checked,
      caderno:      document.getElementById('s4').checked,
      agenda:       document.getElementById('s5').checked,
      precificacao: document.getElementById('s6').checked,
      protocolo:    document.getElementById('s7').checked,
    },
  };
}

// ── PROMPT BUILDER ────────────────────────────────────────────────
function buildPrompt(d) {
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  let secoes = '\nMÓDULOS SELECIONADOS:';
  if (d.secoes.panorama)     secoes += '\n- Panorama do Mercado Contábil Brasileiro (com dados estatísticos reais do setor)';
  if (d.secoes.diagnostico)  secoes += '\n- Diagnóstico Personalizado baseado nas dores informadas';
  if (d.secoes.mapa)         secoes += '\n- Mapa de Transformação em 3 fases (Organizar / Crescer / Escalar)';
  if (d.secoes.caderno)      secoes += '\n- Caderno de Exercícios Práticos (3 exercícios COMPLETOS e já respondidos com exemplos reais — NUNCA deixe lacunas ou espaços em branco para preencher)';
  if (d.secoes.agenda)       secoes += '\n- Agenda Estratégica 90 dias (semana a semana)';
  if (d.secoes.precificacao) secoes += '\n- Calculadora de Precificação (método para revisar ticket médio)';
  if (d.secoes.protocolo)    secoes += '\n- Protocolo de Reunião com Cliente (script e roteiro)';

  return `Crie um PLAYBOOK ESTRATÉGICO COMPLETO com as informações abaixo.

DADOS DO PARCEIRO:
- Escritório: ${d.escritorio}
- Responsável: ${d.nome} — ${d.cargo}
- Cidade: ${d.cidade || 'Brasil'}
- Data: ${hoje}

PERFIL DO ESCRITÓRIO:
- Porte: ${d.porte || 'Não informado'}
- Clientes ativos: ${d.clientes || 'Não informado'}
- Faturamento: ${d.faturamento || 'Não informado'}
- Segmento principal: ${d.segmento || 'Geral'}

DIAGNÓSTICO DE DORES:
- Selecionadas: ${d.dores || 'Não especificado'}
- Descrição adicional: ${d.dorDesc || '—'}

OBJETIVOS E METAS:
- Objetivos: ${d.objetivos || 'Crescimento e transformação'}
- Meta de crescimento: ${d.metaFat} em ${d.prazo}
- Serviços a ampliar: ${d.servicos || 'A definir'}

MENSAGEM PERSONALIZADA:
${d.msgPessoal || 'Acreditamos no potencial de transformação do seu escritório.'}

ESTRUTURA OBRIGATÓRIA:
- Capa (com todos os dados do parceiro)
- Sumário numerado
- Carta de apresentação personalizada para ${d.nome}
${secoes}
- Contra-capa com CTA e convite para parceria

PROPÓSITO CENTRAL: Transformar e Potencializar Contabilidades

REGRAS CRÍTICAS:
1. NUNCA escreva "INSTRUÇÃO:", "Defina aqui", "Preencha", "Espaço para" ou qualquer meta-instrução. O documento é entregue diretamente ao cliente.
2. TODO conteúdo deve estar escrito e completo com exemplos reais. NUNCA deixe seção com título vazio ou sem conteúdo.
3. Exercícios: escreva o enunciado E a resposta com dados reais para ${d.escritorio}. Ex: "Exercício 1 — seus 5 principais serviços: 1. Contabilidade mensal R$800, 2. IRPF R$350..."
4. Serviços Premium: sugira 3 serviços reais para o segmento ${d.segmento} com nome, descrição e faixa de preço.
5. Use dados reais: Brasil +600mil contadores, mercado +R$60bi, 70% são fábricas de obrigações.
6. Diagnóstico específico para as dores: ${d.dores}.
7. Agenda: 3-4 ações concretas por semana, específicas e aplicáveis.
8. Tom: profissional, empático, motivador. O parceiro deve sentir exclusividade.
9. Formatação: use apenas # para títulos e - para bullets. Sem tabelas markdown.`;
}

// ── LOADING MESSAGES ──────────────────────────────────────────────
const loadMsgs = [
  'Analisando perfil do escritório...',
  'Levantando dados do mercado contábil...',
  'Criando diagnóstico personalizado...',
  'Estruturando o roadmap de transformação...',
  'Montando o caderno de exercícios...',
  'Formatando conforme padrão ABNT...',
  'Escrevendo carta de apresentação...',
  'Finalizando contra-capa e CTA...',
];

// ── GERAR PLAYBOOK ────────────────────────────────────────────────
async function gerarPlaybook() {
  lastDados = coletarDados();
  goStep(5);

  // UI: loading state
  document.getElementById('s5-title').textContent = 'Gerando Playbook...';
  document.getElementById('s5-sub').textContent   = 'A IA está criando o conteúdo para ' + lastDados.escritorio;
  document.getElementById('loading-wrap').style.display  = '';
  document.getElementById('playbook-output').style.display = 'none';
  document.getElementById('output-actions').style.display  = 'none';

  // Progress bar e mensagens
  const barEl = document.getElementById('loading-bar');
  const msgEl = document.getElementById('loading-msg');
  let   mi    = 0;
  let   pct   = 0;

  const interval = setInterval(() => {
    msgEl.textContent   = loadMsgs[mi % loadMsgs.length];
    pct = Math.min(pct + 12, 88);
    barEl.style.width   = pct + '%';
    mi++;
  }, 2000);

  try {
    // Chama a Serverless Function no Vercel (/api/gerar.js)
    const res = await fetch('/api/gerar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt: buildPrompt(lastDados), dados: lastDados }),
    });

    clearInterval(interval);
    barEl.style.width = '100%';

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ' + res.status }));
      throw new Error(err.error || 'Erro na requisição: ' + res.status);
    }

    const data = await res.json();
    lastGeneratedContent = data.content || '';

    // Salva no histórico
    const registros = Storage.add(lastDados, 'Gerado');
    ultimoRegistroId = registros[0]?.id || null;

    // UI: resultado
    setTimeout(() => {
      document.getElementById('loading-wrap').style.display  = 'none';
      const outEl = document.getElementById('playbook-output');
      outEl.style.display = '';
      outEl.innerHTML     = renderMarkdown(lastGeneratedContent);
      document.getElementById('output-actions').style.display  = '';
      document.getElementById('s5-title').textContent = '✅ Playbook Pronto!';
      document.getElementById('s5-sub').textContent   =
        lastDados.escritorio + ' · ' + new Date().toLocaleDateString('pt-BR');
    }, 400);

  } catch (err) {
    clearInterval(interval);
    document.getElementById('loading-wrap').style.display  = 'none';
    const outEl = document.getElementById('playbook-output');
    outEl.style.display = '';
    outEl.innerHTML = `
      <div class="error-box">
        <strong>Erro ao gerar o playbook:</strong><br>${err.message}<br><br>
        <em>Verifique se a variável <code>ANTHROPIC_API_KEY</code> está configurada no Vercel.</em>
      </div>`;
    document.getElementById('output-actions').style.display = '';
    document.getElementById('s5-title').textContent = 'Erro na geração';

    Storage.add(lastDados, 'Erro');
  }
}

// ── MARKDOWN RENDERER ─────────────────────────────────────────────
function renderMarkdown(md) {
  return md
    .replace(/^# (.+)$/gm,   (_, t) => `<h1>${t}</h1>`)
    .replace(/^## (.+)$/gm,  (_, t) => `<h2>${t}</h2>`)
    .replace(/^### (.+)$/gm, (_, t) => `<h3>${t}</h3>`)
    .replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
    .replace(/\*(.+?)\*/g,     (_, t) => `<em>${t}</em>`)
    .replace(/^[-•] (.+)$/gm, (_, t) => `<li>${t}</li>`)
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^(\d+)\. (.+)$/gm, (_, n, t) => `<li>${t}</li>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\|(.+)\|/g, line => {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return ''; // linha separadora
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, t => `<table><tbody>${t}</tbody></table>`);
}

// ── NOVO PLAYBOOK ─────────────────────────────────────────────────
function novoPlaybook() {
  if (!confirm('Iniciar um novo playbook? Os dados atuais serão perdidos.')) return;
  document.querySelectorAll('input[type=text], input[type=email], textarea, select')
    .forEach(el => { if (!el.disabled) el.value = ''; });
  document.querySelectorAll('.tag.sel').forEach(t => t.classList.remove('sel'));
  document.getElementById('f-meta').value = 50;
  document.getElementById('meta-val').textContent = '50%';
  lastGeneratedContent = '';
  lastDados = null;
  ultimoRegistroId = null;
  updateCover();
  goStep(1);
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function renderDashboard() {
  const list = Storage.load();
  const now  = new Date();

  document.getElementById('ds-total').textContent = list.length;

  document.getElementById('ds-mes').textContent = list.filter(i => {
    const d = new Date(i.dataISO || i.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  document.getElementById('ds-semana').textContent = list.filter(i => {
    const d    = new Date(i.dataISO || i.data);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  // Top vendedor
  const vmap = {};
  list.forEach(i => {
    if (i.vendedor && i.vendedor !== '—')
      vmap[i.vendedor] = (vmap[i.vendedor] || 0) + 1;
  });
  const topV = Object.entries(vmap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('ds-vendedor').textContent = topV
    ? topV[0].split(' ')[0] + ' (' + topV[1] + ')'
    : '—';

  // Gráfico de segmentos
  const smap = {};
  list.forEach(i => {
    if (i.segmento && i.segmento !== '—')
      smap[i.segmento] = (smap[i.segmento] || 0) + 1;
  });
  const chartEl = document.getElementById('chart-segmentos');
  const cores = ['#1B3A6B', '#2A5298', '#C8963C', '#E8B55A', '#1a7a4a', '#8b5cf6', '#ef4444'];

  if (!Object.keys(smap).length) {
    chartEl.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text2);font-size:12px">Nenhum dado ainda.</div>';
  } else {
    const max = Math.max(...Object.values(smap));
    chartEl.innerHTML = Object.entries(smap)
      .sort((a, b) => b[1] - a[1])
      .map(([seg, cnt], i) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
          <div style="width:110px;font-size:11px;color:var(--text2);text-align:right;padding-right:6px;flex-shrink:0">${seg}</div>
          <div style="flex:1;background:var(--gray);border-radius:4px;overflow:hidden;height:22px">
            <div style="height:100%;width:${Math.round(cnt / max * 100)}%;background:${cores[i % cores.length]};border-radius:4px;display:flex;align-items:center;padding:0 8px;transition:width .4s">
              <span style="font-size:10px;font-weight:600;color:#fff">${cnt}</span>
            </div>
          </div>
        </div>`).join('');
  }

  // Últimos 5
  const recentes   = list.slice(0, 5);
  const recentesEl = document.getElementById('dash-recentes');
  if (!recentes.length) {
    recentesEl.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text2);font-size:12px">Nenhum envio ainda.</div>';
  } else {
    recentesEl.innerHTML = `
      <div class="table-wrap"><table class="data-table" style="margin-top:.5rem">
        <thead><tr><th>Escritório</th><th>Responsável</th><th>Segmento</th><th>Data</th><th>Status</th></tr></thead>
        <tbody>${recentes.map(i => `
          <tr>
            <td style="font-weight:600">${i.escritorio}</td>
            <td>${i.nome}</td>
            <td>${i.segmento || '—'}</td>
            <td>${i.data}</td>
            <td><span class="pill ${pillClass(i.status)}">${i.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  }
}

// ── HISTÓRICO ─────────────────────────────────────────────────────
function renderHistorico() {
  const list   = Storage.load();
  const q      = (document.getElementById('hist-search').value || '').toLowerCase();
  const filtro = document.getElementById('hist-filtro').value;

  const filtered = list.filter(i => {
    const matchQ = !q || i.escritorio.toLowerCase().includes(q) || i.nome.toLowerCase().includes(q);
    const matchF = !filtro || i.segmento === filtro;
    return matchQ && matchF;
  });

  const bodyEl  = document.getElementById('hist-body');
  const emptyEl = document.getElementById('hist-empty');

  if (!filtered.length) {
    bodyEl.innerHTML = '';
    emptyEl.style.display = '';
    return;
  }

  emptyEl.style.display = 'none';
  bodyEl.innerHTML = filtered.map((item, idx) => `
    <tr>
      <td style="color:var(--text2);font-size:11px">${filtered.length - idx}</td>
      <td style="font-weight:600">${item.escritorio}</td>
      <td>
        ${item.nome}
        <div style="font-size:10px;color:var(--text2)">${item.cargo || ''}</div>
      </td>
      <td>${item.vendedor || '—'}</td>
      <td>${item.segmento || '—'}</td>
      <td style="white-space:nowrap">${item.data}</td>
      <td><span class="pill ${pillClass(item.status)}">${item.status}</span></td>
    </tr>`).join('');
}

function pillClass(status) {
  if (status === 'PDF Gerado') return 'pill-ok';
  if (status === 'Gerado')     return 'pill-warn';
  return 'pill-err';
}

function limparHistorico() {
  if (!confirm('Limpar todo o histórico? Esta ação não pode ser desfeita.')) return;
  Storage.clear();
  renderHistorico();
}

function exportCSV() {
  const csv = Storage.toCSV();
  if (!csv) { alert('Nenhum dado para exportar.'); return; }
  const a     = document.createElement('a');
  a.href      = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download  = 'historico_playbooks_' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.csv';
  a.click();
}