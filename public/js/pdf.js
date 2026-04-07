// pdf.js — Playbook Hub Cards — Visual Executivo Premium
// Cores: Roxo #661081 | Laranja #f19800 | Branco #FFFFFF

let ultimoRegistroId = null;

const COR = {
  roxo:      [102, 16,  129],
  roxo2:     [130, 40,  160],
  roxoClaro: [237, 220, 245],
  roxoEsc:   [ 60,  8,   80],
  laranja:   [241, 152,   0],
  laranjaEsc:[180, 110,   0],
  branco:    [255, 255, 255],
  cinza:     [248, 245, 252],
  cinzaEsc:  [230, 225, 238],
  texto:     [ 25,  25,  25],
  texto2:    [ 80,  80,  80],
  destBg:    [255, 248, 230],
};

// ── LIMPA MARKDOWN ────────────────────────────────────────────────
function limparTexto(text) {
  return text
    .split('\n')
    .filter(l => {
      const t = l.trim();
      if (/^INSTRUC[AÃ]O:/i.test(t)) return false;
      if (/^Defina aqui/i.test(t))   return false;
      if (/^Preencha/i.test(t))      return false;
      if (/^\[.*\]$/.test(t))        return false;
      if (/^_{3,}$/.test(t))         return false;
      return true;
    })
    .join('\n')
    .replace(/^#{1,6}\s+/gm,      '')
    .replace(/\*\*(.+?)\*\*/g,    '$1')
    .replace(/\*(.+?)\*/g,        '$1')
    .replace(/^[-]\s+/gm,         '• ')
    .replace(/^\d+\.\s+/gm,       (m) => m)
    .replace(/`(.+?)`/g,          '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/={3,}/g,            '')
    .replace(/\|.+\|/g,           '')
    .replace(/\n{3,}/g,           '\n\n')
    .trim();
}

// ── TIPO DE LINHA ─────────────────────────────────────────────────
function tipoLinha(linha) {
  const l = linha.trim();
  if (!l) return 'vazio';
  // Bloco editorial especial
  if (/^(NA PRÁTICA|ERRO COMUM|PONTO DE ATENÇÃO|EXEMPLO REAL|PLANO DE AÇÃO|COMO APLICAR|ATENÇÃO|DIRETRIZ)[\s:]/i.test(l)) return 'editorial';
  // Frase de impacto (curta, toda maiúscula, entre aspas ou exclamação)
  if ((l.startsWith('"') || l.startsWith('\u201c')) && l.toUpperCase() === l && l.length < 100) return 'impacto';
  if (l.toUpperCase() === l && l.length > 4 && l.length < 100 && !/^\d/.test(l) && !l.includes(',') && !l.includes('R$')) return 'titulo';
  if (l.startsWith('• ') || l.startsWith('- ')) return 'bullet';
  if (/^\d+\.\s/.test(l)) return 'numerado';
  if (l.endsWith(':') && l.length < 60) return 'subtitulo';
  return 'paragrafo';
}

// ── HELPER FONTE ──────────────────────────────────────────────────
function sf(doc, weight, size, cor) {
  doc.setFont('helvetica', weight === 'bold' ? 'bold' : 'normal');
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

// ── FAIXA DECORATIVA TOPO DE PÁGINA ──────────────────────────────
function addPageHeader(doc, W, ML, MR, escritorio, pageNum, COR) {
  doc.setFillColor(...COR.roxo);
  doc.rect(0, 0, W, 13, 'F');
  doc.setFillColor(...COR.laranja);
  doc.rect(0, 0, 6, 13, 'F');
  sf(doc, 'normal', 7.5, COR.branco);
  const sn = escritorio.length > 48 ? escritorio.slice(0, 45) + '...' : escritorio;
  doc.text(sn + '  |  Playbook Estratégico', ML, 9);
  doc.text(String(pageNum), W - MR, 9, { align: 'right' });
}

// ── BLOCO EDITORIAL (NA PRÁTICA, ERRO COMUM, etc) ────────────────
function desenharEditorial(doc, ML, py, TW, linha, COR) {
  const tagMatch = linha.match(/^([A-ZÁÉÍÓÚÀÃÕ ]+)[\s:]+(.*)/i);
  const tag  = tagMatch ? tagMatch[1].trim().toUpperCase() : 'NOTA';
  const body = tagMatch ? tagMatch[2].trim() : linha;

  // Cor do tag por tipo
  const tagCores = {
    'NA PRÁTICA':       [[241,152,0],   [255,248,230]],
    'ERRO COMUM':       [[180,20,20],   [255,235,235]],
    'PONTO DE ATENÇÃO': [[180,100,0],   [255,248,220]],
    'EXEMPLO REAL':     [[15,100,50],   [230,248,238]],
    'PLANO DE AÇÃO':    [[102,16,129],  [237,220,245]],
    'COMO APLICAR':     [[20,80,160],   [225,235,255]],
    'ATENÇÃO':          [[180,20,20],   [255,235,235]],
    'DIRETRIZ':         [[102,16,129],  [237,220,245]],
  };
  const [tagCor, bgCor] = tagCores[tag] || [[102,16,129],[237,220,245]];

  sf(doc, 'bold', 9, tagCor);
  const bodyLines = doc.splitTextToSize(body, TW - 20);
  const boxH = bodyLines.length * 6 + 18;

  // Fundo
  doc.setFillColor(...bgCor);
  doc.roundedRect(ML - 3, py - 6, TW + 6, boxH, 4, 4, 'F');
  // Borda lateral cor do tag
  doc.setFillColor(...tagCor);
  doc.roundedRect(ML - 3, py - 6, 5, boxH, 2, 2, 'F');
  // Badge tag
  doc.setFillColor(...tagCor);
  doc.roundedRect(ML + 5, py - 3, doc.getTextWidth(tag) + 8, 8, 2, 2, 'F');
  sf(doc, 'bold', 7.5, COR.branco);
  doc.text(tag, ML + 9, py + 2.5);

  // Corpo
  sf(doc, 'normal', 10, COR.texto);
  doc.text(bodyLines, ML + 9, py + 10);

  return boxH + 6;
}

// ── FRASE DE IMPACTO ──────────────────────────────────────────────
function desenharImpacto(doc, ML, py, TW, W, linha, COR) {
  const txt = linha.replace(/^[""]|[""]$/g, '').trim();
  sf(doc, 'bold', 13, COR.roxo);
  const tl = doc.splitTextToSize(txt, TW - 20);
  const boxH = tl.length * 8 + 16;

  // Fundo escuro com borda dupla
  doc.setFillColor(...COR.roxo);
  doc.roundedRect(ML - 3, py - 7, TW + 6, boxH, 4, 4, 'F');
  doc.setFillColor(...COR.laranja);
  doc.rect(ML - 3, py - 7, 6, boxH, 'F');
  doc.rect(ML + TW, py - 7, 3, boxH, 'F');

  // Aspas decorativas
  sf(doc, 'bold', 28, [130, 40, 160]);
  doc.text('\u201c', ML + 8, py + 5);

  sf(doc, 'bold', 12, COR.branco);
  doc.text(tl, ML + 18, py + 3);
  return boxH + 6;
}

// ── PÁGINA DE OFERTA QR + JORNADA ────────────────────────────────
async function desenharPaginaOferta(doc, W, H, ML, MR, TW, COR) {
  const WA_URL = 'https://api.whatsapp.com/send?phone=5519987820357';
  doc.addPage();
  doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...COR.roxo); doc.rect(0, 0, W, 13, 'F');
  doc.setFillColor(...COR.laranja); doc.rect(0, 0, 6, 13, 'F');
  sf(doc, 'bold', 9, COR.branco);
  doc.text('OFERTA ESPECIAL CARDSINOVA', ML, 9);

  // Badge 30 dias
  doc.setFillColor(...COR.laranja);
  doc.roundedRect(ML, 18, TW, 14, 4, 4, 'F');
  sf(doc, 'bold', 13, COR.branco);
  doc.text('5 ASSINATURAS GRÁTIS — ESCANEIE E COMECE AGORA', W/2, 27, { align: 'center' });

  // QR Code
  let qrBase64 = null;
  if (typeof QRious !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      new QRious({ element: canvas, value: WA_URL, size: 300, background: '#ffffff', foreground: '#661081', padding: 10, level: 'H' });
      qrBase64 = canvas.toDataURL('image/png');
    } catch(e) {}
  }

  const qrSize = 50, qrX = W/2 - qrSize/2, qrY = 38;
  doc.setFillColor(255,255,255);
  doc.roundedRect(qrX-3, qrY-3, qrSize+6, qrSize+6, 3, 3, 'F');
  doc.setDrawColor(...COR.roxo); doc.setLineWidth(1);
  doc.roundedRect(qrX-3, qrY-3, qrSize+6, qrSize+6, 3, 3, 'S');
  if (qrBase64) {
    doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
  } else {
    sf(doc, 'bold', 9, COR.roxo);
    doc.text('wa.me/551936018499', W/2, qrY + qrSize/2, { align: 'center' });
  }
  sf(doc, 'normal', 8, [90,90,90]);
  doc.text('Aponte a câmera do celular para o QR Code', W/2, qrY+qrSize+6, { align: 'center' });

  // Jornada
  const jornadaY = qrY + qrSize + 14;
  doc.setFillColor(...COR.roxo); doc.rect(ML, jornadaY, TW, 12, 'F');
  sf(doc, 'bold', 10, COR.branco);
  doc.text('JORNADA DO CLIENTE CARDSINOVA', W/2, jornadaY+8, { align: 'center' });

  const jornada = [
    { cor:[102,16,129],  icone:'TOPO',        nome:'Mentoria Fernando Muterle',    desc:'Alta transformação, relação 1:1' },
    { cor:[76,29,149],   icone:'PREMIUM+',    nome:'Imersão Presencial',            desc:'Aceleração intensa presencial' },
    { cor:[37,99,235],   icone:'PREMIUM',     nome:'Pro 360 Contábil',              desc:'Scale + acompanhamento profundo' },
    { cor:[15,118,51],   icone:'RECORRÊNCIA', nome:'Comunidade CS+',                desc:'Mensal - networking e suporte' },
    { cor:[5,150,105],   icone:'COMPLEMENT.',  nome:'Treinamento de Equipe',         desc:'Capacitação modular' },
    { cor:[234,88,12],   icone:'MÉDIO',       nome:'Scale Contábil 90 dias',        desc:'Estratégia + plano de ação' },
    { cor:[217,119,6],   icone:'ENTRADA',     nome:'Cardsinova Academy',             desc:'Cursos e trilhas online' },
    { cor:[71,85,105],   icone:'PORTA',       nome:'Diagnóstico Contábil Gratuito', desc:'Primeira conversa + mapeamento' },
  ];

  let jy = jornadaY + 14;
  const rowH = 13;
  jornada.forEach(item => {
    doc.setFillColor(...item.cor); doc.rect(ML, jy, TW, rowH, 'F');
    sf(doc, 'bold', 7, COR.branco);
    doc.text(item.icone, ML+3, jy+8.5);
    doc.setDrawColor(255,255,255); doc.setLineWidth(0.3);
    doc.line(ML+28, jy+1, ML+28, jy+rowH-1);
    sf(doc, 'bold', 8.5, COR.branco);
    doc.text(item.nome, ML+31, jy+5.5);
    sf(doc, 'normal', 7.5, COR.branco);
    doc.text(item.desc, ML+31, jy+10.5);
    jy += rowH;
  });
}

// ── GERAR PDF PRINCIPAL ───────────────────────────────────────────
async function gerarPDF() {
  if (!lastGeneratedContent || !lastDados) { alert('Gere um playbook primeiro.'); return; }
  document.getElementById('pdf-modal').style.display = 'flex';
  setModal('Gerando PDF...', 'Formatando playbook premium para ' + lastDados.escritorio, false);

  const bar  = document.getElementById('pdf-bar');
  const step = document.getElementById('pdf-step');
  const prog = (pct, msg, delay) =>
    new Promise(r => setTimeout(() => { bar.style.width = pct+'%'; step.textContent = msg; r(); }, delay||0));

  try {
    await prog(5, 'Configurando documento...', 100);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W=210, H=297, ML=22, MR=18, MT=26, MB=22;
    const TW = W - ML - MR;

    // ════════════════════════════════════════════════
    // CAPA
    // ════════════════════════════════════════════════
    await prog(12, 'Desenhando capa premium...', 300);

    doc.setFillColor(...COR.roxo);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...COR.laranja);
    doc.rect(0, 0, 8, H, 'F');
    doc.setFillColor(...COR.laranja);
    doc.circle(W+14, H+14, 80, 'F');
    doc.setFillColor(120, 40, 160);
    doc.circle(W+8, 10, 58, 'F');

    // Faixa diagonal decorativa
    doc.setFillColor(130, 40, 160);
    doc.triangle(0, H*0.55, W*0.7, H*0.35, W*0.7, H*0.55, 'F');

    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML, 28, 112, 11, 3, 3, 'F');
    sf(doc, 'bold', 8, COR.branco);
    doc.text('PLAYBOOK ESTRATÉGICO  |  EXCLUSIVO', ML+5, 35.5);

    sf(doc, 'bold', 30, COR.branco);
    const escLines = doc.splitTextToSize(lastDados.escritorio.toUpperCase(), TW-10);
    doc.text(escLines, ML, 62);
    const escH = escLines.length * 13;

    sf(doc, 'normal', 13, [220,190,240]);
    doc.text('Guia de Transformação e Potencialização', ML, 62+escH+8);

    const sepY = 62+escH+20;
    doc.setDrawColor(...COR.laranja); doc.setLineWidth(1.2);
    doc.line(ML, sepY, ML+TW, sepY);

    sf(doc, 'normal', 9, [200,170,230]);
    doc.text('Elaborado especialmente para', ML, sepY+13);
    sf(doc, 'bold', 22, COR.branco);
    doc.text(lastDados.nome, ML, sepY+25);
    sf(doc, 'normal', 13, [220,190,240]);
    doc.text(lastDados.cargo || 'Sócio-Diretor', ML, sepY+35);
    if (lastDados.cidade) {
      sf(doc, 'normal', 10, [180,150,210]);
      doc.text(lastDados.cidade, ML, sepY+45);
    }

    doc.setFillColor(...COR.laranja);
    doc.rect(ML, H-52, TW, 30, 'F');
    sf(doc, 'bold', 10, COR.branco);
    doc.text('NOSSA MISSÃO', ML+6, H-41);
    sf(doc, 'normal', 10, COR.branco);
    const missL = doc.splitTextToSize('Transformar e Potencializar Contabilidades — de obrigações para assessoria estratégica.', TW-14);
    doc.text(missL, ML+6, H-33);
    sf(doc, 'normal', 8, [180,150,210]);
    doc.text(new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}), W-MR, H-9, {align:'right'});

    // ════════════════════════════════════════════════
    // PÁGINA DE OFERTA (QR + Jornada)
    // ════════════════════════════════════════════════
    await prog(22, 'Gerando página de oferta...', 300);
    await desenharPaginaOferta(doc, W, H, ML, MR, TW, COR);

    // ════════════════════════════════════════════════
    // SUMÁRIO PREMIUM
    // ════════════════════════════════════════════════
    await prog(30, 'Montando sumário...', 300);
    doc.addPage();
    doc.setFillColor(...COR.cinza); doc.rect(0,0,W,H,'F');
    // Faixa lateral roxa
    doc.setFillColor(...COR.roxo); doc.rect(0,0,W,18,'F');
    doc.setFillColor(...COR.laranja); doc.rect(0,0,8,18,'F');
    // Acento lateral decorativo
    doc.setFillColor(...COR.roxoClaro); doc.rect(W-30,18,30,H-18,'F');
    doc.setFillColor(...COR.laranja); doc.rect(W-30,18,3,H-18,'F');
    sf(doc, 'bold', 12, COR.branco);
    doc.text('SUMÁRIO', ML, 13);

    let cy = 35;
    [
      ['1','Apresentação e Propósito'],
      ['2','Panorama do Mercado Contábil'],
      ['3','Diagnóstico Personalizado'],
      ['4','Mapa de Transformação'],
      ['5','Caderno de Exercícios Práticos'],
      ['6','Agenda Estratégica — 90 Dias'],
      ['7','Calculadora de Precificação'],
      ['8','Protocolo de Reunião com Cliente'],
      ['9','Próximos Passos e Parceria'],
    ].forEach(([num, titulo]) => {
      // Linha alternada
      if (parseInt(num) % 2 === 0) {
        doc.setFillColor(240,232,252);
        doc.rect(ML-3, cy-6, TW-27, 14, 'F');
      }
      doc.setFillColor(...COR.roxo);
      doc.circle(ML+5, cy-1, 5, 'F');
      sf(doc, 'bold', 9, COR.branco);
      doc.text(num, ML+5, cy+0.5, {align:'center'});
      sf(doc, 'normal', 12, COR.texto);
      doc.text(titulo, ML+14, cy);
      doc.setDrawColor(200,190,215); doc.setLineWidth(0.3);
      doc.setLineDashPattern([1,2], 0);
      doc.line(ML+14, cy+3, W-MR-32, cy+3);
      doc.setLineDashPattern([],0);
      cy += 18;
    });

    // ════════════════════════════════════════════════
    // CONTEÚDO PRINCIPAL — RENDERIZADOR PREMIUM
    // ════════════════════════════════════════════════
    await prog(48, 'Formatando conteúdo premium...', 400);

    const textoLimpo = limparTexto(lastGeneratedContent);
    const linhas = textoLimpo.split('\n');

    doc.addPage();
    doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');

    let py = MT, pageNum = 4, primLinha = true, ultimoTipo = '';

    const addHdr = () => {
      addPageHeader(doc, W, ML, MR, lastDados.escritorio, pageNum, COR);
      pageNum++; py = MT; primLinha = true;
    };
    addHdr();

    const chkPg = (esp) => {
      if (py > H - MB - (esp||22)) {
        doc.addPage();
        doc.setFillColor(255,255,255); doc.rect(0,0,W,H,'F');
        addHdr();
      }
    };

    for (const rawL of linhas) {
      const linha = rawL.trimEnd();
      const tipo  = tipoLinha(linha);

      if (tipo === 'vazio') {
        py += ultimoTipo === 'paragrafo' ? 5 : 3;
        ultimoTipo = 'vazio';
        continue;
      }

      // ── TÍTULO PRINCIPAL ─────────────────────────
      if (tipo === 'titulo') {
        chkPg(42);
        if (!primLinha && ultimoTipo !== 'vazio') py += 10;
        // Bloco roxo sólido largo
        doc.setFillColor(...COR.roxo);
        doc.roundedRect(ML-3, py-8, TW+6, 18, 3, 3, 'F');
        // Acento laranja esquerda
        doc.setFillColor(...COR.laranja);
        doc.roundedRect(ML-3, py-8, 6, 18, 2, 2, 'F');
        // Acento laranja direita
        doc.setFillColor(...COR.laranja);
        doc.rect(ML+TW-3, py-8, 6, 18, 'F');
        sf(doc, 'bold', 13, COR.branco);
        const tl = doc.splitTextToSize(linha, TW-16);
        doc.text(tl, ML+8, py+2);
        py += tl.length*7 + 12;
        // Linha divisória laranja após título
        doc.setDrawColor(...COR.laranja); doc.setLineWidth(0.8);
        doc.line(ML, py-4, ML+40, py-4);
        primLinha = false; ultimoTipo = 'titulo';
        continue;
      }

      // ── SUBTÍTULO (linha terminando em :) ────────
      if (tipo === 'subtitulo') {
        chkPg(28);
        if (ultimoTipo !== 'vazio') py += 6;
        doc.setFillColor(...COR.cinzaEsc);
        doc.roundedRect(ML-3, py-6, TW+6, 13, 2, 2, 'F');
        doc.setFillColor(...COR.laranja);
        doc.rect(ML-3, py-6, 4, 13, 'F');
        sf(doc, 'bold', 10.5, COR.roxo);
        doc.text(linha.replace(/:$/, '').toUpperCase(), ML+5, py+1.5);
        py += 14;
        primLinha = false; ultimoTipo = 'subtitulo';
        continue;
      }

      // ── BLOCO EDITORIAL ───────────────────────────
      if (tipo === 'editorial') {
        const h = desenharEditorial(doc, ML, py, TW, linha, COR);
        chkPg(h + 8);
        py += h;
        primLinha = false; ultimoTipo = 'editorial';
        continue;
      }

      // ── FRASE DE IMPACTO ─────────────────────────
      if (tipo === 'impacto') {
        const h = desenharImpacto(doc, ML, py, TW, W, linha, COR);
        chkPg(h + 8);
        py += h;
        primLinha = false; ultimoTipo = 'impacto';
        continue;
      }

      // ── BULLET ───────────────────────────────────
      if (tipo === 'bullet') {
        chkPg(12);
        if (ultimoTipo === 'titulo' || ultimoTipo === 'subtitulo') py += 2;
        const txt = linha.replace(/^[•\-]\s*/, '');
        const colonIdx = txt.indexOf(': ');
        const tl = doc.splitTextToSize(txt, TW-10);
        // Bolinha laranja
        doc.setFillColor(...COR.laranja);
        doc.circle(ML+2.5, py-1.5, 2, 'F');
        if (colonIdx > 0 && colonIdx < 40) {
          const chave = txt.substring(0, colonIdx);
          const valor = txt.substring(colonIdx+2);
          sf(doc, 'bold', 10.5, COR.roxo);
          const chaveW = doc.getTextWidth(chave+': ');
          doc.text(chave+':', ML+7, py);
          sf(doc, 'normal', 10.5, COR.texto);
          const vl = doc.splitTextToSize(valor, TW-10-chaveW);
          doc.text(vl[0]||'', ML+7+chaveW, py);
          if (vl.length>1) { vl.slice(1).forEach(v => { py+=6.5; doc.text(v, ML+10, py); }); }
        } else {
          sf(doc, 'normal', 10.5, COR.texto);
          doc.text(tl, ML+7, py);
          if (tl.length>1) py += (tl.length-1)*6.5;
        }
        py += 8;
        primLinha = false; ultimoTipo = 'bullet';
        continue;
      }

      // ── NUMERADO ─────────────────────────────────
      if (tipo === 'numerado') {
        chkPg(14);
        if (ultimoTipo === 'titulo' || ultimoTipo === 'subtitulo') py += 2;
        const numMatch = linha.match(/^(\d+)\.\s*(.*)/);
        const num = numMatch ? numMatch[1] : '1';
        const txt = numMatch ? numMatch[2] : linha;
        doc.setFillColor(...COR.roxo);
        doc.circle(ML+3.5, py-1.5, 3.5, 'F');
        sf(doc, 'bold', 7.5, COR.branco);
        doc.text(num, ML+3.5, py-0.5, {align:'center'});
        sf(doc, 'normal', 10.5, COR.texto);
        const tl = doc.splitTextToSize(txt, TW-12);
        doc.text(tl, ML+10, py);
        py += Math.max(tl.length*6.5, 8) + 4;
        primLinha = false; ultimoTipo = 'numerado';
        continue;
      }

      // ── PARÁGRAFO ─────────────────────────────────
      chkPg(14);
      sf(doc, 'normal', 10.5, COR.texto);
      const tl = doc.splitTextToSize(linha, TW);
      doc.text(tl, ML, py);
      py += tl.length * 6.8 + 2;
      primLinha = false; ultimoTipo = 'paragrafo';
    }

    // ════════════════════════════════════════════════
    // CONTRA-CAPA
    // ════════════════════════════════════════════════
    await prog(92, 'Finalizando contra-capa...', 300);
    doc.addPage();
    doc.setFillColor(...COR.roxo); doc.rect(0,0,W,H,'F');
    doc.setFillColor(...COR.laranja); doc.rect(0,0,8,H,'F');
    doc.setFillColor(...COR.laranja); doc.rect(0,H-9,W,9,'F');
    doc.setFillColor(120,40,160); doc.circle(W+10,H/2,88,'F');

    // Forma decorativa
    const cx=W/2, dy=68, dr=16;
    doc.setFillColor(...COR.laranja);
    doc.triangle(cx,dy-dr,cx-dr*0.65,dy+dr*0.4,cx+dr*0.65,dy+dr*0.4,'F');
    doc.triangle(cx,dy+dr,cx-dr*0.65,dy-dr*0.4,cx+dr*0.65,dy-dr*0.4,'F');

    sf(doc,'bold',24,COR.branco);
    doc.text('Pronto para transformar', W/2,102,{align:'center'});
    doc.text('seu escritório?', W/2,114,{align:'center'});

    sf(doc,'normal',12,[220,190,240]);
    const subL=doc.splitTextToSize('Este playbook é apenas o começo. Nossa equipe está preparada para caminhar com você em cada etapa desta transformação.',TW-20);
    doc.text(subL,W/2,130,{align:'center'});

    doc.setFillColor(...COR.laranja);
    doc.roundedRect(ML,158,TW,56,6,6,'F');
    sf(doc,'bold',13,COR.branco);
    doc.text('PRÓXIMOS PASSOS',W/2,173,{align:'center'});
    sf(doc,'normal',11,COR.branco);
    ['Agende uma reunião estratégica gratuita','Defina metas de crescimento com nosso time','Inicie sua transformação nos próximos 7 dias'].forEach((p,i)=>{
      const yp=185+i*11;
      doc.setFillColor(...COR.branco); doc.circle(ML+10,yp-2,1.5,'F');
      sf(doc,'normal',11,COR.branco);
      doc.text(p,ML+16,yp);
    });

    sf(doc,'normal',9,[200,170,230]);
    doc.text('Missão: Transformar e Potencializar Contabilidades',W/2,H-13,{align:'center'});
    sf(doc,'normal',8,[180,150,210]);
    doc.text(String(new Date().getFullYear()),W/2,H-8,{align:'center'});

    await prog(100,'Concluído!',200);

    const fname='Playbook_'+lastDados.escritorio.replace(/[^a-zA-Z0-9]/g,'_')+'_'+
      new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.pdf';
    const url=URL.createObjectURL(doc.output('blob'));
    const lnk=document.getElementById('pdf-link');
    lnk.href=url; lnk.download=fname;
    if(ultimoRegistroId) Storage.updateStatus(ultimoRegistroId,'PDF Gerado');
    setModal('PDF Pronto!','Playbook de "'+lastDados.escritorio+'" gerado com sucesso.',true);

  } catch(err) {
    document.getElementById('pdf-bar').style.background='#ef4444';
    setModal('Erro ao gerar PDF',err.message,true);
    console.error('PDF error:',err);
  }
}