// ── RENDERIZAR CONTEÚDO EM CARDS ESTRUTURADOS ──────────────────────
function renderizarConteudoEmCards(doc, textoLimpo, W, H, ML, MR, TW, pageNum) {
  const linhas = textoLimpo.split('\n');
  
  // Cores
  const corFundo = [245, 238, 250];      // roxo claro
  const corBarra = [241, 152, 0];        // laranja
  const corTitulo = [102, 16, 129];      // roxo escuro
  const corSubtitulo = [90, 90, 90];     // cinza
  const corTexto = [30, 30, 30];         // texto escuro
  const corDivisor = [200, 150, 220];    // roxo suave para divisor
  
  // Dimensões
  const paddingCard = 5;
  const larguraBarra = 4;
  const margemCard = 10;
  const MT = 28;
  const MB = 22;
  const alturaHeader = 13;
  
  let py = MT;
  let pageNum_local = pageNum;
  
  // Função para desenhar header da página
  const desenharHeader = () => {
    doc.setFillColor(...[102, 16, 129]);
    doc.rect(0, 0, W, alturaHeader, 'F');
    doc.setFillColor(...[241, 152, 0]);
    doc.rect(0, 0, 6, alturaHeader, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Playbook Estrategico', ML, 9);
    doc.text(String(pageNum_local), W - MR, 9, { align: 'right' });
    pageNum_local++;
    py = MT;
  };
  
  // Função para desenhar um card completo com estrutura
  const desenharCard = (titulo, conteudo) => {
    // ── INÍCIO: Título com barra lateral ──
    const alturaTitulo = 10;
    
    // Verificar se cabe na página
    if (py + alturaTitulo + 30 > H - MB) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, 'F');
      desenharHeader();
    }
    
    // Fundo do card
    doc.setFillColor(...corFundo);
    doc.roundedRect(ML, py, TW, 5, 2, 2, 'F');
    
    // Barra lateral laranja
    doc.setFillColor(...corBarra);
    doc.rect(ML, py, larguraBarra, 5, 'F');
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTitulo);
    const tituloLines = doc.splitTextToSize(titulo, TW - larguraBarra - paddingCard * 2);
    doc.text(tituloLines[0], ML + larguraBarra + paddingCard, py + 3.5);
    
    py += 8;
    
    // ── MEIO: Conteúdo organizado ──
    const linhasConteudo = [];
    conteudo.forEach(linha => {
      if (linha.trim().startsWith('* ')) {
        // Bullet
        const txt = linha.trim().substring(2);
        const quebradas = doc.splitTextToSize(txt, TW - larguraBarra - paddingCard * 2 - 8);
        quebradas.forEach(q => linhasConteudo.push({ tipo: 'bullet', texto: q }));
      } else if (linha.trim()) {
        // Parágrafo
        const quebradas = doc.splitTextToSize(linha.trim(), TW - larguraBarra - paddingCard * 2);
        quebradas.forEach(q => linhasConteudo.push({ tipo: 'paragrafo', texto: q }));
      }
    });
    
    // Desenhar conteúdo
    doc.setFontSize(10);
    doc.setTextColor(...corTexto);
    
    linhasConteudo.forEach((item, idx) => {
      // Verificar paginação
      if (py + 6 > H - MB) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, W, H, 'F');
        desenharHeader();
      }
      
      if (item.tipo === 'bullet') {
        // Bullet com bolinha laranja
        doc.setFillColor(...corBarra);
        doc.circle(ML + larguraBarra + paddingCard + 2, py + 1.5, 1.2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...corTexto);
        doc.text(item.texto, ML + larguraBarra + paddingCard + 6, py + 2);
      } else {
        // Parágrafo normal
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...corTexto);
        doc.text(item.texto, ML + larguraBarra + paddingCard, py + 2);
      }
      
      py += 5.5;
    });
    
    // ── FIM: Divisor visual ──
    py += 3;
    doc.setDrawColor(...corDivisor);
    doc.setLineWidth(0.5);
    doc.line(ML + larguraBarra + paddingCard, py, W - MR - paddingCard, py);
    
    py += margemCard;
  };
  
  // Processar linhas e agrupar em cards
  let tituloAtual = '';
  let conteudoAtual = [];
  
  for (const rawL of linhas) {
    const linha = rawL.trimEnd();
    const tipo = tipoLinha(linha);
    
    if (tipo === 'vazio') continue;
    
    if (tipo === 'titulo') {
      // Se há card anterior, desenha
      if (tituloAtual && conteudoAtual.length > 0) {
        desenharCard(tituloAtual, conteudoAtual);
      }
      tituloAtual = linha;
      conteudoAtual = [];
    } else {
      conteudoAtual.push(linha);
    }
  }
  
  // Desenhar último card
  if (tituloAtual && conteudoAtual.length > 0) {
    desenharCard(tituloAtual, conteudoAtual);
  }
  
  return pageNum_local;
}