// api/gerar.js
// Serverless function - roda no servidor Vercel
// A ANTHROPIC_API_KEY fica nas variáveis de ambiente do Vercel (nunca exposta ao browser)

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel.' });
  }

  try {
    const { prompt, dados } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `Você é especialista em copywriting estratégico e criação de playbooks para escritórios de contabilidade no Brasil.
MISSÃO: Transformar e Potencializar Contabilidades — ajudar escritórios a evoluir de "fábrica de obrigações" para assessorias estratégicas.
Escreva em português brasileiro. Tom: profissional, empático e motivador.
Use dados reais do mercado contábil brasileiro.
Estruture com títulos claros usando # ## ### para hierarquia markdown.
Seja específico, prático e orientado a resultados reais.
Faça o parceiro sentir que este playbook foi criado EXCLUSIVAMENTE para ele.`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || 'Erro na API Anthropic' });
    }

    const data = await response.json();
    const texto = (data.content || []).map(b => b.text || '').join('');

    return res.status(200).json({ content: texto });

  } catch (error) {
    console.error('Erro no handler:', error);
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}
