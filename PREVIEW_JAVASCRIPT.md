# 📱 WhatsApp Preview - Solução Simples com Nome da Imagem

## 🎯 Como funciona

**URL Normal**: `/produto.html?id=1771727859860` (ID do Supabase)
**URL Compartilhamento**: `/produto.html?id=produtos_1771727827420_44823e36bdf35ef7ef62de3da6d64216_gM1BYZmo5` (nome da imagem SEM .jpg)

### 🔄 Processo:

1. **Compartilhamento**: JavaScript extrai nome da imagem **sem .jpg** e gera URL
2. **WhatsApp acessa**: `/produto.html?id=produtos_1771727827420_hash` 
3. **JavaScript detecta**: ID contém 'produtos_' = é nome de arquivo
4. **Constrói URL**: Adiciona `.jpg` → `https://ik.imagekit.io/setkpevha/produtos/produtos_1771727827420_hash.jpg`
5. **Meta tags**: Atualizadas com URL construída
6. **Preview**: WhatsApp mostra imagem + dados do produto

### ✅ Vantagens:

- 🚫 **Sem APIs** ou endpoints externos
- 📝 **HTML estático** com meta tags dinâmicas via JS
- 🖼️ **URL diretamente relacionada** ao arquivo ImageKit
- 🔍 **Busca inteligente** por nome de arquivo ou timestamp
- ⚡ **Zero configuração** adicional

### 🧪 Como testar:

1. **Clique "Compartilhar"** em qualquer produto com imagem
2. **URL gerada**: `/produto.html?id=produtos_1771727827420_hash` (sem .jpg)
3. **Cole no WhatsApp** → JavaScript detecta e constrói URL .jpg
4. **Preview aparece** com a imagem do ImageKit!

**Solução 100% JavaScript, sem complications!** 🎉