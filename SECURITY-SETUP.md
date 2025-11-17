# 🔐 Configuração de Segurança - Admin Panel

## ⚙️ Configurar Variável de Ambiente no Netlify

### 1. Acesse o painel do Netlify
- Site Settings → Environment Variables

### 2. Adicione a variável
- **Key:** `AUTH_PASSWORD`
- **Value:** `sua-senha-super-segura-aqui`
- **Scopes:** All scopes

### 3. Redeploy do site
- Deploys → Trigger deploy

---

## 🔑 Como Usar o Sistema de Login

### Credenciais:
- **Usuário:** `admin` (fixo)
- **Senha:** A que você configurou na variável `AUTH_PASSWORD`

### URLs:
- **Painel Admin:** `https://[seu-site].netlify.app/admin/`
- **Painel Dev (local):** `admin-secure.html`

---

## 🛡️ Funcionalidades de Segurança

### ✅ **Implementado:**
- Tela de login obrigatória
- Validação de token no servidor
- Sessão com expiração (24h)
- Proteção de todas as operações (adicionar, remover)
- Logout com limpeza de sessão
- Fallback para desenvolvimento local

### 🔒 **Proteções:**
- Token armazenado localmente
- Validação server-side das credenciais
- Auto-logout em caso de token expirado
- Headers CORS configurados

---

## 🚀 Deploy e Teste

### 1. Commit das mudanças:
```bash
git add .
git commit -m "feat: Adiciona sistema de login e autenticação ao admin"
git push origin main
```

### 2. Configurar no Netlify:
- Adicionar variável `AUTH_PASSWORD`
- Aguardar redeploy

### 3. Testar:
- Acessar `/admin/`
- Fazer login com as credenciais
- Testar adição/remoção de produtos

---

## 📝 Arquivos Criados/Modificados

- `netlify/functions/auth-login.js` - Função de login
- `netlify/functions/auth-validate.js` - Validação de token
- `admin/index.html` - Painel admin com login
- `admin-secure.html` - Versão de desenvolvimento
- `admin/index-backup.html` - Backup do painel anterior

---

## 🔧 Troubleshooting

### Erro de login:
1. Verificar se `AUTH_PASSWORD` está configurada
2. Testar com a senha correta
3. Verificar logs das functions no Netlify

### Token expirado:
- Sessão expira em 24h
- Fazer logout e login novamente

### Acesso negado:
- Verificar se as funções foram deployadas
- Testar endpoints `/api/auth-login` e `/api/auth-validate`

---

## 🔮 Próximas Melhorias

Para um sistema mais robusto, considere implementar:
- JWT tokens
- Múltiplos usuários
- Níveis de permissão
- 2FA (Two-Factor Authentication)
- Rate limiting
- Logs de auditoria

---

**✨ Agora seu painel admin está protegido! ✨**