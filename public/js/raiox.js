// raiox.js — Módulo Raio-X CardSinova
// Lê Excel do Google Forms e gera diagnóstico completo via IA

// ── MAPEAMENTO DAS COLUNAS DO FORMULÁRIO ─────────────────────────
const COLS = {
  timestamp:    0,  // Carimbo de data/hora
  escritorio:   1,  // Razão social / nome fantasia
  cidade:       2,  // Cidade/Estado
  tempoExiste:  3,  // Há quanto tempo existe
  colaboradores:4,  // Quantos colaboradores
  faturamento:  5,  // Faixa de faturamento
  regimes:      6,  // Regimes atendidos
  processos:    7,  // Processos documentados
  orgNota:      8,  // Nota organização 0-10
  liderancas:   9,  // Lideranças por área
  reunioes:     10, // Reuniões de acompanhamento
  dorGestao:    11, // Maior dor de gestão
  vendedor:     12, // Responsável por vendas
  indicadores:  13, // Acompanha indicadores
  ticketMedio:  14, // Sabe ticket médio
  metas2026:    15, // Metas 2026
  mudancaCliente:16,// O que mudar na relação com clientes
  servicosAlem: 17, // Serviços além do básico
  novosServicos:18, // Interesse em novos serviços
  novoServico:  19, // Qual lançar em 2026
  reformaNivel: 20, // Nível na reforma tributária
  reformaComun: 21, // Comunicou sobre reforma
  reformaPreoc: 22, // Preocupação com reforma
  percepcaoCliente:23, // Como clientes enxergam
  conteudo:     24, // Produz conteúdo
  diferencial:  25, // Diferencial percebido
  visao2026:    26, // Visão dezembro 2026
  disposicao:   27, // Disposição para mudar 0-10
  infoExtra:    28, // Info extra para Fernando
};

// ── ÁREAS DE DIAGNÓSTICO ──────────────────────────────────────────
const AREAS = [
  { id: 'gestao',      nome: 'Gestão e Processos',         cols: [7,8,9,10,11] },
  { id: 'comercial',   nome: 'Comercial e Crescimento',    cols: [12,13,14,15,16] },
  { id: 'produtos',    nome: 'Produtos e Serviços',        cols: [17,18,19,20] },
  { id: 'tributario',  nome: 'Reforma Tributária',         cols: [20,21,22] },
  { id: 'posicionamento', nome: 'Posicionamento e Marca',  cols: [23,24,25] },
  { id: 'prontidao',   nome: 'Prontidão para Mudança',     cols: [27] },
];

// ── ESTADO ────────────────────────────────────────────────────────
let rxEmpresas    = [];
let rxSelecionada = null;
let rxConteudo    = '';

// ── INICIALIZAÇÃO DA VIEW ─────────────────────────────────────────
function initRaioX() {
  document.getElementById('rx-empresa-lista').innerHTML = '';
  document.getElementById('rx-resultado').style.display = 'none';
  document.getElementById('rx-selecao').style.display   = '';
  rxEmpresas    = [];
  rxSelecionada = null;
  rxConteudo    = '';
}

// ── LEITURA DO EXCEL ──────────────────────────────────────────────
function rxLerExcel(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data  = new Uint8Array(e.target.result);
      const wb    = XLSX.read(data, { type: 'array' });
      const ws    = wb.Sheets[wb.SheetNames[0]];
      const rows  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rows.length < 2) {
        rxMostrarErro('Arquivo vazio ou sem respostas.');
        return;
      }

      // Ignora linha 0 (cabeçalhos) e processa respostas
      rxEmpresas = rows.slice(1)
        .filter(r => r[COLS.escritorio] && String(r[COLS.escritorio]).trim())
        .map((r, idx) => ({
          idx,
          escritorio:   String(r[COLS.escritorio] || '').trim(),
          cidade:       String(r[COLS.cidade] || '').trim(),
          timestamp:    r[COLS.timestamp] || '',
          respostas:    r,
        }));

      if (!rxEmpresas.length) {
        rxMostrarErro('Nenhuma empresa encontrada no arquivo.');
        return;
      }

      rxRenderizarLista();
    } catch(err) {
      rxMostrarErro('Erro ao ler arquivo: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function rxMostrarErro(msg) {
  document.getElementById('rx-upload-msg').textContent = msg;
  document.getElementById('rx-upload-msg').style.color = '#991b1b';
}

// ── RENDERIZA LISTA DE EMPRESAS ───────────────────────────────────
function rxRenderizarLista() {
  const lista = document.getElementById('rx-empresa-lista');
  const msg   = document.getElementById('rx-upload-msg');

  msg.textContent = rxEmpresas.length + ' empresa(s) encontrada(s) — selecione para gerar o Raio-X';
  msg.style.color = '#1a7a4a';

  lista.innerHTML = rxEmpresas.map((emp, i) => `
    <div class="rx-empresa-card" onclick="rxSelecionarEmpresa(${i})" id="rxcard-${i}">
      <div class="rx-emp-nome">${emp.escritorio}</div>
      <div class="rx-emp-info">${emp.cidade || '—'}</div>
    </div>
  `).join('');

  document.getElementById('rx-lista-wrap').style.display = 'block';
}

// ── SELECIONA EMPRESA ─────────────────────────────────────────────
function rxSelecionarEmpresa(idx) {
  // Remove seleção anterior
  document.querySelectorAll('.rx-empresa-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('rxcard-' + idx)?.classList.add('sel');

  rxSelecionada = rxEmpresas[idx];

  // Mostra painel de confirmação
  const painel = document.getElementById('rx-confirmar');
  painel.style.display = 'flex';
  document.getElementById('rx-confirmar-nome').textContent = rxSelecionada.escritorio;
  document.getElementById('rx-confirmar-cidade').textContent = rxSelecionada.cidade || '—';
}

// ── GERA RAIO-X ───────────────────────────────────────────────────
const rxLoadMsgs = [
  'Lendo respostas do formulário...',
  'Calculando notas por área...',
  'Identificando pontos críticos...',
  'Comparando com benchmarks do mercado...',
  'Criando plano de ação personalizado...',
  'Elaborando exercícios práticos...',
  'Montando diagnóstico completo...',
  'Finalizando o Raio-X...',
];

async function rxGerar() {
  if (!rxSelecionada) return;

  // Muda para view de resultado
  document.getElementById('rx-selecao').style.display   = 'none';
  document.getElementById('rx-resultado').style.display = '';
  document.getElementById('rx-res-titulo').textContent   = 'Gerando Raio-X...';
  document.getElementById('rx-res-sub').textContent      = rxSelecionada.escritorio;
  document.getElementById('rx-loading').style.display    = '';
  document.getElementById('rx-output').style.display     = 'none';
  document.getElementById('rx-actions').style.display    = 'none';

  const barEl = document.getElementById('rx-bar');
  const msgEl = document.getElementById('rx-msg');
  let mi = 0, pct = 0;

  const interval = setInterval(() => {
    msgEl.textContent = rxLoadMsgs[mi % rxLoadMsgs.length];
    pct = Math.min(pct + 11, 88);
    barEl.style.width = pct + '%';
    mi++;
  }, 2000);

  try {
    const prompt = rxBuildPrompt(rxSelecionada);

    const res = await fetch('/api/gerar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),
    });

    clearInterval(interval);
    barEl.style.width = '100%';

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ' + res.status);
    }

    const data = await res.json();
    rxConteudo = data.content || '';

    setTimeout(() => {
      document.getElementById('rx-loading').style.display = 'none';
      const out = document.getElementById('rx-output');
      out.style.display = '';
      out.innerHTML = renderMarkdown(rxConteudo);
      document.getElementById('rx-actions').style.display = '';
      document.getElementById('rx-res-titulo').textContent = '✅ Raio-X Concluído';
      document.getElementById('rx-res-sub').textContent =
        rxSelecionada.escritorio + ' · ' + new Date().toLocaleDateString('pt-BR');

      // Salva no histórico
      Storage.add({
        escritorio:  rxSelecionada.escritorio,
        nome:        rxSelecionada.respostas[COLS.escritorio] || '—',
        cargo:       'Sócio',
        vendedor:    '—',
        segmento:    rxSelecionada.respostas[COLS.regimes] || '—',
        faturamento: rxSelecionada.respostas[COLS.faturamento] || '—',
        metaFat:     '—',
        prazo:       '—',
        cidade:      rxSelecionada.cidade,
      }, 'Raio-X Gerado');

    }, 400);

  } catch(err) {
    clearInterval(interval);
    document.getElementById('rx-loading').style.display = 'none';
    const out = document.getElementById('rx-output');
    out.style.display = '';
    out.innerHTML = `<div class="error-box"><strong>Erro:</strong> ${err.message}</div>`;
    document.getElementById('rx-actions').style.display = '';
    document.getElementById('rx-res-titulo').textContent = 'Erro no Raio-X';
  }
}

// ── PROMPT BUILDER ────────────────────────────────────────────────
function rxBuildPrompt(emp) {
  const r = emp.respostas;
  const hoje = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

  return `Você é o Fernando Muterle, especialista em transformação de escritórios contábeis no Brasil.
Com base nas respostas do Check-up Contábil 2026 abaixo, crie um PLAYBOOK PERSONALIZADO completo e profissional.

EMPRESA: ${r[COLS.escritorio]}
CIDADE: ${r[COLS.cidade]}
DATA: ${hoje}

=== RESPOSTAS DO CHECK-UP ===

PERFIL:
- Tempo de existência: ${r[COLS.tempoExiste]}
- Colaboradores: ${r[COLS.colaboradores]}
- Faturamento mensal: ${r[COLS.faturamento]}
- Regimes atendidos: ${r[COLS.regimes]}

GESTÃO E PROCESSOS:
- Processos documentados: ${r[COLS.processos]}
- Nota de organização interna (0-10): ${r[COLS.orgNota]}
- Lideranças por área: ${r[COLS.liderancas]}
- Reuniões de equipe: ${r[COLS.reunioes]}
- Maior dor de gestão: ${r[COLS.dorGestao]}

COMERCIAL E CRESCIMENTO:
- Responsável por vendas: ${r[COLS.vendedor]}
- Acompanha indicadores: ${r[COLS.indicadores]}
- Conhece ticket médio: ${r[COLS.ticketMedio]}
- Metas para 2026: ${r[COLS.metas2026]}
- O que mudar na relação com clientes: ${r[COLS.mudancaCliente]}

PRODUTOS E SERVIÇOS:
- Serviços além do básico: ${r[COLS.servicosAlem]}
- Interesse em novos serviços: ${r[COLS.novosServicos]}
- Serviço que quer lançar: ${r[COLS.novoServico]}

REFORMA TRIBUTÁRIA:
- Nível de conhecimento: ${r[COLS.reformaNivel]}
- Comunicou para clientes: ${r[COLS.reformaComun]}
- Maior preocupação: ${r[COLS.reformaPreoc]}

POSICIONAMENTO E MARCA:
- Como clientes enxergam o escritório: ${r[COLS.percepcaoCliente]}
- Produz conteúdo: ${r[COLS.conteudo]}
- Diferencial percebido: ${r[COLS.diferencial]}

VISÃO E PRONTIDÃO:
- Visão para dezembro 2026: ${r[COLS.visao2026]}
- Disposição para mudar (0-10): ${r[COLS.disposicao]}
- Informação extra: ${r[COLS.infoExtra]}

=== ESTRUTURA DO PLAYBOOK ===

Gere o playbook com EXATAMENTE estas seções na ordem abaixo:

# PLAYBOOK ESTRATÉGICO — ${r[COLS.escritorio]}

## INTRODUÇÃO
Escreva uma introdução calorosa e personalizada de 3 parágrafos dirigida ao dono do escritório.
Parágrafo 1: Contextualize o momento atual do mercado contábil brasileiro e por que 2026 é decisivo.
Parágrafo 2: Fale sobre o que você enxergou nas respostas de ${r[COLS.escritorio]} — cite dados reais que ele informou (faturamento, tempo de existência, equipe, regimes, serviços atuais).
Parágrafo 3: Explique o que este playbook vai entregar e como usar na prática.

## ANÁLISE DE DADOS DO ESCRITÓRIO
Faça uma análise profunda e honesta com base nos números e dados reais informados.

- Faturamento atual (${r[COLS.faturamento]}) e o que isso representa no mercado contábil
- Ticket médio estimado: com ${r[COLS.colaboradores]} colaboradores e faturamento de ${r[COLS.faturamento]}, calcule o ticket médio por cliente e compare com o benchmark do setor (ticket médio nacional gira em torno de R$ 600 a R$ 1.200/cliente/mês)
- Capacidade produtiva: análise da relação colaboradores x clientes x faturamento
- Gargalos financeiros identificados: cite as respostas sobre processos (${r[COLS.processos]}), indicadores (${r[COLS.indicadores]}) e ticket médio (${r[COLS.ticketMedio]})
- Oportunidade de receita não capturada: quanto este escritório está deixando na mesa com base no perfil atual
- Avaliação da organização interna: nota ${r[COLS.orgNota]}/10 — o que isso impacta no faturamento
- Resumo: 3 números que definem o momento atual do escritório

## PLANO DE NOVOS PRODUTOS
Com base no nicho, regimes atendidos (${r[COLS.regimes]}), serviços atuais (${r[COLS.servicosAlem]}) e o serviço que quer lançar (${r[COLS.novoServico]}), apresente 2 produtos novos altamente adequados para este escritório.

Para cada produto siga EXATAMENTE esta estrutura:

PRODUTO 1 — [Nome do Produto]
- O que é: descrição em 2 linhas do que é o serviço
- Por que faz sentido para ${r[COLS.escritorio]}: justificativa baseada nas respostas reais
- Público-alvo dentro da base de clientes: qual perfil de cliente da carteira se beneficia mais
- Como entregar: passo a passo simplificado de como operacionalizar
- Precificação sugerida: faixa de preço com base no mercado e no porte do escritório
- Potencial de receita adicional: estimativa mensal se 30% da base aderir

PRODUTO 2 — [Nome do Produto]
- O que é: descrição em 2 linhas
- Por que faz sentido para ${r[COLS.escritorio]}: justificativa baseada nas respostas reais
- Público-alvo dentro da base de clientes
- Como entregar: passo a passo simplificado
- Precificação sugerida
- Potencial de receita adicional

## PLANO DE AÇÃO — 90 DIAS
Plano semanal detalhado e prático. Para cada semana, escreva ações reais e específicas — não genéricas.

FASE 1 — ORGANIZAR (Semanas 1 a 4)

Semana 1 — [Tema da semana]:
- Ação 1 com exemplo prático de como fazer
- Ação 2 com exemplo prático
- Ação 3 com exemplo prático
Resultado esperado ao final da semana:

Semana 2 — [Tema da semana]:
- Ação 1 com exemplo prático
- Ação 2 com exemplo prático
- Ação 3 com exemplo prático
Resultado esperado ao final da semana:

Semana 3 — [Tema da semana]:
- Ação 1 com exemplo prático
- Ação 2 com exemplo prático
- Ação 3 com exemplo prático
Resultado esperado ao final da semana:

Semana 4 — [Tema da semana]:
- Ação 1 com exemplo prático
- Ação 2 com exemplo prático
- Ação 3 com exemplo prático
Resultado esperado ao final da semana:

FASE 2 — ESTRUTURAR (Semanas 5 a 8)

Semana 5 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 6 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 7 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 8 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

FASE 3 — CRESCER (Semanas 9 a 12)

Semana 9 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 10 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 11 — [Tema]:
- 3 ações com exemplos práticos
Resultado esperado:

Semana 12 — Consolidação e próximos passos:
- 3 ações finais
- Onde o escritório deve estar ao final dos 90 dias: metas concretas de faturamento, novos produtos ativos, indicadores
Resultado esperado:

REGRAS CRÍTICAS:
1. NUNCA escreva "INSTRUÇÃO:", "Defina aqui", "Preencha", "[coloque aqui]" ou qualquer meta-instrução. Tudo deve estar escrito e completo.
2. Cite o nome "${r[COLS.escritorio]}" e dados reais das respostas ao longo de todo o documento.
3. Exemplos práticos devem ser reais e aplicáveis para o segmento contábil — não genéricos.
4. Tom: direto, empático, motivador. Fale como mentor que conhece o negócio.
5. Formatação: use # para títulos, - para bullets. Sem tabelas markdown. Sem caracteres especiais.
6. Cada seção deve ter conteúdo COMPLETO — nunca um título sem corpo.`;
}


// ── NOVO RAIO-X ───────────────────────────────────────────────────
function rxNovo() {
  document.getElementById('rx-resultado').style.display = 'none';
  document.getElementById('rx-selecao').style.display   = '';
  rxConteudo    = '';
  rxSelecionada = null;
  // Mantém a lista carregada
  if (rxEmpresas.length) {
    document.querySelectorAll('.rx-empresa-card').forEach(c => c.classList.remove('sel'));
    document.getElementById('rx-confirmar').style.display = 'none';
    document.getElementById('rx-lista-wrap').style.display = 'block';
  }
}

// ── GERAR PDF DO RAIO-X ───────────────────────────────────────────
async function rxGerarPDF() {
  if (!rxConteudo || !rxSelecionada) { alert('Gere o Raio-X primeiro.'); return; }

  // Reutiliza o modal de PDF existente
  document.getElementById('pdf-modal').style.display = 'flex';
  setModal('Gerando PDF do Raio-X...', 'Formatando diagnóstico de ' + rxSelecionada.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');
  const prog = (pct, msg, delay) =>
    new Promise(r => setTimeout(() => { bar.style.width = pct+'%'; step.textContent = msg; r(); }, delay||0));

  const COR = {
    roxo:      [102, 16,  129],
    laranja:   [241, 152,   0],
    branco:    [255, 255, 255],
    cinza:     [248, 244, 252],
    texto:     [ 30,  30,  30],
    roxoClaro: [237, 220, 245],
    roxoMedio: [120,  40, 160],
  };

  function sf(doc, weight, size, cor) {
    doc.setFont('helvetica', weight === 'bold' ? 'bold' : 'normal');
    doc.setFontSize(size);
    if (cor) doc.setTextColor(...cor);
  }

  try {
    await prog(8, 'Configurando documento...', 100);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W=210, H=297, ML=25, MR=20, MT=28, MB=22;
    const TW = W - ML - MR;

    // ── CAPA RAIO-X ───────────────────────────────────────────────
    await prog(18, 'Desenhando capa...', 300);

    doc.setFillColor(...COR.roxo);
    doc.rect(0,0,W,H,'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0,0,8,H,'F');
    doc.setFillColor(...COR.laranja);
    doc.circle(W+14,H+14,80,'F');
    doc.setFillColor(...COR.roxoMedio);
    doc.circle(W+8,10,58,'F');

    // Badge Raio-X
    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML,30,80,11,3,3,'F');
    sf(doc,'bold',8,COR.branco);
    doc.text('RAIO-X CONTABIL  |  2026', ML+5, 37.2);

    // Nome da empresa
    sf(doc,'bold',27,COR.branco);
    const escL = doc.splitTextToSize(rxSelecionada.escritorio.toUpperCase(), TW-10);
    doc.text(escL, ML, 63);
    const escH = escL.length * 11.5;

    sf(doc,'normal',13,[220,190,240]);
    doc.text('Diagnostico Completo e Plano de Acao Personalizado', ML, 63+escH+7);

    const sepY = 63+escH+19;
    doc.setDrawColor(...COR.laranja);
    doc.setLineWidth(1.2);
    doc.line(ML, sepY, ML+TW, sepY);

    sf(doc,'normal',9,[200,170,230]);
    doc.text('Diagnostico elaborado por', ML, sepY+13);
    sf(doc,'bold',18,COR.branco);
    doc.text('Fernando Muterle', ML, sepY+25);
    sf(doc,'normal',12,[220,190,240]);
    doc.text('CardSinova — Transformar e Potencializar Contabilidades', ML, sepY+35);

    if (rxSelecionada.cidade) {
      sf(doc,'normal',10,[180,150,210]);
      doc.text(rxSelecionada.cidade, ML, sepY+47);
    }

    // Bloco missão
    doc.setFillColor(...COR.laranja);
    doc.rect(ML,H-52,TW,30,'F');
    sf(doc,'bold',10,COR.branco);
    doc.text('CHECK-UP CONTABIL 2026', ML+6,H-41);
    sf(doc,'normal',10,COR.branco);
    const missL = doc.splitTextToSize(
      'Este Raio-X foi gerado com base nas respostas do formulario de diagnostico respondido pelo proprio escritorio.',
      TW-14
    );
    doc.text(missL, ML+6, H-33);

    sf(doc,'normal',8,[180,150,210]);
    doc.text(
      new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}),
      W-MR, H-9, {align:'right'}
    );

    // ── CONTEÚDO ──────────────────────────────────────────────────
    await prog(45, 'Formatando diagnostico...', 400);

    // Limpa markdown
    const textoLimpo = rxConteudo
      .split('\n')
      .filter(l => {
        const t = l.trim();
        if (/^#{1,6}\s+/g.test(t)) return true;
        return true;
      })
      .join('\n')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^[-]\s+/gm, '* ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\|.+\|/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const linhas = textoLimpo.split('\n');

    doc.addPage();
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,'F');

    let py=MT, pageNum=2, primera=true;

    const addHdr = () => {
      doc.setFillColor(...COR.roxo); doc.rect(0,0,W,13,'F');
      doc.setFillColor(...COR.laranja); doc.rect(0,0,6,13,'F');
      sf(doc,'normal',7.5,COR.branco);
      const sn = rxSelecionada.escritorio.length>48
        ? rxSelecionada.escritorio.slice(0,45)+'...' : rxSelecionada.escritorio;
      doc.text(sn+'  |  Raio-X Contabil 2026', ML, 9);
      doc.text(String(pageNum), W-MR, 9, {align:'right'});
      pageNum++; py=MT; primera=true;
    };
    addHdr();

    const chkPg = (esp) => {
      if (py > H-MB-(esp||22)) {
        doc.addPage();
        doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');
        addHdr();
      }
    };

    const tipoL = (l) => {
      const t = l.trim();
      if (!t) return 'vazio';
      if (t.startsWith('* ')) return 'bullet';
      if (t.toUpperCase()===t && t.length>3 && t.length<90 && !/^\d/.test(t)) return 'titulo';
      return 'paragrafo';
    };

    for (const rawL of linhas) {
      const linha = rawL.trimEnd();
      const tipo  = tipoL(linha);

      if (tipo==='vazio') { py+=4; continue; }

      if (tipo==='titulo') {
        chkPg(36);
        if (!primera) py+=6;
        doc.setFillColor(...COR.roxoClaro);
        doc.roundedRect(ML-3,py-7,TW+6,14,2,2,'F');
        doc.setFillColor(...COR.laranja);
        doc.rect(ML-3,py-7,3.5,14,'F');
        sf(doc,'bold',12,COR.roxo);
        const tl=doc.splitTextToSize(linha,TW-8);
        doc.text(tl,ML+4,py+1);
        py+=tl.length*7+6; primera=false; continue;
      }

      if (tipo==='bullet') {
        chkPg(12);
        const txt=linha.replace(/^\*\s*/,'');
        const tl=doc.splitTextToSize(txt,TW-9);
        doc.setFillColor(...COR.laranja);
        doc.circle(ML+2.5,py-1.8,1.8,'F');
        sf(doc,'normal',11,COR.texto);
        doc.text(tl,ML+8,py);
        py+=tl.length*6.5+2.5; primera=false; continue;
      }

      chkPg(14);
      sf(doc,'normal',11,COR.texto);
      const tl=doc.splitTextToSize(linha,TW);
      doc.text(tl,ML,py);
      py+=tl.length*6.5+1.5; primera=false;
    }

    // ── CONTRA-CAPA ───────────────────────────────────────────────
    await prog(90,'Finalizando...',300);

    doc.addPage();
    doc.setFillColor(...COR.roxo); doc.rect(0,0,W,H,'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0,0,8,H,'F');
    doc.rect(0,H-9,W,9,'F');
    doc.setFillColor(...COR.roxoMedio); doc.circle(W+10,H/2,88,'F');

    // Forma decorativa
    const cx=W/2, dy=68, dr=16;
    doc.setFillColor(...COR.laranja);
    doc.triangle(cx,dy-dr,cx-dr*0.65,dy+dr*0.4,cx+dr*0.65,dy+dr*0.4,'F');
    doc.triangle(cx,dy+dr,cx-dr*0.65,dy-dr*0.4,cx+dr*0.65,dy-dr*0.4,'F');

    sf(doc,'bold',22,COR.branco);
    doc.text('Agora e hora de agir!', W/2,105,{align:'center'});
    sf(doc,'normal',12,[220,190,240]);
    const subL2=doc.splitTextToSize(
      'Seu Raio-X esta pronto. Os proximos 90 dias sao decisivos para transformar seu escritorio.',
      TW-20
    );
    doc.text(subL2,W/2,122,{align:'center'});

    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML,148,TW,65,6,6,'F');
    sf(doc,'bold',13,COR.branco);
    doc.text('PROXIMOS PASSOS', W/2,162,{align:'center'});
    sf(doc,'normal',11,COR.branco);
    [
      'Revise seu plano de acao e escolha 1 prioridade',
      'Agende uma reuniao estrategica com Fernando',
      'Implemente a acao da semana 1 ainda hoje',
      'Conecte-se a comunidade CardSinova',
    ].forEach((p,i) => {
      const yp = 174+i*11;
      doc.setFillColor(...COR.branco);
      doc.circle(ML+10,yp-2,1.5,'F');
      sf(doc,'normal',11,COR.branco);
      doc.text(p,ML+16,yp);
    });

    sf(doc,'normal',9,[200,170,230]);
    doc.text('CardSinova  |  Transformar e Potencializar Contabilidades', W/2,H-13,{align:'center'});
    sf(doc,'normal',8,[180,150,210]);
    doc.text(String(new Date().getFullYear()), W/2,H-8,{align:'center'});

    await prog(100,'Concluído!',200);

    const fname='RaioX_'+rxSelecionada.escritorio.replace(/[^a-zA-Z0-9]/g,'_')+'_'+
      new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.pdf';
    const url=URL.createObjectURL(doc.output('blob'));
    const lnk=document.getElementById('pdf-link');
    lnk.href=url; lnk.download=fname;
    setModal('PDF do Raio-X Pronto!','Diagnostico de "'+rxSelecionada.escritorio+'" gerado.',true);

  } catch(err) {
    document.getElementById('pdf-bar').style.background='#ef4444';
    setModal('Erro ao gerar PDF', err.message, true);
    console.error(err);
  }
}