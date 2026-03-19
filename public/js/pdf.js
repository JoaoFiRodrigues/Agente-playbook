// pdf.js — Playbook Hub Cards
// Cores: Roxo #661081 | Laranja #f19800 | Branco #FFFFFF
// Fonte: Ubuntu (carregada via fetch + jsPDF VFS)

let ultimoRegistroId = null;

// ── CORES EXATAS CARDS ────────────────────────────────────────────
const COR = {
  roxo:    [102, 16,  129], // #661081
  laranja: [241, 152,   0], // #f19800
  branco:  [255, 255, 255],
  cinza:   [248, 244, 252],
  texto:   [ 30,  30,  30],
  texto2:  [ 90,  90,  90],
  roxoClaro: [237, 220, 245],
};

// ── LIMPA MARKDOWN ────────────────────────────────────────────────
function limparTexto(text) {
  return text
    .split('\n')
    .filter(linha => {
      const l = linha.trim();
      if (/^INSTRUC[AÃ]O:/i.test(l))  return false;
      if (/^Defina aqui/i.test(l))    return false;
      if (/^Preencha/i.test(l))       return false;
      if (/^\[.*\]$/.test(l))         return false;
      if (/^_{3,}$/.test(l))          return false;
      if (/^\*{3,}$/.test(l))         return false;
      return true;
    })
    .join('\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-]\s+/gm, '* ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/={3,}/g, '')
    .replace(/-{3,}/g, '')
    .replace(/\|.+\|/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tipoLinha(linha) {
  const l = linha.trim();
  if (!l) return 'vazio';
  if (l.startsWith('* ')) return 'bullet';
  if (l.toUpperCase() === l && l.length > 3 && l.length < 90 && !/^\d/.test(l)) return 'titulo';
  return 'paragrafo';
}

// ── CARREGA FONTE UBUNTU ──────────────────────────────────────────
async function carregarFonteUbuntu(doc) {
  try {
    // Carrega Ubuntu Regular e Bold do Google Fonts via fetch
    const urls = {
      regular: 'https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKfw72.woff2',
      bold:    'https://fonts.gstatic.com/s/ubuntu/v20/4iCv6KVjbNBYlgoCxCvjsGyI.woff2',
    };

    for (const [style, url] of Object.entries(urls)) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const fontName = style === 'bold' ? 'Ubuntu-Bold' : 'Ubuntu';
        doc.addFileToVFS(fontName + '.woff2', b64);
        doc.addFont(fontName + '.woff2', 'Ubuntu', style === 'bold' ? 'bold' : 'normal');
      } catch(e) { /* fallback para times */ }
    }
    return true;
  } catch(e) {
    return false;
  }
}

// ── HELPERS ───────────────────────────────────────────────────────
function setFont(doc, weight, size, cor) {
  // Tenta Ubuntu, fallback para times
  try { doc.setFont('Ubuntu', weight); } catch(e) { doc.setFont('times', weight); }
  doc.setFontSize(size);
  if (cor) doc.setTextColor(...cor);
}

// ── GERAR PDF ─────────────────────────────────────────────────────
async function gerarPDF() {
  if (!lastGeneratedContent || !lastDados) { alert('Gere um playbook primeiro.'); return; }

  const modal = document.getElementById('pdf-modal');
  modal.style.display = 'flex';
  setModal('Gerando PDF...', 'Formatando o playbook para ' + lastDados.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');
  const prog = (pct, msg, delay = 0) =>
    new Promise(r => setTimeout(() => { bar.style.width = pct + '%'; step.textContent = msg; r(); }, delay));

  try {
    await prog(5, 'Configurando documento...', 100);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ML = 25, MR = 20, MT = 28, MB = 22;
    const TW = W - ML - MR; // 165mm

    await prog(12, 'Carregando fontes Ubuntu...', 200);
    await carregarFonteUbuntu(doc);

    // ════════════════════════════════════════════════════
    // CAPA
    // ════════════════════════════════════════════════════
    await prog(20, 'Desenhando capa...', 300);

    // Fundo roxo
    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, H, 'F');

    // Barra lateral laranja
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, H, 'F');

    // Círculo decorativo canto inf direito
    doc.setFillColor(...COR.laranja);
    doc.circle(W + 12, H + 12, 78, 'F');

    // Círculo decorativo canto sup direito (roxo médio)
    doc.setFillColor(120, 40, 160);
    doc.circle(W + 5, 15, 55, 'F');

    // Badge topo
    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML, 30, 108, 11, 3, 3, 'F');
    setFont(doc, 'bold', 8, COR.branco);
    doc.text('PLAYBOOK ESTRATEGICO  |  EXCLUSIVO', ML + 5, 37);

    // Nome do escritório
    setFont(doc, 'bold', 28, COR.branco);
    const escLines = doc.splitTextToSize(lastDados.escritorio.toUpperCase(), TW - 10);
    doc.text(escLines, ML, 62);
    const escH = escLines.length * 12;

    // Subtítulo
    setFont(doc, 'normal', 13, [220, 190, 240]);
    doc.text('Guia de Transformacao e Potencializacao', ML, 62 + escH + 8);

    // Linha separadora
    const sepY = 62 + escH + 20;
    doc.setDrawColor(...COR.laranja);
    doc.setLineWidth(1.2);
    doc.line(ML, sepY, ML + TW, sepY);

    // "Elaborado para"
    setFont(doc, 'normal', 9, [200, 170, 230]);
    doc.text('Elaborado especialmente para', ML, sepY + 14);

    // Nome responsável
    setFont(doc, 'bold', 22, COR.branco);
    doc.text(lastDados.nome, ML, sepY + 27);

    // Cargo
    setFont(doc, 'normal', 13, [220, 190, 240]);
    doc.text(lastDados.cargo || 'Socio-Diretor', ML, sepY + 37);

    if (lastDados.cidade) {
      setFont(doc, 'normal', 10, [180, 150, 210]);
      doc.text(lastDados.cidade, ML, sepY + 48);
    }

    // Rodapé da capa — bloco missão
    doc.setFillColor(...COR.laranja);
    doc.rect(ML, H - 52, TW, 30, 'F');
    setFont(doc, 'bold', 10, COR.branco);
    doc.text('NOSSA MISSAO', ML + 6, H - 41);
    setFont(doc, 'normal', 10, COR.branco);
    const missLines = doc.splitTextToSize(
      'Transformar e Potencializar Contabilidades - de obrigacoes para assessoria estrategica.',
      TW - 14
    );
    doc.text(missLines, ML + 6, H - 33);

    // Data
    setFont(doc, 'normal', 8, [180, 150, 210]);
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(hoje, W - MR, H - 9, { align: 'right' });

    // ════════════════════════════════════════════════════
    // SUMÁRIO
    // ════════════════════════════════════════════════════
    await prog(32, 'Montando sumario...', 300);

    doc.addPage();
    doc.setFillColor(...COR.cinza);
    doc.rect(0, 0, W, H, 'F');

    // Header
    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, 18, 'F');
    setFont(doc, 'bold', 12, COR.branco);
    doc.text('SUMARIO', ML, 12.5);

    let cy = 36;
    const sumItems = [
      ['1', 'Apresentacao e Proposito'],
      ['2', 'Panorama do Mercado Contabil Brasileiro'],
      ['3', 'Diagnostico Personalizado'],
      ['4', 'Mapa de Transformacao'],
      ['5', 'Caderno de Exercicios Praticos'],
      ['6', 'Agenda Estrategica - Primeiros 90 Dias'],
      ['7', 'Calculadora de Precificacao'],
      ['8', 'Protocolo de Reuniao com Cliente'],
      ['9', 'Proximos Passos e Convite a Parceria'],
    ];

    sumItems.forEach(([num, titulo]) => {
      // Círculo numerado
      doc.setFillColor(...COR.roxo);
      doc.circle(ML + 4, cy - 2, 4.5, 'F');
      setFont(doc, 'bold', 9, COR.branco);
      doc.text(num, ML + 4, cy - 0.8, { align: 'center' });

      // Título
      setFont(doc, 'normal', 12, COR.texto);
      doc.text(titulo, ML + 13, cy);

      // Linha pontilhada
      doc.setDrawColor(210, 195, 220);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(ML + 13, cy + 3.5, W - MR, cy + 3.5);
      doc.setLineDashPattern([], 0);

      cy += 17;
    });

    // ════════════════════════════════════════════════════
    // CONTEÚDO
    // ════════════════════════════════════════════════════
    await prog(50, 'Formatando conteudo...', 400);

    const textoLimpo = limparTexto(lastGeneratedContent);
    const linhas = textoLimpo.split('\n');

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    let py = MT;
    let pageNum = 3;
    let primeiraLinha = true;

    const addPageHeader = () => {
      doc.setFillColor(...COR.roxo);
      doc.rect(0, 0, W, 13, 'F');
      doc.setFillColor(...COR.laranja);
      doc.rect(0, 0, 6, 13, 'F');
      setFont(doc, 'normal', 7.5, COR.branco);
      const sn = lastDados.escritorio.length > 48
        ? lastDados.escritorio.substring(0, 45) + '...'
        : lastDados.escritorio;
      doc.text(sn + '  |  Playbook Estrategico', ML, 9);
      doc.text(String(pageNum), W - MR, 9, { align: 'right' });
      pageNum++;
      py = MT;
      primeiraLinha = true;
    };
    addPageHeader();

    const checkPage = (esp = 22) => {
      if (py > H - MB - esp) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, W, H, 'F');
        addPageHeader();
      }
    };

    for (const rawLinha of linhas) {
      const linha = rawLinha.trimEnd();
      const tipo  = tipoLinha(linha);

      if (tipo === 'vazio') { py += 4; continue; }

      if (tipo === 'titulo') {
        checkPage(36);
        if (!primeiraLinha) py += 6;

        // Bloco de título com fundo roxo claro e barra laranja
        doc.setFillColor(...COR.roxoClaro);
        doc.roundedRect(ML - 3, py - 7, TW + 6, 14, 2, 2, 'F');
        doc.setFillColor(...COR.laranja);
        doc.rect(ML - 3, py - 7, 3.5, 14, 'F');

        setFont(doc, 'bold', 12, COR.roxo);
        const tl = doc.splitTextToSize(linha, TW - 8);
        doc.text(tl, ML + 4, py + 1);
        py += tl.length * 7 + 6;
        primeiraLinha = false;
        continue;
      }

      if (tipo === 'bullet') {
        checkPage(12);
        const texto = linha.replace(/^\*\s*/, '');
        const tl = doc.splitTextToSize(texto, TW - 9);

        // Bolinha laranja preenchida
        doc.setFillColor(...COR.laranja);
        doc.circle(ML + 2.5, py - 1.8, 1.8, 'F');

        setFont(doc, 'normal', 11, COR.texto);
        doc.text(tl, ML + 8, py);
        py += tl.length * 6.5 + 2.5;
        primeiraLinha = false;
        continue;
      }

      // Parágrafo
      checkPage(14);
      setFont(doc, 'normal', 11, COR.texto);
      const tl = doc.splitTextToSize(linha, TW);
      doc.text(tl, ML, py);
      py += tl.length * 6.5 + 1.5;
      primeiraLinha = false;
    }

    // ════════════════════════════════════════════════════
    // CONTRA-CAPA
    // ════════════════════════════════════════════════════
    await prog(90, 'Adicionando contra-capa...', 300);

    doc.addPage();

    // Fundo roxo
    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, H, 'F');

    // Barras decorativas
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, H, 'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0, H - 9, W, 9, 'F');

    // Círculo decorativo
    doc.setFillColor(120, 40, 160);
    doc.circle(W + 8, H / 2, 85, 'F');

    // Estrela decorativa — usando forma geométrica (sem Unicode problemático)
    // Desenha um losango/diamante estilizado no lugar da estrela
    doc.setFillColor(...COR.laranja);
    const cx = W / 2, starY = 65, r = 18;
    doc.triangle(cx, starY - r, cx - r * 0.7, starY + r * 0.4, cx + r * 0.7, starY + r * 0.4, 'F');
    doc.triangle(cx, starY + r, cx - r * 0.7, starY - r * 0.4, cx + r * 0.7, starY - r * 0.4, 'F');

    // Título CTA
    setFont(doc, 'bold', 24, COR.branco);
    const ctaLines = doc.splitTextToSize('Pronto para transformar seu escritorio?', TW - 10);
    doc.text(ctaLines, W / 2, 105, { align: 'center' });

    // Subtítulo
    setFont(doc, 'normal', 12, [220, 190, 240]);
    const subLines = doc.splitTextToSize(
      'Este playbook e apenas o comeco. Nossa equipe esta preparada para caminhar com voce em cada etapa desta transformacao.',
      TW - 20
    );
    doc.text(subLines, W / 2, 130, { align: 'center' });

    // Caixa próximos passos
    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML, 160, TW, 54, 6, 6, 'F');

    setFont(doc, 'bold', 13, COR.branco);
    doc.text('PROXIMOS PASSOS', W / 2, 174, { align: 'center' });

    setFont(doc, 'normal', 11, COR.branco);
    [
      'Agende uma reuniao estrategica gratuita',
      'Defina metas de crescimento com nosso time',
      'Inicie sua transformacao nos proximos 7 dias',
    ].forEach((p, i) => {
      // Bolinha branca
      doc.setFillColor(...COR.branco);
      doc.circle(ML + 10, 186 + i * 10 - 2, 1.5, 'F');
      setFont(doc, 'normal', 11, COR.branco);
      doc.text(p, ML + 15, 186 + i * 10);
    });

    // Rodapé missão
    setFont(doc, 'normal', 9, [200, 170, 230]);
    doc.text('Missao: Transformar e Potencializar Contabilidades', W / 2, H - 14, { align: 'center' });
    setFont(doc, 'normal', 8, [180, 150, 210]);
    doc.text(new Date().getFullYear().toString(), W / 2, H - 9, { align: 'center' });

    await prog(100, 'Finalizando...', 200);

    // ── DOWNLOAD ─────────────────────────────────────────────────
    const filename = 'Playbook_' +
      lastDados.escritorio.replace(/[^a-zA-Z0-9]/g, '_') + '_' +
      new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf';

    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const link = document.getElementById('pdf-link');
    link.href     = url;
    link.download = filename;

    if (ultimoRegistroId) Storage.updateStatus(ultimoRegistroId, 'PDF Gerado');
    setModal('PDF Pronto!', 'Playbook de "' + lastDados.escritorio + '" gerado com sucesso.', true);

  } catch (err) {
    document.getElementById('pdf-bar').style.background = '#ef4444';
    setModal('Erro ao gerar PDF', err.message, true);
    console.error('PDF error:', err);
  }
}

function setModal(title, desc, showActions) {
  document.getElementById('pdf-m-title').textContent = title;
  document.getElementById('pdf-m-desc').textContent  = desc;
  const actions = document.getElementById('pdf-actions');
  actions.style.display = showActions ? 'flex' : 'none';
  if (showActions) actions.style.justifyContent = 'flex-end';
}

function closePdfModal() {
  document.getElementById('pdf-modal').style.display = 'none';
  document.getElementById('pdf-bar').style.width     = '0';
  document.getElementById('pdf-bar').style.background = '';
}