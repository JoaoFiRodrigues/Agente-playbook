// pdf.js — gerador PDF premium
// Cores Cards: Roxo #4A1A6B | Laranja #E8640A | Branco #FFFFFF

let ultimoRegistroId = null;

function limparTexto(text) {
  return text
    .split('\n')
    .filter(linha => {
      const l = linha.trim();
      // Remove linhas de meta-instrução que não devem aparecer no PDF
      if (/^INSTRUC[AÃ]O:/i.test(l)) return false;
      if (/^Defina aqui/i.test(l)) return false;
      if (/^Preencha/i.test(l)) return false;
      if (/^\[.*\]$/.test(l)) return false; // remove [placeholders]
      if (/^_{3,}$/.test(l)) return false; // remove ___
      if (/^\*{3,}$/.test(l)) return false; // remove ***
      return true;
    })
    .join('\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-]\s+/gm, '• ')
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
  if (l.startsWith('•')) return 'bullet';
  if (l.toUpperCase() === l && l.length > 4 && l.length < 80) return 'titulo';
  return 'paragrafo';
}

async function gerarPDF() {
  if (!lastGeneratedContent || !lastDados) { alert('Gere um playbook primeiro.'); return; }

  const modal = document.getElementById('pdf-modal');
  modal.style.display = 'flex';
  setModal('Gerando PDF...', 'Formatando o playbook para ' + lastDados.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');
  const prog = (pct, msg, delay = 0) =>
    new Promise(r => setTimeout(() => { bar.style.width = pct + '%'; step.textContent = msg; r(); }, delay));

  const ROXO    = [74,  26,  107];
  const LARANJA = [232, 100,  10];
  const BRANCO  = [255, 255, 255];
  const CINZA   = [248, 245, 252];
  const TEXTO   = [30,  30,   30];

  try {
    await prog(8, 'Configurando documento A4...', 100);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ML = 25, MR = 20, MT = 28, MB = 22;
    const TW = W - ML - MR;

    // ── CAPA ──────────────────────────────────────────────────────
    await prog(15, 'Desenhando capa...', 400);
    doc.setFillColor(...ROXO); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...LARANJA); doc.rect(0, 0, 8, H, 'F');
    doc.setFillColor(232, 100, 10); doc.circle(W + 10, H + 10, 75, 'F');
    doc.setFillColor(100, 50, 140); doc.circle(W - 5, 30, 40, 'F');

    doc.setFillColor(...LARANJA);
    doc.roundedRect(ML, 30, 105, 10, 3, 3, 'F');
    doc.setFont('times', 'bold'); doc.setFontSize(8); doc.setTextColor(...BRANCO);
    doc.text('PLAYBOOK ESTRATEGICO · EXCLUSIVO', ML + 5, 36.5);

    doc.setFont('times', 'bold'); doc.setFontSize(30); doc.setTextColor(...BRANCO);
    const escLines = doc.splitTextToSize(lastDados.escritorio.toUpperCase(), TW - 10);
    doc.text(escLines, ML, 62);
    const escH = escLines.length * 13;

    doc.setFont('times', 'italic'); doc.setFontSize(14); doc.setTextColor(210, 180, 240);
    doc.text('Guia de Transformacao e Potencializacao', ML, 62 + escH + 6);

    const sepY = 62 + escH + 18;
    doc.setDrawColor(...LARANJA); doc.setLineWidth(1.2); doc.line(ML, sepY, ML + TW, sepY);

    doc.setFont('times', 'normal'); doc.setFontSize(9); doc.setTextColor(190, 160, 220);
    doc.text('Elaborado especialmente para', ML, sepY + 14);

    doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(...BRANCO);
    doc.text(lastDados.nome, ML, sepY + 26);

    doc.setFont('times', 'italic'); doc.setFontSize(13); doc.setTextColor(210, 180, 240);
    doc.text(lastDados.cargo || 'Socio-Diretor', ML, sepY + 36);

    if (lastDados.cidade) {
      doc.setFontSize(11); doc.setTextColor(170, 140, 200);
      doc.text(lastDados.cidade, ML, sepY + 46);
    }

    doc.setFillColor(...LARANJA); doc.rect(ML, H - 50, TW, 28, 'F');
    doc.setFont('times', 'bold'); doc.setFontSize(10); doc.setTextColor(...BRANCO);
    doc.text('NOSSA MISSAO', ML + 6, H - 40);
    doc.setFont('times', 'normal'); doc.setFontSize(10);
    const missLines = doc.splitTextToSize(
      'Transformar e Potencializar Contabilidades - de obrigacoes para assessoria estrategica.',
      TW - 12
    );
    doc.text(missLines, ML + 6, H - 33);

    doc.setFont('times', 'italic'); doc.setFontSize(8); doc.setTextColor(170, 140, 200);
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(hoje, W - MR, H - 8, { align: 'right' });

    // ── SUMÁRIO ───────────────────────────────────────────────────
    await prog(28, 'Montando sumario...', 300);
    doc.addPage();
    doc.setFillColor(...CINZA); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...ROXO); doc.rect(0, 0, W, 18, 'F');
    doc.setFillColor(...LARANJA); doc.rect(0, 0, 8, 18, 'F');
    doc.setFont('times', 'bold'); doc.setFontSize(12); doc.setTextColor(...BRANCO);
    doc.text('SUMARIO', ML, 12);

    let cy = 36;
    const sumItems = [
      ['1','Apresentacao e Proposito'],
      ['2','Panorama do Mercado Contabil Brasileiro'],
      ['3','Diagnostico Personalizado'],
      ['4','Mapa de Transformacao'],
      ['5','Caderno de Exercicios Praticos'],
      ['6','Agenda Estrategica - Primeiros 90 Dias'],
      ['7','Calculadora de Precificacao'],
      ['8','Protocolo de Reuniao com Cliente'],
      ['9','Proximos Passos e Convite a Parceria'],
    ];
    sumItems.forEach(([num, titulo]) => {
      doc.setFillColor(...ROXO); doc.circle(ML + 4, cy - 2, 4, 'F');
      doc.setFont('times', 'bold'); doc.setFontSize(9); doc.setTextColor(...BRANCO);
      doc.text(num, ML + 4, cy - 1.5, { align: 'center' });
      doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(...TEXTO);
      doc.text(titulo, ML + 12, cy);
      doc.setDrawColor(200, 190, 210); doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 2], 0); doc.line(ML + 12, cy + 3, W - MR, cy + 3);
      doc.setLineDashPattern([], 0);
      cy += 16;
    });

    // ── CONTEÚDO ──────────────────────────────────────────────────
    await prog(45, 'Formatando conteudo...', 400);

    const textoLimpo = limparTexto(lastGeneratedContent);
    const linhas = textoLimpo.split('\n');

    doc.addPage();
    doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F');

    let py = MT;
    let pageNum = 3;
    let primeiraLinha = true;

    const addPageHeader = () => {
      doc.setFillColor(...ROXO); doc.rect(0, 0, W, 12, 'F');
      doc.setFillColor(...LARANJA); doc.rect(0, 0, 6, 12, 'F');
      doc.setFont('times', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...BRANCO);
      const sn = lastDados.escritorio.length > 45
        ? lastDados.escritorio.substring(0, 42) + '...' : lastDados.escritorio;
      doc.text(sn + ' · Playbook Estrategico', ML, 8.5);
      doc.text(String(pageNum), W - MR, 8.5, { align: 'right' });
      pageNum++; py = MT; primeiraLinha = true;
    };
    addPageHeader();

    const checkPage = (esp = 20) => {
      if (py > H - MB - esp) {
        doc.addPage();
        doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F');
        addPageHeader();
      }
    };

    for (const rawLinha of linhas) {
      const linha = rawLinha.trimEnd();
      const tipo  = tipoLinha(linha);

      if (tipo === 'vazio') { py += 3; continue; }

      if (tipo === 'titulo') {
        checkPage(35);
        if (!primeiraLinha) py += 5;
        doc.setFillColor(240, 232, 252); doc.roundedRect(ML - 3, py - 6, TW + 6, 13, 2, 2, 'F');
        doc.setFillColor(...LARANJA); doc.rect(ML - 3, py - 6, 3, 13, 'F');
        doc.setFont('times', 'bold'); doc.setFontSize(13); doc.setTextColor(...ROXO);
        const tl = doc.splitTextToSize(linha, TW - 5);
        doc.text(tl, ML + 3, py + 1);
        py += tl.length * 7 + 5;
        primeiraLinha = false;
        continue;
      }

      if (tipo === 'bullet') {
        checkPage(12);
        const texto = linha.replace(/^•\s*/, '');
        const tl = doc.splitTextToSize(texto, TW - 8);
        doc.setFillColor(...LARANJA); doc.circle(ML + 2, py - 1.5, 1.5, 'F');
        doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(...TEXTO);
        doc.text(tl, ML + 7, py);
        py += tl.length * 6.5 + 2;
        primeiraLinha = false;
        continue;
      }

      // parágrafo
      checkPage(14);
      doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(...TEXTO);
      const tl = doc.splitTextToSize(linha, TW);
      doc.text(tl, ML, py);
      py += tl.length * 6.5 + 1;
      primeiraLinha = false;
    }

    // ── CONTRA-CAPA ───────────────────────────────────────────────
    await prog(88, 'Adicionando contra-capa...', 300);
    doc.addPage();
    doc.setFillColor(...ROXO); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...LARANJA); doc.rect(0, 0, 8, H, 'F');
    doc.setFillColor(...LARANJA); doc.rect(0, H - 8, W, 8, 'F');
    doc.setFillColor(100, 50, 140); doc.circle(W + 5, H / 2, 80, 'F');

    doc.setFont('times', 'bold'); doc.setFontSize(52); doc.setTextColor(...LARANJA);
    doc.text('\u2605', W / 2, 75, { align: 'center' });

    doc.setFont('times', 'bold'); doc.setFontSize(24); doc.setTextColor(...BRANCO);
    const ctaL = doc.splitTextToSize('Pronto para transformar\nseu escritorio?', TW);
    doc.text(ctaL, W / 2, 102, { align: 'center' });

    doc.setFont('times', 'italic'); doc.setFontSize(12); doc.setTextColor(210, 180, 240);
    const subL = doc.splitTextToSize(
      'Este playbook e apenas o comeco. Nossa equipe esta preparada para caminhar com voce em cada etapa desta transformacao.',
      TW - 15
    );
    doc.text(subL, W / 2, 132, { align: 'center' });

    doc.setFillColor(...LARANJA); doc.roundedRect(ML, 158, TW, 52, 5, 5, 'F');
    doc.setFont('times', 'bold'); doc.setFontSize(13); doc.setTextColor(...BRANCO);
    doc.text('PROXIMOS PASSOS', W / 2, 172, { align: 'center' });
    doc.setFont('times', 'normal'); doc.setFontSize(11);
    ['->  Agende uma reuniao estrategica gratuita',
     '->  Defina metas de crescimento com nosso time',
     '->  Inicie sua transformacao nos proximos 7 dias']
      .forEach((p, i) => doc.text(p, W / 2, 184 + i * 9, { align: 'center' }));

    doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(190, 160, 220);
    doc.text('Missao: Transformar e Potencializar Contabilidades', W / 2, H - 14, { align: 'center' });
    doc.text(new Date().getFullYear().toString(), W / 2, H - 9, { align: 'center' });

    await prog(100, 'Finalizando...', 200);

    const filename = 'Playbook_' + lastDados.escritorio.replace(/[^a-zA-Z0-9]/g, '_') + '_' +
      new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf';

    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const link = document.getElementById('pdf-link');
    link.href = url; link.download = filename;

    if (ultimoRegistroId) Storage.updateStatus(ultimoRegistroId, 'PDF Gerado');
    setModal('PDF Pronto! \uD83C\uDF89', 'Playbook de "' + lastDados.escritorio + '" gerado com sucesso.', true);

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
  document.getElementById('pdf-bar').style.width = '0';
  document.getElementById('pdf-bar').style.background = '';
}