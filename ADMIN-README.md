# 🎮 Chefinho Gaming Store - Painel Administrativo

Sistema de gerenciamento de produtos para a loja Chefinho Gaming Store usando Netlify Functions + KV Store.

## 🚀 Recursos Implementados

### ✅ **Backend (Netlify Functions)**
- **`/.netlify/functions/get-products`** - Busca produtos do KV Store
- **`/.netlify/functions/update-products`** - Atualiza produtos no KV Store (protegido por token)

### ✅ **Painel Admin**
- **`/admin/`** - Painel administrativo completo
- Interface mobile-first e responsiva
- Listagem de produtos existentes
- Formulário para adicionar novos produtos
- Estatísticas em tempo real

### ✅ **Integração Frontend**
- API atualizada no `main.js`
- Fallback automático para `data.json` se API falhar
- Compatibilidade total com código existente

## 🔧 **Como Usar**

### 1. **Migrar Dados Existentes**
1. Acesse: `/migrate-data.html`
2. Clique em "Migrar Dados para KV Store"
3. Aguarde confirmação de sucesso

### 2. **Acessar Painel Admin**
1. Acesse: `/admin/`
2. Visualize produtos existentes
3. Adicione novos produtos pelo formulário

### 3. **Configurar Produção**
1. Configure a variável de ambiente `ADMIN_TOKEN` no Netlify
2. Atualize o token no painel admin se necessário

## 🔒 **Segurança**

- **Token de Autorização**: Bearer token para proteger operações de escrita
- **CORS**: Configurado para permitir requisições do frontend
- **Validação**: Verificação básica de dados antes de salvar

## 📊 **Estrutura de Dados**

```json
{
  "site": { ... },
  "theme": { ... }, 
  "categories": [ ... ],
  "products": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "image_url": "string",
      "video_url": "string",
      "description": "string", 
      "rl_price": "number",
      "kks_price": "number",
      "quantity": "number",
      "is_active": "boolean",
      "created_at": "ISO string",
      "parcelado_price": "number",
      "purchased_value": "number"
    }
  ]
}
```

## 🌐 **Endpoints da API**

### GET `/.netlify/functions/get-products`
- **Descrição**: Retorna todos os dados (produtos + configurações)
- **Autenticação**: Não requerida
- **Resposta**: JSON completo com produtos e configurações

### POST `/.netlify/functions/update-products`
- **Descrição**: Atualiza dados completos no KV Store
- **Autenticação**: Bearer token requerido
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer [token]
  ```
- **Body**: JSON completo com produtos e configurações

## 🎯 **Categorias Disponíveis**

- `freefire` - Free Fire
- `mage` - Rucoy Mage  
- `kina` - Rucoy Knight
- `pally` - Rucoy Paladin
- `supercell` - Supercell Games
- `itens` - Itens Gerais
- `geral` - Geral
- `roblox` - Roblox

## 🛠️ **Desenvolvimento Local**

1. **Netlify CLI**: `netlify dev`
2. **KV Store**: Funciona automaticamente no ambiente Netlify
3. **Token**: Usar `teste123` para desenvolvimento

## 📱 **Mobile First**

O painel foi desenvolvido com foco mobile-first:
- ✅ Responsivo para todas as telas
- ✅ Interface touch-friendly
- ✅ Carregamento otimizado
- ✅ UX intuitiva

## 🔄 **Fluxo de Dados**

```
[Frontend] → [Netlify Functions] → [KV Store]
     ↑              ↓
[data.json] ← [Fallback]
```

1. Frontend tenta carregar da API
2. Se API falhar, usa `data.json` como fallback
3. Admin atualiza via API protegida
4. Dados são persistidos no KV Store

## 🚨 **Importante**

- ⚠️ Mantenha o `data.json` como backup até confirmar que tudo funciona
- ⚠️ Configure `ADMIN_TOKEN` em produção
- ⚠️ Teste a migração antes de remover `data.json`

## 🎉 **Próximos Passos**

- [ ] Edição de produtos existentes
- [ ] Remoção de produtos
- [ ] Upload de imagens
- [ ] Categorias personalizadas
- [ ] Analytics de produtos

---

Desenvolvido com 💜 para **Chefinho Gaming Store**