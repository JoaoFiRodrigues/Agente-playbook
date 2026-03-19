// storage.js — gerencia o histórico de playbooks no localStorage
// Funciona 100% no browser, sem servidor

const STORAGE_KEY = 'playbook-hub-historico';

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar histórico:', e);
    }
  },

  add(dados, status) {
    const list = this.load();
    list.unshift({
      id:          Date.now(),
      escritorio:  dados.escritorio,
      nome:        dados.nome,
      cargo:       dados.cargo       || '—',
      vendedor:    dados.vendedor    || '—',
      segmento:    dados.segmento    || '—',
      email:       dados.email       || '',
      porte:       dados.porte       || '',
      faturamento: dados.faturamento || '',
      objetivos:   dados.objetivos   || '',
      prazo:       dados.prazo       || '',
      meta:        dados.metaFat     || '',
      status:      status,
      data:        new Date().toLocaleDateString('pt-BR'),
      dataISO:     new Date().toISOString(),
    });
    this.save(list);
    return list;
  },

  updateStatus(id, status) {
    const list = this.load();
    const item = list.find(i => i.id === id);
    if (item) { item.status = status; this.save(list); }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  toCSV() {
    const list = this.load();
    if (!list.length) return null;
    const header = 'Escritório,Responsável,Cargo,Vendedor,Segmento,Faturamento,Meta,Prazo,Data,Status';
    const rows = list.map(i =>
      [i.escritorio, i.nome, i.cargo, i.vendedor, i.segmento,
       i.faturamento, i.meta, i.prazo, i.data, i.status]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    return header + '\n' + rows.join('\n');
  }
};
