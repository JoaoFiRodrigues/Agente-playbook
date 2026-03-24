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
Com base nas respostas do Check-up Contábil 2026, crie um PLAYBOOK COMPLETO E EXTENSO de pelo menos 15 páginas A4.
Escreva com profundidade real — cada seção deve ter parágrafos completos, exemplos concretos e análises detalhadas.
NUNCA seja genérico. Cite o nome da empresa e dados reais das respostas em todo o documento.

EMPRESA: ${r[COLS.escritorio]}
CIDADE: ${r[COLS.cidade]}
DATA: ${hoje}

=== DADOS DO CHECK-UP ===

PERFIL:
- Tempo de existência: ${r[COLS.tempoExiste]}
- Colaboradores: ${r[COLS.colaboradores]}
- Faturamento mensal: ${r[COLS.faturamento]}
- Regimes atendidos: ${r[COLS.regimes]}

GESTÃO E PROCESSOS:
- Processos documentados: ${r[COLS.processos]}
- Nota de organização (0-10): ${r[COLS.orgNota]}
- Lideranças por área: ${r[COLS.liderancas]}
- Reuniões de equipe: ${r[COLS.reunioes]}
- Maior dor de gestão: ${r[COLS.dorGestao]}

COMERCIAL:
- Responsável por vendas: ${r[COLS.vendedor]}
- Acompanha indicadores: ${r[COLS.indicadores]}
- Conhece ticket médio: ${r[COLS.ticketMedio]}
- Metas 2026: ${r[COLS.metas2026]}
- O que mudar com clientes: ${r[COLS.mudancaCliente]}

PRODUTOS E SERVIÇOS:
- Serviços atuais além do básico: ${r[COLS.servicosAlem]}
- Interesse em novos serviços: ${r[COLS.novosServicos]}
- Serviço que quer lançar: ${r[COLS.novoServico]}

REFORMA TRIBUTÁRIA:
- Nível de conhecimento: ${r[COLS.reformaNivel]}
- Comunicou clientes: ${r[COLS.reformaComun]}
- Maior preocupação: ${r[COLS.reformaPreoc]}

POSICIONAMENTO:
- Como clientes enxergam: ${r[COLS.percepcaoCliente]}
- Produz conteúdo: ${r[COLS.conteudo]}
- Diferencial percebido: ${r[COLS.diferencial]}

VISÃO:
- Visão dezembro 2026: ${r[COLS.visao2026]}
- Disposição para mudar (0-10): ${r[COLS.disposicao]}
- Info extra: ${r[COLS.infoExtra]}

=== ESTRUTURA DO PLAYBOOK (MÍNIMO 15 PÁGINAS) ===

# PLAYBOOK ESTRATÉGICO — ${r[COLS.escritorio]}

## 1. INTRODUÇÃO
Escreva 5 parágrafos completos e ricos:

Parágrafo 1 — O momento do mercado contábil brasileiro em 2026: explique as mudanças do setor, a reforma tributária, a digitalização, o avanço das contabilidades digitais e por que os próximos 12 meses são decisivos para escritórios tradicionais. Use dados reais do setor (mais de 600 mil contadores no Brasil, mercado de R$60 bilhões, 70% ainda operam como fábricas de obrigações).

Parágrafo 2 — O perfil de ${r[COLS.escritorio]}: contextualize o escritório dentro do mercado. Fale sobre o tempo de existência (${r[COLS.tempoExiste]}), a equipe (${r[COLS.colaboradores]} colaboradores), o faturamento atual (${r[COLS.faturamento]}), os regimes atendidos (${r[COLS.regimes]}) e os serviços que já oferece (${r[COLS.servicosAlem]}). Mostre que você entende a realidade deles.

Parágrafo 3 — O que as respostas revelaram: fale sobre os pontos que mais chamaram atenção no check-up — a dor de gestão (${r[COLS.dorGestao]}), a situação comercial (${r[COLS.vendedor]}), a nota de organização (${r[COLS.orgNota]}/10) e a visão de futuro (${r[COLS.visao2026]}). Seja direto e empático.

Parágrafo 4 — A oportunidade real: com base no perfil, mostre o potencial de crescimento que existe. Quanto este escritório poderia faturar com ajustes simples? Qual é o gap entre onde estão e onde poderiam estar em 12 meses?

Parágrafo 5 — Como usar este playbook: explique que o documento tem análise de dados, dois novos produtos prontos para lançar e um plano de ação semana a semana para 90 dias. Instrua o leitor a não apenas ler, mas executar.

## 2. ANÁLISE COMPLETA DE DADOS DO ESCRITÓRIO
Esta seção deve ter pelo menos 4 páginas de conteúdo. Seja analítico, use cálculos reais e comparativos de mercado.

### 2.1 Retrato Financeiro Atual
- Faturamento mensal de ${r[COLS.faturamento]}: o que isso representa no contexto nacional (percentil do mercado, comparativo com escritórios do mesmo porte e cidade)
- Estimativa de número de clientes na base: com base no faturamento e porte, estime quantos clientes o escritório deve ter
- Ticket médio calculado: faça o cálculo real (faturamento ÷ estimativa de clientes) e compare com o benchmark nacional (R$ 600 a R$ 1.200/cliente/mês para escritórios de pequeno e médio porte)
- Receita por colaborador: calcule e compare com o padrão do setor (R$ 8.000 a R$ 15.000/colaborador/mês em escritórios bem estruturados)
- Análise da margem: considerando custos típicos de um escritório contábil (folha, sistemas, aluguel), estime a margem atual e o que seria saudável

### 2.2 Diagnóstico Operacional
Analise cada ponto abaixo com pelo menos 3 linhas de conteúdo cada:
- Processos e documentação: o que significa ter "${r[COLS.processos]}" no contexto de um escritório em crescimento. Quais riscos isso gera. Qual o impacto no faturamento e na capacidade de escalar.
- Estrutura de liderança: "${r[COLS.liderancas]}" — o que isso diz sobre a dependência do sócio, o gargalo operacional e a dificuldade de crescer sem contratar.
- Rituais de gestão: reuniões "${r[COLS.reunioes]}" — como isso impacta a produtividade e o alinhamento da equipe. O que escritórios de alta performance fazem diferente.
- A maior dor: "${r[COLS.dorGestao]}" — aprofunde essa dor. Por que ela existe, quais são as consequências reais no dia a dia e no faturamento, e o que precisa mudar para resolvê-la.

### 2.3 Diagnóstico Comercial
Analise com profundidade:
- Ausência de estrutura comercial: "${r[COLS.vendedor]}" — o que acontece quando o sócio é o único vendedor. Calcule quantas horas por semana isso consome e o custo de oportunidade.
- Indicadores comerciais: "${r[COLS.indicadores]}" — sem números, não há gestão. Quais indicadores este escritório deveria acompanhar hoje e por quê.
- Conhecimento do ticket médio: "${r[COLS.ticketMedio]}" — o que isso revela sobre o controle financeiro do negócio.
- Metas para 2026: "${r[COLS.metas2026]}" — analise se essa meta é compatível com a estrutura atual. O que precisaria mudar para atingi-la.
- Oportunidade de receita não capturada: com base no perfil, calcule quanto este escritório está deixando de ganhar por mês (clientes que poderiam pagar mais, serviços que poderiam ser cobrados, reajustes atrasados).

### 2.4 Diagnóstico de Posicionamento
- Como os clientes enxergam o escritório: "${r[COLS.percepcaoCliente]}" — o que isso significa para o ticket médio, para a retenção e para a capacidade de vender novos serviços.
- Produção de conteúdo: "${r[COLS.conteudo]}" — no mercado contábil atual, escritórios que educam seus clientes cobram até 40% mais. O que ${r[COLS.escritorio]} está perdendo.
- Diferencial percebido: "${r[COLS.diferencial]}" — avalie se esse diferencial é forte o suficiente para justificar preço premium. O que poderia fortalecer o posicionamento.
- Reforma tributária: nível "${r[COLS.reformaNivel]}" com preocupação "${r[COLS.reformaPreoc]}" — como isso se torna uma oportunidade comercial imediata.

### 2.5 Números que Definem o Momento
Crie um resumo com os 5 números mais importantes identificados na análise:
Número 1: [métrica] — [valor calculado] — [o que significa]
Número 2: [métrica] — [valor calculado] — [o que significa]
Número 3: [métrica] — [valor calculado] — [o que significa]
Número 4: [métrica] — [valor calculado] — [o que significa]
Número 5: [métrica] — [valor calculado] — [o que significa]

## 3. PLANO DE NOVOS PRODUTOS
Esta seção deve ter pelo menos 3 páginas. Detalhe cada produto como se fosse um mini business plan.

Com base no nicho (${r[COLS.regimes]}), serviços atuais (${r[COLS.servicosAlem]}), interesse declarado (${r[COLS.novoServico]}) e perfil da base de clientes, apresente 2 produtos ideais para lançar nos próximos 90 dias.

### PRODUTO 1 — [Nome do Produto]

O que é este serviço:
Escreva 2 parágrafos explicando o serviço, o que ele entrega ao cliente final e por que ele se encaixa perfeitamente no portfólio de ${r[COLS.escritorio]}.

Por que faz sentido para este escritório agora:
Justifique com dados das respostas. Conecte com as dores, metas e perfil da base de clientes. Mostre que não é uma aposta, é uma certeza baseada em dados.

Quem na base de clientes vai querer:
Descreva o perfil exato do cliente ideal para este serviço dentro da carteira atual. Dê exemplos de tipos de empresas (MEI, Simples Nacional, Lucro Presumido) que mais se beneficiam.

Como estruturar e entregar:
Passo 1 — [ação concreta]
Passo 2 — [ação concreta]
Passo 3 — [ação concreta]
Passo 4 — [ação concreta]
Passo 5 — [ação concreta]

Precificação e modelo de cobrança:
- Faixa de preço sugerida: R$ X a R$ Y por mês
- Modelo: [recorrente / por projeto / por demanda]
- Justificativa do preço: por que este valor faz sentido para o mercado e para o porte dos clientes de ${r[COLS.escritorio]}
- Como apresentar para o cliente sem parecer "vendendo algo a mais"

Projeção de receita:
- Se 20% da base aderir: R$ X por mês
- Se 30% da base aderir: R$ X por mês
- Se 50% da base aderir: R$ X por mês
- Prazo estimado para o produto se pagar (considerando tempo de implementação)

Exemplo prático de abordagem:
Escreva um script real de como o dono do escritório pode apresentar este serviço para um cliente durante uma reunião de rotina. Mínimo 5 linhas de diálogo.

### PRODUTO 2 — [Nome do Produto]

O que é este serviço:
Escreva 2 parágrafos completos.

Por que faz sentido para este escritório agora:
Justificativa baseada nos dados das respostas.

Quem na base de clientes vai querer:
Perfil detalhado do cliente ideal.

Como estruturar e entregar:
Passo 1 ao Passo 5 com ações concretas.

Precificação e modelo de cobrança:
- Faixa de preço, modelo e justificativa
- Como apresentar para o cliente

Projeção de receita:
- Cenários de 20%, 30% e 50% de adesão

Exemplo prático de abordagem:
Script real de apresentação ao cliente.

## 4. PLANO DE AÇÃO — 90 DIAS
Esta seção deve ter pelo menos 4 páginas. Cada semana com tema claro, 3 ações detalhadas com exemplos práticos reais e resultado esperado mensurável.

### FASE 1 — ORGANIZAR (Semanas 1 a 4)
Objetivo desta fase: arrumar a casa antes de crescer. Resolver os gargalos internos que impedem a expansão.

Semana 1 — [Tema específico baseado na maior dor: ${r[COLS.dorGestao]}]:
- Ação 1: [o que fazer] — Exemplo prático: [como fazer na prática, com detalhes reais]
- Ação 2: [o que fazer] — Exemplo prático: [como fazer na prática]
- Ação 3: [o que fazer] — Exemplo prático: [como fazer na prática]
Resultado esperado ao final da semana: [meta concreta e mensurável]

Semana 2 — [Tema específico]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 3 — [Tema específico]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 4 — [Tema específico]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]
Resultado da Fase 1 completa: [onde o escritório deve estar ao final do mês 1]

### FASE 2 — ESTRUTURAR (Semanas 5 a 8)
Objetivo desta fase: criar a estrutura que vai sustentar o crescimento. Lançar os novos produtos e estruturar o comercial.

Semana 5 — [Tema — início do lançamento do Produto 1]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 6 — [Tema]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 7 — [Tema — início do lançamento do Produto 2]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 8 — [Tema]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]
Resultado da Fase 2 completa: [onde o escritório deve estar ao final do mês 2]

### FASE 3 — CRESCER (Semanas 9 a 12)
Objetivo desta fase: acelerar, consolidar receita e preparar o próximo ciclo de crescimento.

Semana 9 — [Tema]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 10 — [Tema]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 11 — [Tema]:
- Ação 1 com exemplo prático detalhado
- Ação 2 com exemplo prático detalhado
- Ação 3 com exemplo prático detalhado
Resultado esperado: [meta concreta]

Semana 12 — Consolidação e Visão do Próximo Ciclo:
- Ação 1: revisão completa dos 90 dias — o que funcionou, o que ajustar
- Ação 2: definição das metas para os próximos 90 dias
- Ação 3: planejamento do próximo produto ou expansão de serviço
Resultado final dos 90 dias: descreva em detalhes onde ${r[COLS.escritorio]} deve estar — faturamento esperado, produtos ativos, estrutura comercial, novos clientes, indicadores funcionando.

REGRAS ABSOLUTAS:
1. Escreva no mínimo 15 páginas A4 de conteúdo. Seja extenso, rico e detalhado.
2. NUNCA escreva meta-instruções como "INSTRUÇÃO:", "[coloque aqui]", "Defina", "Preencha". Tudo já escrito e completo.
3. Cite "${r[COLS.escritorio]}" pelo nome em pelo menos 3 vezes por seção.
4. Todos os números devem ser calculados e reais — não estimativas vagas.
5. Exemplos práticos devem ser específicos para contabilidade — não genéricos de negócios.
6. Tom: Fernando Muterle falando diretamente com o dono do escritório. Direto, empático, sem enrolação.
7. Formatação: use # para títulos principais, ## para subtítulos, - para bullets. Sem tabelas markdown.
8. Cada seção deve ter no mínimo 3 parágrafos ou 6 bullets detalhados.`;
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