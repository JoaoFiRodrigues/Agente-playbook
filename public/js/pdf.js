// pdf.js — gerador de PDF premium com jsPDF
// Formato ABNT A4 · Times New Roman · Capa personalizada · Contra-capa com CTA

let ultimoRegistroId = null; // referência para atualizar status após PDF

async function gerarPDF() {
  if (!lastGeneratedContent || !lastDados) {
    alert('Gere um playbook primeiro.');
    return;
  }

  // Abre modal
  const modal = document.getElementById('pdf-modal');
  modal.style.display = 'flex';
  setModal('Gerando PDF...', 'Formatando o playbook em padrão ABNT para ' + lastDados.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');

  const prog = (pct, msg, delay = 0) =>
    new Promise(r => setTimeout(() => {
      bar.style.width = pct + '%';
      step.textContent = msg;
      r();
    }, delay));

  try {
    await prog(8,  'Configurando documento A4 ABNT...', 100);
    await prog(20, 'Desenhando capa personalizada...', 500);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const ML = 30, MR = 20, MT = 30, MB = 20;
    const TW = W - ML - MR;

    // ── PÁGINA 1: CAPA ─────────────────────────────────────────────
    // Fundo azul navy
    doc.setFillColor(27, 58, 107);
    doc.rect(0, 0, W, H, 'F');

    // Barra lateral dourada
    doc.setFillColor(200, 150, 60);
    doc.rect(0, 0, 7, H, 'F');

    // Círculo decorativo (fundo)
    doc.setFillColor(200, 150, 60);
    doc.circle(W + 5, H - 10, 70, 'F'); // canto inferior direito

    // Círculo decorativo menor (canto superior)
    doc.setFillColor(255, 255, 255);
    doc.circle(W - 10, 20, 30, 'F');
    // Apaga com azul para simular transparência
    doc.setFillColor(27, 58, 107);
    doc.circle(W - 10, 20, 28, 'F');

    // Badge "Playbook Estratégico"
    doc.setFillColor(200, 150, 60);
    doc.roundedRect(ML, 32, 100, 9, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.text('PLAYBOOK ESTRATÉGICO · EXCLUSIVO', ML + 5, 38);

    // Nome do escritório
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    const escLines = doc.splitTextToSize(lastDados.escritorio.toUpperCase(), TW);
    doc.text(escLines, ML, 62);
    const escH = escLines.length * 12;

    // Subtítulo
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(180, 200, 230);
    doc.text('Guia de Transformação e Potencialização', ML, 62 + escH + 6);

    // Linha separadora dourada
    const sepY = 62 + escH + 20;
    doc.setDrawColor(200, 150, 60);
    doc.setLineWidth(1);
    doc.line(ML, sepY, ML + TW, sepY);

    // "Elaborado para"
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 180, 210);
    doc.text('Elaborado especialmente para', ML, sepY + 14);

    // Nome do responsável
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(lastDados.nome, ML, sepY + 27);

    // Cargo
    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(180, 200, 230);
    doc.text(lastDados.cargo, ML, sepY + 37);

    if (lastDados.cidade) {
      doc.setFontSize(10);
      doc.setTextColor(140, 170, 200);
      doc.text(lastDados.cidade, ML, sepY + 47);
    }

    // Bloco "Missão" no rodapé da capa
    doc.setFillColor(200, 150, 60);
    doc.rect(ML, H - 52, TW, 28, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('NOSSA MISSÃO', ML + 6, H - 43);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const missaoLines = doc.splitTextToSize(
      'Transformar e Potencializar Contabilidades — de obrigações para assessoria estratégica.',
      TW - 12
    );
    doc.text(missaoLines, ML + 6, H - 36);

    // Data no canto inferior
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 150, 180);
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(hoje, W - MR, H - 10, { align: 'right' });

    await prog(35, 'Montando sumário ABNT...', 300);

    // ── PÁGINA 2: SUMÁRIO ──────────────────────────────────────────
    doc.addPage();
    // Header da página
    doc.setFillColor(27, 58, 107);
    doc.rect(0, 0, W, 16, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('SUMÁRIO', ML, 11);

    // Conteúdo
    doc.setTextColor(27, 58, 107);
    let cy = 35;
    const sumItems = [
      ['1',  'Apresentação e Propósito',                         '3'],
      ['2',  'Panorama do Mercado Contábil Brasileiro',          '4'],
      ['3',  'Diagnóstico Personalizado',                        '6'],
      ['4',  'Mapa de Transformação',                            '8'],
      ['5',  'Caderno de Exercícios Práticos',                   '10'],
      ['6',  'Agenda Estratégica — Primeiros 90 Dias',           '14'],
      ['7',  'Calculadora de Precificação',                      '16'],
      ['8',  'Protocolo de Reunião com Cliente',                 '17'],
      ['9',  'Próximos Passos e Convite à Parceria',             '18'],
    ];

    sumItems.forEach(([num, title, pg]) => {
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(27, 58, 107);
      doc.text(num + '.', ML, cy);

      doc.setFont('times', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(title, ML + 10, cy);

      doc.setTextColor(140, 140, 140);
      doc.text(pg, W - MR, cy, { align: 'right' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(ML, cy + 2.5, W - MR, cy + 2.5);
      cy += 13;
    });

    await prog(55, 'Formatando conteúdo principal...', 400);

    // ── PÁGINAS DE CONTEÚDO ────────────────────────────────────────
    const plain = lastGeneratedContent
      .replace(/^#{1,3} (.+)$/gm, (_, t) => `§H§${t}`)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^[-•] (.+)$/gm, '• $1')
      .replace(/\n{3,}/g, '\n\n');

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    let py = MT;
    let pageNum = 3;

    const addHeader = (title) => {
      doc.setFillColor(27, 58, 107);
      doc.rect(0, 0, W, 14, 'F');
      doc.setFont('times', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      const shortEsc = lastDados.escritorio.length > 40
        ? lastDados.escritorio.substring(0, 37) + '...'
        : lastDados.escritorio;
      doc.text(shortEsc + ' · Playbook Estratégico', ML, 10);
      doc.text(String(pageNum), W - MR, 10, { align: 'right' });
      pageNum++;
      py = MT;
    };
    addHeader();

    const checkNewPage = (neededSpace = 20) => {
      if (py > H - MB - neededSpace) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, W, H, 'F');
        addHeader();
      }
    };

    for (const rawLine of plain.split('\n')) {
      const line = rawLine.trimEnd();

      if (!line) { py += 4; continue; }

      if (line.startsWith('§H§')) {
        checkNewPage(30);
        py += 4;
        doc.setFont('times', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(27, 58, 107);
        const tl = doc.splitTextToSize(line.replace('§H§', ''), TW);
        doc.text(tl, ML, py);
        py += tl.length * 7;
        // linha decorativa
        doc.setDrawColor(200, 150, 60);
        doc.setLineWidth(0.6);
        doc.line(ML, py, ML + 45, py);
        py += 7;
        continue;
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        // tabela markdown
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) continue; // pula linha separadora
        checkNewPage(12);
        const colW = TW / cells.length;
        cells.forEach((cell, ci) => {
          const isHeader = py < MT + 15 || rawLine === plain.split('\n').find(l => l.startsWith('|'));
          doc.setFont('times', isHeader ? 'bold' : 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 30, 30);
          const cx = ML + ci * colW;
          doc.rect(cx, py - 5, colW, 10, 'S');
          const cl = doc.splitTextToSize(cell, colW - 4);
          doc.text(cl[0] || '', cx + 2, py + 1);
        });
        py += 12;
        continue;
      }

      if (line.startsWith('•')) {
        checkNewPage(10);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        const tl = doc.splitTextToSize(line, TW - 6);
        doc.text(tl, ML + 4, py);
        py += tl.length * 5.5 + 2;
        continue;
      }

      checkNewPage(12);
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const tl = doc.splitTextToSize(line, TW);
      doc.text(tl, ML, py);
      py += tl.length * 5.8 + 1;
    }

    await prog(88, 'Adicionando contra-capa...', 300);

    // ── CONTRA-CAPA ────────────────────────────────────────────────
    doc.addPage();
    doc.setFillColor(27, 58, 107);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(200, 150, 60);
    doc.rect(0, 0, 7, H, 'F');
    doc.setFillColor(200, 150, 60);
    doc.rect(0, H - 7, W, 7, 'F');

    // Estrela/ícone central
    doc.setFont('times', 'bold');
    doc.setFontSize(52);
    doc.setTextColor(200, 150, 60);
    doc.text('★', W / 2, 75, { align: 'center' });

    // Título CTA
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    const ctaL = doc.splitTextToSize('Pronto para transformar\nseu escritório?', TW);
    doc.text(ctaL, W / 2, 100, { align: 'center' });

    // Subtítulo
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(180, 200, 230);
    const subL = doc.splitTextToSize(
      'Este playbook é apenas o começo. Nossa equipe está preparada para caminhar com você em cada etapa desta transformação.',
      TW - 20
    );
    doc.text(subL, W / 2, 128, { align: 'center' });

    // Caixa de próximos passos
    doc.setFillColor(200, 150, 60);
    doc.roundedRect(ML, 155, TW, 50, 5, 5, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PRÓXIMOS PASSOS', W / 2, 168, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const passos = [
      '→  Agende uma reunião estratégica gratuita',
      '→  Defina metas de crescimento com nosso time',
      '→  Inicie sua transformação nos próximos 7 dias',
    ];
    passos.forEach((p, i) => {
      doc.text(p, W / 2, 180 + i * 8, { align: 'center' });
    });

    // Rodapé missão
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 170, 200);
    doc.text('Missão: Transformar e Potencializar Contabilidades', W / 2, H - 14, { align: 'center' });
    doc.text(new Date().getFullYear().toString(), W / 2, H - 9, { align: 'center' });

    await prog(100, 'Finalizando...', 200);

    // ── DOWNLOAD ───────────────────────────────────────────────────
    const filename = `Playbook_${lastDados.escritorio.replace(/[^a-zA-Z0-9]/g, '_')}_${
      new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    }.pdf`;

    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);

    const link = document.getElementById('pdf-link');
    link.href     = url;
    link.download = filename;

    // Atualiza status no histórico
    if (ultimoRegistroId) {
      Storage.updateStatus(ultimoRegistroId, 'PDF Gerado');
    }

    setModal('PDF Pronto! 🎉', `Playbook de "${lastDados.escritorio}" formatado em ABNT.`, true);

  } catch (err) {
    document.getElementById('pdf-bar').style.background = '#ef4444';
    setModal('Erro ao gerar PDF', err.message, true);
    console.error('PDF error:', err);
  }
}

function setModal(title, desc, showActions) {
  document.getElementById('pdf-m-title').textContent = title;
  document.getElementById('pdf-m-desc').textContent  = desc;
  document.getElementById('pdf-actions').style.display = showActions ? 'flex' : 'none';
  if (showActions) document.getElementById('pdf-actions').style.justifyContent = 'flex-end';
}

function closePdfModal() {
  document.getElementById('pdf-modal').style.display = 'none';
  document.getElementById('pdf-bar').style.width = '0';
  document.getElementById('pdf-bar').style.background = '';
}
