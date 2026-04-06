// ══════════════════════════════════════════════
// PÁGINAS DE CONTEÚDO (REFATORADO)
// ══════════════════════════════════════════════
await prog(50, 'Formatando conteudo...', 400);

const textoLimpo = limparTexto(lastGeneratedContent);
const linhas     = textoLimpo.split('\n');

doc.addPage();
doc.setFillColor(255, 255, 255);
doc.rect(0, 0, W, H, 'F');

let py = MT, pageNum = 4, primeiraLinha = true;
let secaoAtual = 0;
const totalSecoes = linhas.filter(l => tipoLinha(l.trim()) === 'titulo').length;

const addHeader = () => {
  // Fundo branco com barra lateral
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 16, 'F');
  
  // Barra lateral colorida (gradiente simulado)
  doc.setFillColor(...COR.roxo);
  doc.rect(0, 0, 4, 16, 'F');
  
  // Linha separadora
  doc.setDrawColor(...COR.roxoClaro);
  doc.setLineWidth(0.5);
  doc.line(0, 16, W, 16);
  
  // Nome do escritório (esquerda)
  setFont(doc, 'bold', 8, COR.roxo);
  const sn = lastDados.escritorio.length > 48
    ? lastDados.escritorio.slice(0, 45) + '...' : lastDados.escritorio;
  doc.text(sn, 8, 11);
  
  // Número da página (direita)
  setFont(doc, 'normal', 8, [120, 120, 120]);
  doc.text('Página ' + String(pageNum), W - MR, 11, { align: 'right' });
  
  // Barra de progresso no topo
  const progWidth = (pageNum - 3) / 15 * (W - ML - MR);
  doc.setFillColor(...COR.laranja);
  doc.rect(ML, 13.5, progWidth, 1.5, 'F');
  doc.setDrawColor(...COR.roxoClaro);
  doc.setLineWidth(0.3);
  doc.rect(ML, 13.5, W - ML - MR, 1.5, 'S');
  
  pageNum++;
  py = MT;
  primeiraLinha = true;
};
addHeader();

const checkPg = (esp) => {
  if (py > H - MB - (esp || 22)) {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');
    addHeader();
  }
};

let numSecao = 1;

for (const rawL of linhas) {
  const linha = rawL.trimEnd();
  const tipo  = tipoLinha(linha);

  if (tipo === 'vazio') { py += 3; continue; }

  // ── TÍTULOS (SEÇÕES) ──────────────────────────────
  if (tipo === 'titulo') {
    secaoAtual++;
    checkPg(48);
    if (!primeiraLinha) py += 8;
    
    // Barra lateral do título
    doc.setFillColor(...COR.roxo);
    doc.rect(ML - 3, py - 8, 4, 18, 'F');
    
    // Número da seção em círculo
    doc.setFillColor(...COR.laranja);
    doc.circle(ML + 8, py - 2, 5.5, 'F');
    setFont(doc, 'bold', 11, COR.branco);
    doc.text(String(numSecao), ML + 8, py + 0.5, { align: 'center' });
    
    // Título principal
    setFont(doc, 'bold', 14, COR.roxo);
    const tl = doc.splitTextToSize(linha, TW - 20);
    doc.text(tl, ML + 18, py - 2);
    
    // Linha decorativa abaixo
    doc.setDrawColor(...COR.laranja);
    doc.setLineWidth(1.2);
    doc.line(ML + 18, py + tl.length * 6 + 2, ML + 35, py + tl.length * 6 + 2);
    
    py += tl.length * 7 + 10;
    primeiraLinha = false;
    numSecao++;
    continue;
  }

  // ── BULLETS (ITENS) ───────────────────────────────
  if (tipo === 'bullet') {
    checkPg(14);
    const txt = linha.replace(/^\*\s*/, '');
    const tl  = doc.splitTextToSize(txt, TW - 12);
    
    // Ícone/marcador com fundo
    doc.setFillColor(...COR.roxoClaro);
    doc.roundedRect(ML, py - 4, 5, 5, 1, 1, 'F');
    doc.setFillColor(...COR.laranja);
    doc.circle(ML + 2.5, py - 1.5, 1.2, 'F');
    
    // Texto do bullet
    setFont(doc, 'normal', 10.5, COR.texto);
    doc.text(tl, ML + 8, py);
    
    py += tl.length * 6 + 3;
    primeiraLinha = false;
    continue;
  }

  // ── PARÁGRAFOS ────────────────────────────────────
  checkPg(14);
  
  // Detecta se é uma citação ou destaque (começa com aspas ou é muito curto)
  const ehCitacao = linha.startsWith('"') || (linha.length < 100 && linha.length > 20);
  
  if (ehCitacao && linha.length < 150) {
    // Card de destaque/citação
    doc.setFillColor(...COR.roxoClaro);
    const citH = 16;
    doc.roundedRect(ML, py - 5, TW, citH, 3, 3, 'F');
    
    // Barra lateral colorida
    doc.setFillColor(...COR.laranja);
    doc.rect(ML, py - 5, 3, citH, 'F');
    
    setFont(doc, 'italic', 11, COR.roxo);
    const citL = doc.splitTextToSize(linha, TW - 8);
    doc.text(citL, ML + 6, py + 1);
    
    py += citH + 3;
  } else {
    // Parágrafo normal com espaçamento melhorado
    setFont(doc, 'normal', 10.5, COR.texto);
    const tl = doc.splitTextToSize(linha, TW);
    doc.text(tl, ML, py);
    py += tl.length * 6.5 + 2;
  }
  
  primeiraLinha = false;
}

// ══════════════════════════════════════════════
// RODAPÉ CUSTOMIZADO (INSIGHT)
// ══════════════════════════════════════════════

// Função auxiliar para adicionar rodapé em cada página
const insights = [
  '💡 Foco: Transforme processos em vantagem competitiva',
  '📊 Métrica: Acompanhe progresso a cada 30 dias',
  '🎯 Ação: Implemente uma mudança por semana',
  '⚡ Resultado: Veja impacto em 90 dias',
  '🚀 Escala: Multiplique seu modelo de negócio',
];

// Adiciona rodapé customizado nas páginas de conteúdo
// (Integre isso na função addHeader se quiser em todas as páginas)