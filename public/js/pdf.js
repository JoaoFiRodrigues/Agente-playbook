// pdf.js — Playbook Hub Cards
// Cores: Roxo #661081 | Laranja #f19800
// Fonte: Helvetica (built-in jsPDF, sem dependência externa)

let ultimoRegistroId = null;

const COR = {
  roxo:      [102, 16,  129],
  laranja:   [241, 152,   0],
  branco:    [255, 255, 255],
  cinza:     [248, 244, 252],
  texto:     [ 30,  30,  30],
  roxoClaro: [237, 220, 245],
  roxoMedio: [120,  40, 160],
};

// ── LIMPA MARKDOWN ────────────────────────────────────────────────
function limparTexto(text) {
  return text
    .split('\n')
    .filter(l => {
      const t = l.trim();
      if (!t) return true;
      if (/^INSTRUC[AÃ]O:/i.test(t))  return false;
      if (/^Defina aqui/i.test(t))    return false;
      if (/^Preencha/i.test(t))       return false;
      if (/^\[.*\]$/.test(t))         return false;
      if (/^_{3,}$/.test(t))          return false;
      if (/^\*{3,}$/.test(t))         return false;
      return true;
    })
    .join('\n')
    .replace(/^#{1,6}\s+/gm,      '')
    .replace(/\*\*(.+?)\*\*/g,    '$1')
    .replace(/\*(.+?)\*/g,        '$1')
    .replace(/^[-]\s+/gm,         '* ')
    .replace(/^\d+\.\s+/gm,       '')
    .replace(/`(.+?)`/g,          '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/={3,}/g,            '')
    .replace(/-{3,}/g,            '')
    .replace(/\|.+\|/g,           '')
    .replace(/\n{3,}/g,           '\n\n')
    .trim();
}

function tipoLinha(linha) {
  const l = linha.trim();
  if (!l) return 'vazio';
  if (l.startsWith('* ')) return 'bullet';
  if (l.toUpperCase() === l && l.length > 3 && l.length < 90 && !/^\d/.test(l)) return 'titulo';
  return 'paragrafo';
}

// ── HELPERS DE FONTE ──────────────────────────────────────────────
// jsPDF built-in: helvetica (normal/bold/italic), times, courier
function setFont(doc, weight, size, cor) {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  if (cor) doc.setTextColor(...cor);
}

// ── MODAL ─────────────────────────────────────────────────────────
function setModal(title, desc, showActions) {
  document.getElementById('pdf-m-title').textContent = title;
  document.getElementById('pdf-m-desc').textContent  = desc;
  const a = document.getElementById('pdf-actions');
  a.style.display = showActions ? 'flex' : 'none';
  if (showActions) a.style.justifyContent = 'flex-end';
}

function closePdfModal() {
  document.getElementById('pdf-modal').style.display = 'none';
  document.getElementById('pdf-bar').style.width      = '0';
  document.getElementById('pdf-bar').style.background = '';
}

// ── GERAR PDF ─────────────────────────────────────────────────────
async function gerarPDF() {
  if (!lastGeneratedContent || !lastDados) { alert('Gere um playbook primeiro.'); return; }

  document.getElementById('pdf-modal').style.display = 'flex';
  setModal('Gerando PDF...', 'Formatando o playbook para ' + lastDados.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');
  const prog = (pct, msg, delay) =>
    new Promise(r => setTimeout(() => { bar.style.width = pct + '%'; step.textContent = msg; r(); }, delay || 0));

  try {
    await prog(8, 'Configurando documento A4...', 100);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ML = 25, MR = 20, MT = 28, MB = 22;
    const TW = W - ML - MR;

    // ══════════════════════════════════════════════
    // PÁGINA 1 — CAPA
    // ══════════════════════════════════════════════
    await prog(18, 'Desenhando capa...', 300);

    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, H, 'F');

    // Barra lateral laranja
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, H, 'F');

    // Círculo decorativo inferior direito
    doc.setFillColor(...COR.laranja);
    doc.circle(W + 14, H + 14, 80, 'F');

    // Círculo decorativo superior direito
    doc.setFillColor(...COR.roxoMedio);
    doc.circle(W + 8, 10, 58, 'F');

    // Badge
    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML, 30, 110, 11, 3, 3, 'F');
    setFont(doc, 'bold', 8, COR.branco);
    doc.text('PLAYBOOK ESTRATEGICO  |  EXCLUSIVO', ML + 5, 37.2);

    // Nome do escritório
    setFont(doc, 'bold', 27, COR.branco);
    const escLines = doc.splitTextToSize(lastDados.escritorio.toUpperCase(), TW - 10);
    doc.text(escLines, ML, 63);
    const escH = escLines.length * 11.5;

    // Subtítulo
    setFont(doc, 'normal', 13, [220, 190, 240]);
    doc.text('Guia de Transformacao e Potencializacao', ML, 63 + escH + 7);

    // Linha separadora
    const sepY = 63 + escH + 19;
    doc.setDrawColor(...COR.laranja);
    doc.setLineWidth(1.2);
    doc.line(ML, sepY, ML + TW, sepY);

    // "Elaborado para"
    setFont(doc, 'normal', 9, [200, 170, 230]);
    doc.text('Elaborado especialmente para', ML, sepY + 13);

    // Nome responsável
    setFont(doc, 'bold', 21, COR.branco);
    doc.text(lastDados.nome, ML, sepY + 25);

    // Cargo
    setFont(doc, 'normal', 13, [220, 190, 240]);
    doc.text(lastDados.cargo || 'Socio-Diretor', ML, sepY + 35);

    if (lastDados.cidade) {
      setFont(doc, 'normal', 10, [180, 150, 210]);
      doc.text(lastDados.cidade, ML, sepY + 45);
    }

    // Bloco missão no rodapé
    doc.setFillColor(...COR.laranja);
    doc.rect(ML, H - 52, TW, 30, 'F');
    setFont(doc, 'bold', 10, COR.branco);
    doc.text('NOSSA MISSAO', ML + 6, H - 41);
    setFont(doc, 'normal', 10, COR.branco);
    const missL = doc.splitTextToSize(
      'Transformar e Potencializar Contabilidades - de obrigacoes para assessoria estrategica.',
      TW - 14
    );
    doc.text(missL, ML + 6, H - 33);

    // Data
    setFont(doc, 'normal', 8, [180, 150, 210]);
    doc.text(
      new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      W - MR, H - 9, { align: 'right' }
    );

    // ══════════════════════════════════════════════
    // PÁGINA 2 — SUMÁRIO
    // ══════════════════════════════════════════════
    await prog(30, 'Montando sumario...', 300);

    doc.addPage();
    doc.setFillColor(...COR.cinza);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, 18, 'F');
    setFont(doc, 'bold', 12, COR.branco);
    doc.text('SUMARIO', ML, 12.5);

    let cy = 36;
    [
      ['1', 'Apresentacao e Proposito'],
      ['2', 'Panorama do Mercado Contabil Brasileiro'],
      ['3', 'Diagnostico Personalizado'],
      ['4', 'Mapa de Transformacao'],
      ['5', 'Caderno de Exercicios Praticos'],
      ['6', 'Agenda Estrategica - Primeiros 90 Dias'],
      ['7', 'Calculadora de Precificacao'],
      ['8', 'Protocolo de Reuniao com Cliente'],
      ['9', 'Proximos Passos e Convite a Parceria'],
    ].forEach(([num, titulo]) => {
      doc.setFillColor(...COR.roxo);
      doc.circle(ML + 4.5, cy - 2.5, 4.5, 'F');
      setFont(doc, 'bold', 9, COR.branco);
      doc.text(num, ML + 4.5, cy - 1, { align: 'center' });
      setFont(doc, 'normal', 12, COR.texto);
      doc.text(titulo, ML + 13, cy);
      doc.setDrawColor(210, 195, 225);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(ML + 13, cy + 3.5, W - MR, cy + 3.5);
      doc.setLineDashPattern([], 0);
      cy += 17;
    });

    // ══════════════════════════════════════════════
    // PÁGINAS DE CONTEÚDO
    // ══════════════════════════════════════════════
    await prog(48, 'Formatando conteudo...', 400);

    const textoLimpo = limparTexto(lastGeneratedContent);
    const linhas     = textoLimpo.split('\n');

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    let py = MT, pageNum = 3, primeiraLinha = true;

    const addHeader = () => {
      doc.setFillColor(...COR.roxo);
      doc.rect(0, 0, W, 13, 'F');
      doc.setFillColor(...COR.laranja);
      doc.rect(0, 0, 6, 13, 'F');
      setFont(doc, 'normal', 7.5, COR.branco);
      const sn = lastDados.escritorio.length > 48
        ? lastDados.escritorio.slice(0, 45) + '...'
        : lastDados.escritorio;
      doc.text(sn + '  |  Playbook Estrategico', ML, 9);
      doc.text(String(pageNum), W - MR, 9, { align: 'right' });
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

    for (const rawL of linhas) {
      const linha = rawL.trimEnd();
      const tipo  = tipoLinha(linha);

      if (tipo === 'vazio') { py += 4; continue; }

      if (tipo === 'titulo') {
        checkPg(36);
        if (!primeiraLinha) py += 6;
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
        checkPg(12);
        const txt = linha.replace(/^\*\s*/, '');
        const tl  = doc.splitTextToSize(txt, TW - 9);
        doc.setFillColor(...COR.laranja);
        doc.circle(ML + 2.5, py - 1.8, 1.8, 'F');
        setFont(doc, 'normal', 11, COR.texto);
        doc.text(tl, ML + 8, py);
        py += tl.length * 6.5 + 2.5;
        primeiraLinha = false;
        continue;
      }

      // parágrafo normal
      checkPg(14);
      setFont(doc, 'normal', 11, COR.texto);
      const tl = doc.splitTextToSize(linha, TW);
      doc.text(tl, ML, py);
      py += tl.length * 6.5 + 1.5;
      primeiraLinha = false;
    }

    // ══════════════════════════════════════════════
    // CONTRA-CAPA
    // ══════════════════════════════════════════════
    await prog(90, 'Adicionando contra-capa...', 300);

    doc.addPage();
    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, H, 'F');
    doc.rect(0, H - 9, W, 9, 'F');
    doc.setFillColor(...COR.roxoMedio);
    doc.circle(W + 10, H / 2, 88, 'F');

    // Forma decorativa central (losango duplo — sem Unicode)
    const cx = W / 2, dy = 68, dr = 16;
    doc.setFillColor(...COR.laranja);
    doc.triangle(cx,      dy - dr, cx - dr * 0.65, dy + dr * 0.4, cx + dr * 0.65, dy + dr * 0.4, 'F');
    doc.triangle(cx,      dy + dr, cx - dr * 0.65, dy - dr * 0.4, cx + dr * 0.65, dy - dr * 0.4, 'F');

    // CTA principal
    setFont(doc, 'bold', 23, COR.branco);
    const ctaL = doc.splitTextToSize('Pronto para transformar seu escritorio?', TW - 10);
    doc.text(ctaL, W / 2, 103, { align: 'center' });

    // Sub
    setFont(doc, 'normal', 11, [220, 190, 240]);
    const subL = doc.splitTextToSize(
      'Este playbook e apenas o comeco. Nossa equipe esta preparada para caminhar com voce em cada etapa desta transformacao.',
      TW - 20
    );
    doc.text(subL, W / 2, 128, { align: 'center' });

    // Caixa próximos passos
    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML, 158, TW, 56, 6, 6, 'F');
    setFont(doc, 'bold', 13, COR.branco);
    doc.text('PROXIMOS PASSOS', W / 2, 173, { align: 'center' });

    setFont(doc, 'normal', 11, COR.branco);
    [
      'Agende uma reuniao estrategica gratuita',
      'Defina metas de crescimento com nosso time',
      'Inicie sua transformacao nos proximos 7 dias',
    ].forEach((p, i) => {
      const yp = 185 + i * 11;
      doc.setFillColor(...COR.branco);
      doc.circle(ML + 10, yp - 2, 1.5, 'F');
      setFont(doc, 'normal', 11, COR.branco);
      doc.text(p, ML + 16, yp);
    });

    // Rodapé
    setFont(doc, 'normal', 9, [200, 170, 230]);
    doc.text('Missao: Transformar e Potencializar Contabilidades', W / 2, H - 13, { align: 'center' });
    setFont(doc, 'normal', 8, [180, 150, 210]);
    doc.text(String(new Date().getFullYear()), W / 2, H - 8, { align: 'center' });

    await prog(100, 'Finalizando...', 200);

    // ── DOWNLOAD ─────────────────────────────────────────────────
    const fname = 'Playbook_' +
      lastDados.escritorio.replace(/[^a-zA-Z0-9]/g, '_') + '_' +
      new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf';

    const url = URL.createObjectURL(doc.output('blob'));
    const lnk = document.getElementById('pdf-link');
    lnk.href     = url;
    lnk.download = fname;

    if (ultimoRegistroId) Storage.updateStatus(ultimoRegistroId, 'PDF Gerado');
    setModal('PDF Pronto!', 'Playbook de "' + lastDados.escritorio + '" gerado com sucesso.', true);

  } catch (err) {
    document.getElementById('pdf-bar').style.background = '#ef4444';
    setModal('Erro ao gerar PDF', err.message, true);
    console.error('PDF error:', err);
  }
}