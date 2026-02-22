# ✨ WhatsApp Preview - Sistema Híbrido

## 🎯 Como funciona o sistema híbrido

**Suporta 2 tipos de ID** para máxima flexibilidade:

### 🔢 Tipos de ID suportados:
1. **ID do Supabase**: `1771727859860` (ID único do banco)
2. **Timestamp da imagem**: `1771727827420` (extraído do nome do ImageKit)

### 📂 Padrão ImageKit:
```
https://ik.imagekit.io/setkpevha/produtos/produtos_1771727827420_44823e36bdf35ef7ef62de3da6d64216_gM1BYZmo5.jpg
                                                   └─────────┘
                                                   Timestamp usado como ID
```

## 🔍 Busca inteligente

Quando alguém acessa `produto.html?id=1771727827420`:

1. **1ª tentativa**: Busca por ID do Supabase (`WHERE id = 1771727827420`)
2. **2ª tentativa**: Busca por timestamp na image_url (`WHERE image_url LIKE '%1771727827420%'`)
3. **3ª tentativa**: Busca nos dados já carregados por timestamp

## 🚀 Compartilhamento otimizado

Quando você clica "Compartilhar":
- **Extrai** o timestamp da image_url: `produtos_1771727827420_hash.jpg`
- **Gera URL**: `/produto.html?id=1771727827420` 
- **WhatsApp** acessa essa URL e carrega a imagem diretamente!

## ✅ URLs que funcionam

Ambas as URLs levam para **o mesmo produto**:
- `/produto.html?id=1771727859860` ← ID do Supabase  
- `/produto.html?id=1771727827420` ← Timestamp da imagem

## 💡 Vantagem

**WhatsApp** prefere o timestamp porque:
- ✅ Conecta **diretamente** com a imagem no ImageKit
- ✅ Preview **mais rápido** e **confiável**
- ✅ URL **semanticamente relacionada** ao arquivo
- ✅ Funciona mesmo se o produto mudar de ID  

## 🧪 Para testar

1. Pegue qualquer produto com imagem
2. Clique "Compartilhar no WhatsApp"
3. **Cole no WhatsApp** → Preview aparece instantaneamente!
4. **Acesse a URL** → Funciona perfeitamente

**Sistema duplo = máxima compatibilidade!** 🎉