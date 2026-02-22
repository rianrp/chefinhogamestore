// Vercel Function - Preview para WhatsApp/Telegram
// /api/p/[id].js
// Recebe nome da imagem SEM .jpg e retorna HTML com meta tags

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id) {
        return Response.redirect(new URL('/produtos.html', url.origin));
    }
    
    console.log('🔍 Preview para ID:', id);
    
    // Detectar se é nome de arquivo de imagem
    const isImageFileName = id.includes('produtos_');
    
    let imageUrl = '';
    let productName = 'Produto Gaming';
    let productPrice = 'Valor negociável';
    let productId = id;
    
    if (isImageFileName) {
        // Construir URL da imagem adicionando .jpg
        imageUrl = `https://ik.imagekit.io/setkpevha/produtos/${id}.jpg`;
        console.log('🖼️ URL da imagem construída:', imageUrl);
        
        // Tentar buscar dados do produto no Supabase
        try {
            const supabaseUrl = 'https://kirrtgqquxujcjeebqgr.supabase.co';
            const supabaseKey = 'sb_publishable_8RXpynIaSeZFMoJXqWvfuw_ZxJaoC9i';
            
            // Extrair timestamp do nome do arquivo
            const timestampMatch = id.match(/produtos_([0-9]+)_/);
            const timestamp = timestampMatch ? timestampMatch[1] : null;
            
            if (timestamp) {
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/products?image_url=like.*${timestamp}*&is_active=eq.true&limit=1`,
                    {
                        headers: {
                            'apikey': supabaseKey,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.ok) {
                    const products = await response.json();
                    if (products && products.length > 0) {
                        const product = products[0];
                        productName = product.name || 'Produto Gaming';
                        productPrice = product.rl_price > 0 
                            ? `R$ ${product.rl_price.toFixed(2)}` 
                            : 'Valor negociável';
                        productId = product.id;
                        console.log('✅ Produto encontrado:', productName);
                    }
                }
            }
        } catch (error) {
            console.error('⚠️ Erro ao buscar produto:', error);
            // Continua com dados genéricos
        }
    } else {
        // ID normal do Supabase - buscar produto
        try {
            const supabaseUrl = 'https://kirrtgqquxujcjeebqgr.supabase.co';
            const supabaseKey = 'sb_publishable_8RXpynIaSeZFMoJXqWvfuw_ZxJaoC9i';
            
            const response = await fetch(
                `${supabaseUrl}/rest/v1/products?id=eq.${id}&is_active=eq.true`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                const products = await response.json();
                if (products && products.length > 0) {
                    const product = products[0];
                    productName = product.name || 'Produto Gaming';
                    productPrice = product.rl_price > 0 
                        ? `R$ ${product.rl_price.toFixed(2)}` 
                        : 'Valor negociável';
                    imageUrl = product.image_url || `${url.origin}/img/chefinho.png`;
                    productId = product.id;
                    console.log('✅ Produto encontrado:', productName);
                }
            }
        } catch (error) {
            console.error('⚠️ Erro ao buscar produto:', error);
            imageUrl = `${url.origin}/img/chefinho.png`;
        }
    }
    
    // Fallback para imagem padrão
    if (!imageUrl) {
        imageUrl = `${url.origin}/img/chefinho.png`;
    }
    
    const title = `${productName} - Chefinho Gaming Store`;
    const description = `${productName} por ${productPrice}. Entrega imediata via WhatsApp! 🎮`;
    const redirectUrl = `${url.origin}/produto.html?id=${productId}`;
    
    console.log('📱 Gerando preview:', { title, imageUrl, redirectUrl });
    
    // HTML estático com meta tags - WhatsApp vai ler isso!
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / WhatsApp / Facebook / Telegram -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${redirectUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Chefinho Gaming Store">
    <meta property="og:locale" content="pt_BR">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Redirect instantâneo para página real -->
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <link rel="canonical" href="${redirectUrl}">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .card img {
            width: 100%;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        .card h1 {
            font-size: 1.5rem;
            margin: 0 0 10px 0;
        }
        .card .price {
            color: #00ff88;
            font-size: 1.3rem;
            font-weight: bold;
            margin: 10px 0;
        }
        .card .loading {
            color: rgba(255,255,255,0.6);
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <img src="${imageUrl}" alt="${productName}" onerror="this.style.display='none'">
        <h1>${productName}</h1>
        <p class="price">${productPrice}</p>
        <p class="loading">🎮 Chefinho Gaming Store</p>
        <p class="loading">Redirecionando...</p>
    </div>
    <script>
        // Fallback redirect
        setTimeout(() => {
            window.location.href = '${redirectUrl}';
        }, 500);
    </script>
</body>
</html>`;
    
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}