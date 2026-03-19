# 📋 Playbook Hub — Contabilidades

Agente gerador de playbooks estratégicos para escritórios contábeis.
Missão: Transformar e Potencializar Contabilidades.

## 🔧 Corrigindo o repo existente (Agente_playbook)

O problema anterior era subpasta extra. Agora os arquivos estão na raiz.

### Atualizar o GitHub:

```bash
# 1. Clone (se não tiver local)
git clone https://github.com/JoaoFiRodrigues/Agente_playbook.git
cd Agente_playbook

# 2. Remove subpasta antiga
git rm -r playbook-hub/
git commit -m "fix: remove subpasta incorreta"

# 3. Copia os arquivos deste ZIP para a raiz do Agente_playbook/
#    (api/, public/, vercel.json, package.json, .gitignore)

# 4. Sobe
git add .
git commit -m "fix: arquivos na raiz - corrige 404"
git push
```

O Vercel faz redeploy automático em ~30s.

## ⚙️ API Key (obrigatório)

Vercel → agente-playbook → Settings → Environment Variables
- Name: ANTHROPIC_API_KEY
- Value: sk-ant-... (console.anthropic.com)
- Environments: Production + Preview + Development
→ Save → Redeploy

## 📁 Estrutura correta

```
Agente_playbook/       ← raiz do repo
├── api/
│   └── gerar.js
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js, pdf.js, storage.js
├── vercel.json
├── package.json
└── .gitignore
```
