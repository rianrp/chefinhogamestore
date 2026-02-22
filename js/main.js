// Chefinho Gaming Store - JavaScript Principal

// Dados globais
// Constantes de emojis usando códigos Unicode
const emojis = {
    gamepad: "\uD83C\uDFAE",     // 🎮
    trophy: "\uD83C\uDFC6",      // 🏆
    person: "\uD83D\uDC64",      // 👤
    money: "\uD83D\uDCB0",       // 💰
    package: "\uD83D\uDCE6",     // 📦
    chart: "\uD83D\uDCCA",       // 📊
    dollar: "\uD83D\uDCB5",      // 💵
    lightning: "\u26A1",         // ⚡
    fire: "\uD83D\uDD25"         // 🔥
};

// Variáveis globais
let siteData = null;
let cart = JSON.parse(localStorage.getItem('chefinho-cart')) || [];

// Variáveis de paginação
let currentPage = 1;
let itemsPerPage = 12;
let totalItems = 0;
let filteredProducts = [];
let currentFilters = {
    category: '',
    search: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM carregado, iniciando aplicação...');
    await loadSiteData();
    updateCartCount();
    initializeEventListeners();

    // Log do sistema de categorias dinâmicas
    if (siteData) {
        console.log('🏷️ Sistema de Categorias Dinâmicas Ativo');
        console.log('📋 Categorias encontradas:', getAllCategories());
    }

    // Aguardar um pouco para garantir que todos os dados estejam carregados
    setTimeout(() => {
        // Executar handler da página atual após carregar os dados
        let page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

        if (PageHandlers[page]) {
            PageHandlers[page]();
        }
    }, 100);
});

// Funções de API - Sempre usa Supabase
async function getProdutos() {
    console.log('🔄 Carregando dados do Supabase...');

    if (typeof supabase === 'undefined' || !supabase.getSiteData) {
        throw new Error('Cliente Supabase não disponível');
    }

    const data = await supabase.getSiteData();
    console.log('✅ Supabase:', data.products?.length || 0, 'produtos');
    return data;
}

// Carregar dados do site
async function loadSiteData() {
    try {
        console.log('🔄 Iniciando carregamento de dados...');

        siteData = await getProdutos();

        if (siteData && siteData.products) {
            console.log('✅ Dados carregados com sucesso!');
            console.log('📊 Total de produtos:', siteData.products.length);
            console.log('🏷️ Categorias encontradas:', [...new Set(siteData.products.map(p => p.category))].filter(Boolean));

            // Mostrar produtos mais recentes no console
            const recentProducts = siteData.products
                .filter(p => p.created_at)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 3);

            if (recentProducts.length > 0) {
                console.log('🆕 Produtos mais recentes:');
                recentProducts.forEach(p => {
                    console.log(`  - ${p.name} (${p.category}) - ${new Date(p.created_at).toLocaleString()}`);
                });
            }
        } else {
            console.warn('⚠️ Dados carregados mas sem produtos');
        }

    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNotification('Erro ao carregar produtos. Verifique a conexão e recarregue a página.', 'error');
    }
}

// Adicionar produto ao carrinho
function addToCart(productId, productData = null) {
    // Se productData foi fornecido diretamente, usar ele
    let product = productData;

    // Caso contrário, buscar nos dados do site
    if (!product && siteData && siteData.products) {
        product = siteData.products.find(p => p.id === productId);
    }

    if (!product) {
        showNotification('Produto não encontrado!', 'warning');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.rl_price || product.price,
            image: product.image_url || product.image,
            quantity: 1,
            type: product.type || 'digital'
        };

        // Se for produto do Rucoy, adicionar informações específicas
        if (product.character) {
            cartItem.character = product.character;
            cartItem.type = 'rucoy-kks';
        }

        cart.push(cartItem);
    }

    saveCart();
    updateCartCount();
    showNotification('Produto adicionado ao carrinho!', 'success');
}

// Remover produto do carrinho
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    showNotification('Produto removido do carrinho!', 'info');

    // Re-renderizar o carrinho se estivermos na página do carrinho
    if (document.getElementById('cartItems')) {
        renderCart();
    }
}

// Atualizar quantidade no carrinho
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart();
            updateCartCount();
        }
    }
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('chefinho-cart', JSON.stringify(cart));
}

// Atualizar contador do carrinho
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Calcular total do carrinho
function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Gerar mensagem do WhatsApp
function generateWhatsAppMessage() {
    if (cart.length === 0) {
        showNotification('Seu carrinho está vazio!', 'warning');
        return;
    }

    const total = getCartTotal();

    // Verificar se há produtos do Rucoy no carrinho
    const hasRucoyItems = cart.some(item => item.type === 'rucoy-kks');

    let message; // Declarar a variável fora dos blocos

    if (hasRucoyItems) {
        // Se há produtos do Rucoy, usar formatação especial
        const rucoyItems = cart.filter(item => item.type === 'rucoy-kks');
        const otherItems = cart.filter(item => item.type !== 'rucoy-kks');

        message = `${emojis.gamepad} *PEDIDO - CHEFINHO GAMING STORE*\n\n`;

        if (rucoyItems.length > 0) {
            message += `${emojis.trophy} *RUCOY ONLINE - KKs:*\n`;
            rucoyItems.forEach((item, index) => {
                message += `${index + 1}. ${item.name}\n`;
                message += `   ${emojis.person} Personagem: ${item.character}\n`;
                message += `   ${emojis.money} R$ ${item.price.toFixed(2)}\n\n`;
            });
        }

        if (otherItems.length > 0) {
            message += `${emojis.package} *OUTROS ITENS:*\n`;
            otherItems.forEach((item, index) => {
                message += `${index + 1}. ${item.name}\n`;
                message += `   ${emojis.money} R$ ${item.price.toFixed(2)}\n`;
                message += `   ${emojis.chart} Quantidade: ${item.quantity}\n`;
                message += `   ${emojis.dollar} Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}\n\n`;
            });
        }

        message += `${emojis.dollar} *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
        message += `${emojis.lightning} *INFORMAÇÕES IMPORTANTES:*\n`;
        message += `• KKs Rucoy: Entrega em até 30 minutos\n`;
        message += `• Confirme se os nomes dos personagens estão corretos\n`;
        message += `• Você deve estar online no momento da entrega\n\n`;
        message += `${emojis.fire} Quero finalizar minha compra!`;
    } else {
        // Formatação padrão para outros produtos
        message = `${emojis.gamepad} *PEDIDO - CHEFINHO GAMING STORE* ${emojis.gamepad}\n\n`;
        message += `${emojis.package} *ITENS SELECIONADOS:*\n`;

        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   ${emojis.money} R$ ${item.price.toFixed(2)}\n`;
            message += `   ${emojis.chart} Quantidade: ${item.quantity}\n`;
            message += `   ${emojis.dollar} Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}\n\n`;
        });

        message += `${emojis.money} *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
        message += `${emojis.fire} Quero finalizar minha compra!`;
    }

    const whatsappNumber = siteData?.site?.whatsapp || '556993450986';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`;

    window.open(whatsappUrl, '_blank');
    showNotification('Redirecionando para WhatsApp...', 'success');
}

// Limpar carrinho
function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    showNotification('Carrinho limpo!', 'info');
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove após 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Compartilhar produto específico
function shareProduct(product, platform = 'whatsapp') {
    // Extrair nome da imagem sem .jpg para compartilhamento
    let shareId = product.id; // Fallback para ID do Supabase
    
    if (product.image_url && product.image_url.includes('produtos/produtos_')) {
        // Extrair nome completo do arquivo sem extensão
        const urlParts = product.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1]; // Ex: produtos_1771727827420_hash.jpg
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // Remove .jpg
        
        if (nameWithoutExt) {
            shareId = nameWithoutExt; // Ex: produtos_1771727827420_44823e36bdf35ef7ef62de3da6d64216_gM1BYZmo5
            console.log('🔄 Usando nome da imagem para compartilhamento:', shareId);
        }
    }
    
    const productUrl = `${window.location.origin}/produto.html?id=${encodeURIComponent(shareId)}`;
    
    const shareText = `${product.name} - ${getCategoryName(product.category)}`;
    const priceText = product.rl_price > 0 ? `por R$ ${product.rl_price.toFixed(2)}` : 'com valor negociável';
    const fullText = `🎮 ${shareText} ${priceText}! Confira na Chefinho Gaming Store`;

    let shareUrl = '';

    switch (platform) {
        case 'whatsapp':
            const whatsappNumber = siteData?.site?.whatsapp || '556993450986';
            const message = `${fullText}\n\n👆 Acesse o link para ver detalhes, imagens e vídeos!\n\n${productUrl}`;
            shareUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
            break;

        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
            break;

        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}&url=${encodeURIComponent(productUrl)}`;
            break;

        case 'telegram':
            // Telegram lê automaticamente as meta tags da página do produto
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(fullText)}`;
            break;

        case 'copy':
            navigator.clipboard.writeText(productUrl).then(() => {
                const isImageName = shareId.includes('produtos_');
                const message = isImageName 
                    ? 'Link com preview de imagem copiado! 🖼️' 
                    : 'Link do produto copiado! 📱';
                showNotification(message, 'success');
            });
            return;

        default:
            shareUrl = productUrl;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank');

        const isImageName = shareId.includes('produtos_');
        const previewPlatforms = ['whatsapp', 'telegram', 'facebook'];
        const message = previewPlatforms.includes(platform)
            ? `Compartilhando ${product.name} via ${platform} - preview ${isImageName ? 'com imagem direta' : 'automático'} será mostrado! 📱`
            : `Compartilhando via ${platform}...`;

        showNotification(message, 'info');
    }
}

// Obter todas as categorias (principais + dinâmicas)
function getAllCategories() {
    const allCategories = new Map();

    // Primeiro, adicionar as categorias principais definidas no data.json
    if (siteData.categories) {
        siteData.categories.forEach(cat => {
            allCategories.set(cat.id, {
                id: cat.id,
                name: cat.name,
                description: cat.description,
                icon: cat.icon,
                type: 'main', // Categoria principal
                productCount: 0
            });
        });
    }

    // Depois, adicionar categorias dinâmicas baseadas nos produtos
    if (siteData.products) {
        siteData.products.forEach(product => {
            if (product.category && product.is_active) {
                if (allCategories.has(product.category)) {
                    // Incrementar contador se já existe
                    allCategories.get(product.category).productCount++;
                } else {
                    // Criar categoria dinâmica se não existe
                    allCategories.set(product.category, {
                        id: product.category,
                        name: formatCategoryName(product.category),
                        description: `Produtos de ${formatCategoryName(product.category)}`,
                        icon: getDefaultCategoryIcon(product.category),
                        type: 'dynamic', // Categoria dinâmica
                        productCount: 1
                    });
                }
            }
        });
    }

    return Array.from(allCategories.values()).sort((a, b) => {
        // Categorias principais primeiro, depois dinâmicas
        if (a.type === 'main' && b.type === 'dynamic') return -1;
        if (a.type === 'dynamic' && b.type === 'main') return 1;
        // Dentro do mesmo tipo, ordenar por nome
        return a.name.localeCompare(b.name);
    });
}

// Formatar nome da categoria dinâmica
function formatCategoryName(categoryId) {
    // Mapear IDs conhecidos para nomes amigáveis
    const knownCategories = {
        'roblox': 'Roblox',
        'clash royale': 'Clash Royale',
        'clash of clans': 'Clash of Clans',
        'brawl stars': 'Brawl Stars',
        'gta v': 'GTA V',
        'fifa': 'FIFA',
        'fortnite': 'Fortnite',
        'minecraft': 'Minecraft',
        'valorant': 'Valorant',
        'cs2': 'Counter-Strike 2',
        'lol': 'League of Legends'
    };

    if (knownCategories[categoryId.toLowerCase()]) {
        return knownCategories[categoryId.toLowerCase()];
    }

    // Para categorias não mapeadas, fazer capitalização automática
    return categoryId
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Obter ícone padrão para categoria dinâmica
function getDefaultCategoryIcon(categoryId) {
    const iconMap = {
        'roblox': 'fas fa-cube',
        'clash royale': 'fas fa-crown',
        'clash of clans': 'fas fa-castle',
        'brawl stars': 'fas fa-fist-raised',
        'gta v': 'fas fa-car',
        'fifa': 'fas fa-futbol',
        'fortnite': 'fas fa-crosshairs',
        'minecraft': 'fas fa-cubes',
        'valorant': 'fas fa-bullseye',
        'cs2': 'fas fa-bomb',
        'lol': 'fas fa-dragon'
    };

    return iconMap[categoryId.toLowerCase()] || 'fas fa-gamepad';
}

// Obter nome da categoria (melhorado)
function getCategoryName(categoryId) {
    if (!categoryId) return 'Sem categoria';

    // Primeiro tentar encontrar nas categorias principais
    if (siteData.categories) {
        const mainCategory = siteData.categories.find(cat => cat.id === categoryId);
        if (mainCategory) return mainCategory.name;
    }

    // Se não encontrou, usar formatação dinâmica
    return formatCategoryName(categoryId);
}

// Verificar se um anúncio está ativo (não expirado)
function isAnuncioAtivo(product) {
    if (!product.is_anuncio) return false;
    if (!product.anuncio_fim) return false;
    return new Date(product.anuncio_fim) > new Date();
}

// Obter informações de renderização do anúncio
function getAnuncioInfo(product) {
    const ativo = isAnuncioAtivo(product);
    if (!ativo) {
        return { badge: '', cssClass: '', borderStyle: '', anuncianteTag: '' };
    }

    const plano = product.anuncio_plano || 'basico';
    const configs = {
        basico: {
            label: 'Anúncio',
            color: '#8B5CF6',
            textColor: '#fff',
            icon: 'fas fa-bullhorn',
            glow: 'none',
            border: '1px solid rgba(139, 92, 246, 0.4)'
        },
        pro: {
            label: 'Destaque',
            color: '#FCD34D',
            textColor: '#1a1a2e',
            icon: 'fas fa-star',
            glow: '0 0 20px rgba(252, 211, 77, 0.2)',
            border: '2px solid rgba(252, 211, 77, 0.5)'
        },
        elite: {
            label: 'Fixado',
            color: '#F97316',
            textColor: '#fff',
            icon: 'fas fa-crown',
            glow: '0 0 25px rgba(249, 115, 22, 0.25)',
            border: '2px solid rgba(249, 115, 22, 0.6)'
        }
    };

    const cfg = configs[plano] || configs.basico;

    const badge = `<div class="anuncio-badge anuncio-${plano}" style="position:absolute;top:10px;left:10px;z-index:5;background:${cfg.color};color:${cfg.textColor};padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;display:flex;align-items:center;gap:5px;text-transform:uppercase;"><i class="${cfg.icon}"></i>${cfg.label}</div>`;

    const borderStyle = `style="position:relative;border:${cfg.border};box-shadow:${cfg.glow};"`;

    const anuncianteTag = product.anunciante_nome
        ? `<span class="anunciante-tag" style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;color:${cfg.color};margin-top:5px;"><i class="fas fa-user-tag"></i>por ${product.anunciante_nome}</span>`
        : '';

    return {
        badge,
        cssClass: `anuncio-card anuncio-${plano}`,
        borderStyle,
        anuncianteTag
    };
}

// Formatar valor KKs (mostra decimais apenas quando necessário)
function formatKks(value) {
    if (!value || value === 0) return '0';

    // Se for número inteiro, mostra sem decimais
    if (value % 1 === 0) {
        return value.toFixed(0);
    }

    // Se tiver decimais, mostra até 2 casas (remove zeros à direita)
    return parseFloat(value.toFixed(2)).toString();
}

// =====================================================
// Share/Meta Tags - Funções auxiliares  
// =====================================================

// Atualizar meta tags da página para compartilhamento
function updateProductMetaTags(product) {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/produto.html?id=${product.id}`;

    // Extrair timestamp da image_url do ImageKit para URL alternativa
    let imageTimestamp = null;
    if (product.image_url && product.image_url.includes('produtos_')) {
        const match = product.image_url.match(/produtos_([0-9]+)_/);
        if (match) {
            imageTimestamp = match[1];
            console.log('🕰️ Timestamp da imagem extraído:', imageTimestamp);
        }
    }

    // URL da imagem do produto - versão síncrona para meta tags
    let productImage = '';
    if (product.image_url && product.image_url.trim() !== '') {
        productImage = product.image_url;
    } else {
        // Fallback para imagem padrão se não tiver image_url
        productImage = `${baseUrl}/img/chefinho.png`;
    }

    // Garantir que a URL seja absoluta
    if (productImage && !productImage.startsWith('http')) {
        productImage = `${baseUrl}${productImage}`;
    }

    const productTitle = `${product.name} - Chefinho Gaming Store`;
    const categoryName = getCategoryName(product.category);
    const priceText = product.rl_price > 0 ? `R$ ${product.rl_price.toFixed(2)}` : 'Valor negociável';
    const productDescription = product.description
        ? `${product.description} - ${categoryName} por ${priceText}. Entrega imediata via WhatsApp na Chefinho Gaming Store.`
        : `${product.name} - ${categoryName} disponível por ${priceText}. Entrega imediata via WhatsApp na Chefinho Gaming Store.`;

    // Atualizar título da página
    document.title = productTitle;

    // Função helper para atualizar/criar meta tag
    function updateMetaTag(property, content, isName = false) {
        const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
        let meta = document.querySelector(selector);

        if (meta) {
            meta.setAttribute('content', content);
        } else {
            meta = document.createElement('meta');
            if (isName) {
                meta.setAttribute('name', property);
            } else {
                meta.setAttribute('property', property);
            }
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
        }
    }

    // Description padrão
    updateMetaTag('description', productDescription, true);

    // Open Graph / Facebook
    updateMetaTag('og:type', 'product');
    updateMetaTag('og:url', productUrl);
    updateMetaTag('og:title', productTitle);
    updateMetaTag('og:description', productDescription);
    updateMetaTag('og:image', productImage);
    updateMetaTag('og:site_name', 'Chefinho Gaming Store');
    updateMetaTag('og:locale', 'pt_BR');
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', productUrl);
    updateMetaTag('twitter:title', productTitle);
    updateMetaTag('twitter:description', productDescription);
    updateMetaTag('twitter:image', productImage);

    // Product specific (Schema.org)
    if (product.rl_price > 0) {
        updateMetaTag('product:price:amount', product.rl_price.toFixed(2));
        updateMetaTag('product:price:currency', 'BRL');
    }
    updateMetaTag('product:availability', product.quantity > 0 ? 'in stock' : 'out of stock');

    // Log para debug com timestamp
    console.log('📱 Meta tags atualizadas:', {
        produto: product.name,
        imagem: productImage,
        imagemOriginal: product.image_url,
        timestampImagem: imageTimestamp,
        idSupabase: product.id,
        urlCompartilhamento: productUrl
    });

    console.log('🔗 URL de compartilhamento:', productUrl);
}

// =====================================================
// YouTube - Funções auxiliares
// =====================================================

// Extrair ID do vídeo do YouTube a partir de uma URL
function getYoutubeVideoId(url) {
    if (!url) return null;

    // Padrões de URL do YouTube
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // ID direto
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// Gerar URL de embed do YouTube
function getYoutubeEmbedUrl(url) {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
}

// Verificar se produto tem vídeo do YouTube
function hasYoutubeVideo(product) {
    return product && product.youtube_url && getYoutubeVideoId(product.youtube_url);
}

// Filtrar produtos
function filterProducts(category = '', searchTerm = '') {
    if (!siteData.products) return [];

    return siteData.products.filter(product => {
        const matchesCategory = !category || product.category === category;
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch && product.is_active;
    });
}

// Cache de thumbnails gerados
const thumbnailCache = new Map();

// Gerar thumbnail automaticamente do vídeo
function generateVideoThumbnail(videoUrl, callback, timeOffset = 5) {
    console.log('🎬 Gerando thumbnail do vídeo:', videoUrl);

    // Verificar cache primeiro
    const cacheKey = `${videoUrl}_${timeOffset}`;
    if (thumbnailCache.has(cacheKey)) {
        console.log('✅ Thumbnail encontrado no cache');
        callback(thumbnailCache.get(cacheKey));
        return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true; // Importante para alguns navegadores
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
        // Definir tempo para captura (5 segundos ou 10% do vídeo)
        const captureTime = Math.min(timeOffset, video.duration * 0.1);
        video.currentTime = captureTime;
    };

    video.onseeked = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 800;
            canvas.height = video.videoHeight || 600;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Adicionar overlay indicando que é vídeo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width - 80, canvas.height - 80, 80, 80);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('▶️', canvas.width - 40, canvas.height - 30);

            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Salvar no cache
            thumbnailCache.set(cacheKey, thumbnailUrl);

            console.log('✅ Thumbnail gerado com sucesso');
            callback(thumbnailUrl);

        } catch (error) {
            console.error('❌ Erro ao gerar thumbnail:', error);
            callback(null);
        }
    };

    video.onerror = (error) => {
        console.error('❌ Erro ao carregar vídeo:', error);
        callback(null);
    };

    video.src = videoUrl;
}

// Função auxiliar para obter URL da imagem do produto (com otimização ImageKit)
function getImageUrl(product, callback = null) {
    const defaultImage = 'https://znsfsumrrhjewbteiztr.supabase.co/storage/v1/object/public/contas/contas/boss-jewel.jpg';

    // Função para otimizar URL com ImageKit se disponível
    const optimizeUrl = (url) => {
        if (typeof imageKit !== 'undefined' && imageKit.getProductCard) {
            return imageKit.getProductCard(url);
        }
        return url;
    };

    // Se tem image_url válida, usar ela
    if (product.image_url && product.image_url.trim() !== '') {
        const optimized = optimizeUrl(product.image_url);
        if (callback) callback(optimized);
        return optimized;
    }

    // Se não tem imagem mas tem vídeo, gerar thumbnail
    if (product.video_url && callback) {
        generateVideoThumbnail(product.video_url, (thumbnailUrl) => {
            callback(thumbnailUrl || defaultImage);
        });
        return null; // Indica que será assíncrono
    }

    // Fallback padrão
    if (callback) callback(defaultImage);
    return defaultImage;
}

// Aplicar imagem no elemento de forma assíncrona
function setProductImage(imgElement, product) {
    // Primeiro, definir uma imagem temporária
    const tempImage = 'https://znsfsumrrhjewbteiztr.supabase.co/storage/v1/object/public/contas/contas/boss-jewel.jpg';
    imgElement.src = tempImage;

    // Depois, obter a imagem correta (possivelmente gerando thumbnail)
    getImageUrl(product, (finalImageUrl) => {
        imgElement.src = finalImageUrl;

        // Adicionar classe para indicar que é thumbnail de vídeo
        if (!product.image_url && product.video_url) {
            imgElement.classList.add('video-thumbnail');
            imgElement.setAttribute('title', 'Thumbnail gerado do vídeo - Clique para ver em tela cheia');
        }
    });
}

// Renderizar produtos
function renderProducts(products, containerId) {
    console.log('=== RENDER PRODUCTS ===');
    console.log('Produtos recebidos:', products?.length || 0);
    console.log('Container ID:', containerId);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container não encontrado:', containerId);
        return;
    }

    console.log('Container encontrado:', container);
    console.log('Renderizando produtos:', products?.length || 0, 'no container:', containerId);

    if (!products || products.length === 0) {
        console.log('Nenhum produto para renderizar');
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }

    console.log('Primeiros 2 produtos a serem renderizados:', products.slice(0, 2));

    // Renderizar estrutura básica dos produtos primeiro
    container.innerHTML = products.map(product => {
        const anuncioInfo = getAnuncioInfo(product);
        const hasYT = hasYoutubeVideo(product);
        return `
        <div class="card product-card ${anuncioInfo.cssClass}" data-product-id="${product.id}" ${anuncioInfo.borderStyle}>
            ${anuncioInfo.badge}
            ${hasYT ? `<div class="youtube-badge" title="Este produto tem vídeo no YouTube"><i class="fab fa-youtube"></i></div>` : ''}
            <img alt="${product.name}" class="product-image" 
                 title="Clique para ver em tela cheia"
                 onerror="this.src='https://via.placeholder.com/300x250/8B5CF6/ffffff?text=Erro+ao+Carregar'">
            <div class="card-body">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-prices">
                    ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0) ?
                `<span class="price price-main" style="color: #FCD34D;"><i class="fab fa-whatsapp"></i> Valor negociável</span>` :
                product.rl_price > 0 ? `<span class="price price-main">R$ ${product.rl_price.toFixed(2)}</span>` : `<span class="price price-main">${formatKks(product.kks_price)} Kks</span>`
            }
                    ${product.parcelado_price > 0 ? `<span class="price price-parcelado">Parcelado: R$ ${product.parcelado_price.toFixed(2)}</span>` : ''}
                    ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0) ? '' :
                product.rl_price <= 0 ? `<span class="price price-kks-secondary">Apenas em KKs</span>` : `<span class="price price-kks-secondary">${formatKks(product.kks_price)} KKs</span>`
            }
                </div>
                ${product.description ? `<p class="product-description">${product.description.substring(0, 100)}...</p>` : ''}
                ${anuncioInfo.anuncianteTag}
            </div>
            <div class="card-footer">
                <div class="product-actions d-flex gap-2">
                    <button class="btn btn-primary btn-round flex-1" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Adicionar
                    </button>
                    <a href="produto.html?id=${product.id}" class="btn btn-outline btn-round">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `}).join('');

    // Depois processar as imagens de forma assíncrona
    products.forEach(product => {
        const productCard = container.querySelector(`[data-product-id="${product.id}"]`);
        if (productCard) {
            const imgElement = productCard.querySelector('img');

            // Configurar imagem
            setProductImage(imgElement, product);

            // Configurar clique no modal após obter a imagem final
            getImageUrl(product, (finalImageUrl) => {
                imgElement.onclick = () => {
                    openImageModal(
                        finalImageUrl,
                        product.name.replace(/'/g, "\\'"),
                        (product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' '),
                        product.video_url || ''
                    );
                };
            });
        }
    });
}

// Renderizar categorias (melhorado para usar sistema dinâmico)
function renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('Container não encontrado:', containerId);
        return;
    }

    const allCategories = getAllCategories();
    console.log('Renderizando categorias:', allCategories.length, '(principais + dinâmicas)');

    // Filtrar apenas categorias que têm produtos
    const categoriesWithProducts = allCategories.filter(cat => cat.productCount > 0);

    if (categoriesWithProducts.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma categoria disponível</p>';
        return;
    }

    container.innerHTML = categoriesWithProducts.map(category => `
        <a href="produtos.html?category=${category.id}" class="card category-card ${category.type === 'dynamic' ? 'dynamic-category' : 'main-category'}">
            <div class="category-icon">
                <i class="${category.icon}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description}</p>
            <div class="category-meta">
                <span class="product-count">${category.productCount} produto${category.productCount !== 1 ? 's' : ''}</span>
                ${category.type === 'dynamic' ? '<span class="dynamic-badge">Auto</span>' : ''}
            </div>
        </a>
    `).join('');
}

// Inicializar event listeners
function initializeEventListeners() {
    // Carregar preferência de itens por página
    const savedItemsPerPage = localStorage.getItem('chefinho-items-per-page');
    if (savedItemsPerPage) {
        itemsPerPage = parseInt(savedItemsPerPage);
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.value = itemsPerPage;
        }
    }

    // Busca com debounce para melhor performance
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const searchTerm = this.value;

            // Debounce de 300ms para evitar muitas requisições
            searchTimeout = setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const category = urlParams.get('category') || '';
                applyFilters(category, searchTerm, true);
            }, 300);
        });
    }

    // Filtro de categoria
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            const category = this.value;
            const searchTerm = document.getElementById('searchInput')?.value || '';
            applyFilters(category, searchTerm, true);
        });
    }

    // Itens por página
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function () {
            changeItemsPerPage(this.value);
        });
    }

    // Botões de visualização (grid/lista)
    const viewButtons = document.querySelectorAll('.view-btn');
    console.log('Configurando event listeners para botões de visualização. Botões encontrados:', viewButtons.length);
    viewButtons.forEach(btn => {
        console.log('Configurando botão:', btn.dataset.view);
        btn.addEventListener('click', function () {
            const viewType = this.dataset.view;
            console.log('Botão clicado:', viewType);

            // Atualizar botões ativos
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Alterar visualização
            toggleView(viewType);
        });
    });
}

// Alternar entre visualização grid e lista (com paginação)
function toggleView(viewType) {
    console.log('🔄 toggleView chamado com tipo:', viewType);
    const container = document.getElementById('productsGrid');
    if (!container) {
        console.error('❌ Container productsGrid não encontrado');
        return;
    }

    // Remover classes de visualização existentes
    container.classList.remove('products-grid', 'products-list');

    if (viewType === 'list') {
        console.log('📋 Mudando para modo lista com paginação');
        container.classList.add('products-list');
    } else {
        console.log('🔲 Mudando para modo grid com paginação');
        container.classList.add('products-grid');
    }

    // Re-renderizar apenas a página atual
    renderCurrentPage();

    console.log('✅ Visualização alterada para:', viewType);
}

// Renderizar produtos no modo lista
function renderProductsList(products, containerId) {
    console.log('=== RENDER PRODUCTS LIST ===');
    console.log('Produtos recebidos:', products?.length || 0);
    console.log('Container ID:', containerId);

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container não encontrado:', containerId);
        return;
    }

    console.log('Container encontrado:', container);
    console.log('Renderizando produtos em lista:', products?.length || 0, 'no container:', containerId);

    if (!products || products.length === 0) {
        console.log('Nenhum produto para renderizar em lista');
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }

    console.log('Gerando HTML para produtos em lista...');

    // Renderizar estrutura básica primeiro
    container.innerHTML = products
        .map((product) => {
            const anuncioInfo = getAnuncioInfo(product);
            const hasYT = hasYoutubeVideo(product);

            return `
            <div class="card product-card-list ${anuncioInfo.cssClass}"
                 data-product-id="${product.id}"
                 ${anuncioInfo.borderStyle || ''}>
                 
                ${anuncioInfo.badge || ''}
                ${hasYT ? `<div class="youtube-badge youtube-badge-list" title="Este produto tem vídeo no YouTube"><i class="fab fa-youtube"></i></div>` : ''}

                <div class="product-list-content">
                    <img 
                        src="${product.image || ''}"
                        alt="${product.name}"
                        class="product-image-list"
                        title="Clique para ver em tela cheia"
                        onerror="this.src='https://via.placeholder.com/120x120/8B5CF6/ffffff?text=Erro+ao+Carregar'">

                    <div class="product-info-list">
                        <h3 class="product-name">${product.name}</h3>

                        ${product.description
                    ? `<p class="product-description-list">
                                    ${product.description.substring(0, 150)}...
                                   </p>`
                    : ''
                }

                        <div class="product-meta-list">
                            <span class="product-category">
                                ${getCategoryName(product.category)}
                            </span>
                            <span class="product-availability">
                                Disponível: ${product.quantity}
                            </span>
                            ${anuncioInfo.anuncianteTag || ''}
                        </div>
                    </div>

                    <div class="product-prices-list">
                        ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0)
                    ? `<span class="price price-main" style="color: #FCD34D;">
                                    <i class="fab fa-whatsapp"></i> Valor negociável
                                   </span>`
                    : product.rl_price > 0
                        ? `<span class="price price-main">
                                    R$ ${product.rl_price.toFixed(2)}
                                   </span>`
                        : ''
                }

                        ${product.parcelado_price > 0
                    ? `<span class="price price-parcelado">
                                    Parcelado: R$ ${product.parcelado_price.toFixed(2)}
                                   </span>`
                    : ''
                }

                        ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0)
                    ? ''
                    : `<span class="price price-kks-secondary">
                                    ${formatKks(product.kks_price)} KKs
                                   </span>`
                }
                    </div>

                    <div class="product-actions-list">
                        <button 
                            class="btn btn-primary btn-round"
                            onclick="addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i>
                            Adicionar
                        </button>

                        <a href="produto.html?id=${product.id}"
                           class="btn btn-outline btn-round">
                            <i class="fas fa-eye"></i>
                            Ver
                        </a>
                    </div>
                </div>
            </div>
        `;
        })
        .join('');

    // Depois processar as imagens de forma assíncrona
    products.forEach(product => {
        const productCard = container.querySelector(`[data-product-id="${product.id}"]`);
        if (productCard) {
            const imgElement = productCard.querySelector('img');

            // Configurar imagem
            setProductImage(imgElement, product);

            // Configurar clique no modal
            getImageUrl(product, (finalImageUrl) => {
                imgElement.onclick = () => {
                    openImageModal(
                        finalImageUrl,
                        product.name.replace(/'/g, "\\'"),
                        (product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' '),
                        product.video_url || ''
                    );
                };
            });
        }
    });

    console.log('HTML gerado e inserido no container');
}

// Funções para páginas específicas
const PageHandlers = {
    // Página inicial
    index: function () {
        console.log('Executando handler da página index');

        // Aguardar os dados serem carregados
        if (!siteData.categories || !siteData.products) {
            console.log('Dados ainda não carregados, aguardando...');
            setTimeout(() => this.index(), 100);
            return;
        }

        console.log('Renderizando categorias...');
        renderCategories('categoriesGrid');

        // Produtos em destaque (primeiros 8)
        const featuredProducts = siteData.products?.slice(0, 8) || [];
        console.log('Produtos em destaque:', featuredProducts.length);
        renderProducts(featuredProducts, 'featuredProducts');

        // Atualizar estatísticas
        if (siteData.stats) {
            const statsContainer = document.querySelector('.stats');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-item fade-in-up">
                        <span class="stat-number">50+</span>
                        <span class="stat-label">Produtos</span>
                    </div>
                    <div class="stat-item fade-in-up">
                        <span class="stat-number">1k+</span>
                        <span class="stat-label">Clientes</span>
                    </div>
                    <div class="stat-item fade-in-up">
                        <span class="stat-number">${siteData.stats.support}</span>
                        <span class="stat-label">Suporte</span>
                    </div>
                `;
            }
        }
    },

    // Página de produtos (com sistema de paginação)
    produtos: function () {
        console.log('🔄 Executando handler da página produtos com paginação');
        console.log('siteData disponível:', !!siteData);
        console.log('Produtos disponíveis:', siteData?.products?.length || 0);

        // Aguardar os dados serem carregados
        if (!siteData.categories || !siteData.products) {
            console.log('Dados ainda não carregados, aguardando...');
            setTimeout(() => this.produtos(), 200);
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || '';
        const searchTerm = urlParams.get('search') || '';
        const page = parseInt(urlParams.get('page')) || 1;

        console.log('📋 Parâmetros:', { category, searchTerm, page });

        // Configurar valores iniciais dos filtros
        if (category) {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = category;
            }
        }

        if (searchTerm) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchTerm;
            }
        }

        // Garantir que o container está no modo grid inicialmente
        const container = document.getElementById('productsGrid');
        if (container) {
            container.classList.remove('products-list');
            container.classList.add('products-grid');
        }

        // Preencher select de categorias (usando sistema dinâmico)
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            const allCategories = getAllCategories();
            const categoriesWithProducts = allCategories.filter(cat => cat.productCount > 0);

            categoryFilter.innerHTML = `
                <option value="">Todas as categorias (${siteData.products?.length || 0} produtos)</option>
                ${categoriesWithProducts.map(cat =>
                `<option value="${cat.id}" ${cat.id === category ? 'selected' : ''}>
                        ${cat.name} (${cat.productCount})
                        ${cat.type === 'dynamic' ? ' 🔄' : ''}
                    </option>`
            ).join('')}
            `;
        }

        // Configurar página inicial
        currentPage = page;

        // Aplicar filtros e renderizar com paginação
        applyFilters(category, searchTerm, false);

        console.log('✅ Sistema de paginação inicializado');
        console.log(`📄 Página ${currentPage} | ${itemsPerPage} itens por página | ${totalItems} total`);
    },

    // Página de produto individual
    produto: async function () {
        // Aguardar os dados serem carregados
        if (!siteData || !siteData.products) {
            setTimeout(() => this.produto(), 100);
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            const container = document.getElementById('productDetails');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FCD34D; margin-bottom: 20px;"></i>
                        <h2>Produto não especificado</h2>
                        <p style="color: #a0a0a0; margin: 20px 0;">Use: <code>produto.html?id=NUMERO</code></p>
                        <a href="/produtos.html" class="btn btn-primary btn-round">Ver Todos os Produtos</a>
                    </div>
                `;
            }
            return;
        }

        // Detectar se o ID é um nome de arquivo de imagem (contém 'produtos_')
        const isImageFileName = productId.includes('produtos_');
        let product = null;
        let constructedImageUrl = null;
        
        if (isImageFileName) {
            // É um nome de arquivo - construir URL da imagem adicionando .jpg
            constructedImageUrl = `https://ik.imagekit.io/setkpevha/produtos/${productId}.jpg`;
            console.log('🖼️ Detectado nome de imagem, URL construída:', constructedImageUrl);
            
            // Buscar produto pela image_url construída
            product = siteData.products?.find(p => p.image_url === constructedImageUrl);
            
            if (!product) {
                // Buscar por qualquer URL que contenha partes do nome
                const fileNameParts = productId.replace('produtos_', '').split('_');
                const timestampPart = fileNameParts[0];
                
                product = siteData.products?.find(p => {
                    return p.image_url && p.image_url.includes(timestampPart);
                });
                
                if (product) {
                    console.log('✅ Produto encontrado por timestamp da imagem');
                }
            } else {
                console.log('✅ Produto encontrado por URL exata da imagem');
            }
        } else {
            // ID normal do Supabase
            product = siteData.products?.find(p => p.id === productId || p.id === parseInt(productId));
            
            // Se não encontrou nos dados carregados, buscar no servidor
            if (!product) {
                console.log('🔍 Produto não encontrado no cache, buscando no servidor...');
                try {
                    product = await supabase.getProductById(productId);
                } catch (error) {
                    console.error('❌ Erro ao buscar produto no servidor:', error);
                }
            }
        }

        if (!product) {
            const container = document.getElementById('productDetails');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-times-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
                        <h2>Produto não encontrado</h2>
                        <p style="color: #a0a0a0; margin: 20px 0;">O produto ID "${productId}" não existe.</p>
                        <a href="/produtos.html" class="btn btn-primary btn-round">Ver Todos os Produtos</a>
                    </div>
                `;
            }
            return;
        }

        // Atualizar meta tags para compartilhamento
        // Se veio por nome de imagem, usar a URL construída para as meta tags
        if (constructedImageUrl && product) {
            const originalImageUrl = product.image_url;
            product.image_url = constructedImageUrl;
            updateProductMetaTags(product);
            product.image_url = originalImageUrl; // Restaurar original
            console.log('📱 Meta tags com URL construída:', constructedImageUrl);
        } else if (product) {
            updateProductMetaTags(product);
        }

        // Renderizar detalhes do produto
        const container = document.getElementById('productDetails');
        if (container) {
            // Verificar quais mídias o produto tem
            const hasVideo = !!product.video_url;
            const hasYoutube = hasYoutubeVideo(product);
            const youtubeEmbedUrl = hasYoutube ? getYoutubeEmbedUrl(product.youtube_url) : null;
            const hasMultipleMedia = hasVideo || hasYoutube;

            // Gerar HTML da seção de mídia
            let mediaHTML = '';

            if (hasMultipleMedia) {
                // Tem mais de uma mídia - usar abas
                mediaHTML = `
                    <div class="product-media-tabs">
                        <div class="media-tab-buttons">
                            <button class="media-tab-btn active" onclick="showMedia('image-${product.id}')">
                                <i class="fas fa-image"></i> Imagem
                            </button>
                            ${hasYoutube ? `
                                <button class="media-tab-btn" onclick="showMedia('youtube-${product.id}')">
                                    <i class="fab fa-youtube" style="color: #FF0000;"></i> YouTube
                                </button>
                            ` : ''}
                            ${hasVideo ? `
                                <button class="media-tab-btn" onclick="showMedia('video-${product.id}')">
                                    <i class="fas fa-play"></i> Vídeo
                                </button>
                            ` : ''}
                        </div>
                        <div class="media-content">
                            <div id="image-${product.id}" class="media-item active">
                                <img src="${getImageUrl(product)}" alt="${product.name}" class="product-detail-image"
                                     onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '${product.video_url || ''}')"
                                     title="Clique para ver em tela cheia"
                                     onerror="this.src='https://via.placeholder.com/500x400/8B5CF6/ffffff?text=Erro+ao+Carregar'">
                            </div>
                            ${hasYoutube ? `
                                <div id="youtube-${product.id}" class="media-item">
                                    <div class="youtube-embed-container">
                                        <iframe 
                                            src="${youtubeEmbedUrl}" 
                                            title="Vídeo do produto - ${product.name}"
                                            frameborder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            allowfullscreen>
                                        </iframe>
                                    </div>
                                </div>
                            ` : ''}
                            ${hasVideo ? `
                                <div id="video-${product.id}" class="media-item">
                                    <video class="product-detail-video" controls preload="metadata">
                                        <source src="${product.video_url}" type="video/mp4">
                                        Seu navegador não suporta vídeo.
                                    </video>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                // Só tem imagem
                mediaHTML = `
                    <img src="${getImageUrl(product)}" alt="${product.name}" class="product-detail-image"
                         onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '')"
                         title="Clique para ver em tela cheia"
                         onerror="this.src='https://via.placeholder.com/500x400/8B5CF6/ffffff?text=Erro+ao+Carregar'">
                `;
            }

            container.innerHTML = `
                <div class="product-detail-grid">
                    <div class="product-image-container">
                        ${mediaHTML}
                    </div>
                    <div class="product-info">
                        ${(() => {
                    const anuncioInfo = getAnuncioInfo(product);
                    return anuncioInfo.badge ? `<div style="margin-bottom: 12px;">${anuncioInfo.badge.replace('position:absolute;top:10px;left:10px;z-index:5;', 'position:relative;display:inline-flex;')}</div>` : '';
                })()}
                        <h1 class="product-title">${product.name}</h1>
                        <div class="product-prices mb-4">
                            ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0) ?
                    `<span class="price price-main" style="font-size: 1.2rem; color: #FCD34D;"><i class="fab fa-whatsapp"></i> Valor negociável pelo WhatsApp</span>` :
                    product.rl_price > 0 ? `<span class="price price-main">R$ ${product.rl_price.toFixed(2)}</span>` : ''
                }
                            ${product.parcelado_price > 0 ? `<span class="price price-parcelado">Parcelado: R$ ${product.parcelado_price.toFixed(2)}</span>` : ''}
                            ${(!product.rl_price || product.rl_price <= 0) && (!product.kks_price || product.kks_price <= 0) ? '' : `<span class="price price-kks-secondary">${formatKks(product.kks_price)} KKs</span>`}
                        </div>
                        ${product.description ? `<div class="product-description mb-4"><p>${product.description}</p></div>` : ''}
                        <div class="product-meta mb-4">
                            <p><strong>Categoria:</strong> ${getCategoryName(product.category)}</p>
                            <p><strong>Disponível:</strong> ${product.quantity} unidade(s)</p>
                            ${isAnuncioAtivo(product) && product.anunciante_nome ? `<p style="color: ${product.anuncio_plano === 'elite' ? '#F97316' : product.anuncio_plano === 'pro' ? '#FCD34D' : '#8B5CF6'};"><strong><i class="fas fa-user-tag"></i> Anunciante:</strong> ${product.anunciante_nome}</p>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary btn-round" onclick="addToCart('${product.id}')">
                                <i class="fas fa-cart-plus"></i>
                                Adicionar ao Carrinho
                            </button>
                            <button class="btn btn-yellow btn-round" onclick="addToCart('${product.id}'); generateWhatsAppMessage();">
                                <i class="fab fa-whatsapp"></i>
                                Comprar Agora
                            </button>
                        </div>
                        <div class="product-share mt-4">
                            <h4>Compartilhar este produto:</h4>
                            <div class="share-buttons">
                                <button class="btn btn-outline btn-sm" onclick="shareProduct(siteData.products.find(p => p.id === '${product.id}'), 'whatsapp')" title="Compartilhar no WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="shareProduct(siteData.products.find(p => p.id === '${product.id}'), 'facebook')" title="Compartilhar no Facebook">
                                    <i class="fab fa-facebook"></i>
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="shareProduct(siteData.products.find(p => p.id === '${product.id}'), 'twitter')" title="Compartilhar no Twitter">
                                    <i class="fab fa-twitter"></i>
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="shareProduct(siteData.products.find(p => p.id === '${product.id}'), 'telegram')" title="Compartilhar no Telegram">
                                    <i class="fab fa-telegram"></i>
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="shareProduct(siteData.products.find(p => p.id === '${product.id}'), 'copy')" title="Copiar link">
                                    <i class="fas fa-link"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Produtos relacionados
        const relatedProducts = siteData.products?.filter(p =>
            p.category === product.category && p.id !== product.id && p.is_active
        ).slice(0, 4) || [];

        if (relatedProducts.length > 0) {
            renderProducts(relatedProducts, 'relatedProducts');
        }
    },

    // Página do carrinho
    carrinho: function () {
        renderCart();
    },

    // Página Rucoy KKs
    rucoy: function () {
        console.log('Executando handler da página Rucoy');
        initializeRucoyPage();
    }
};

// Renderizar carrinho
function renderCart() {
    const container = document.getElementById('cartItems');
    const totalContainer = document.getElementById('cartTotal');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart text-center">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <h3>Seu carrinho está vazio</h3>
                <p class="text-muted">Adicione alguns produtos para continuar</p>
                <a href="produtos.html" class="btn btn-primary btn-round mt-3">
                    <i class="fas fa-shopping-bag"></i>
                    Ir às Compras
                </a>
            </div>
        `;
        if (totalContainer) {
            totalContainer.innerHTML = '';
        }
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item card">
            <div class="cart-item-content">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/100x100/8B5CF6/ffffff?text=Sem+Imagem'">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    ${item.type === 'rucoy-kks' ? `<p class="cart-item-character"><i class="fas fa-user"></i> ${item.character}</p>` : ''}
                    <p class="cart-item-price">R$ ${item.price.toFixed(2)}</p>
                </div>
                ${item.type === 'rucoy-kks' ?
            `<div class="cart-item-rucoy">
                        <span class="rucoy-badge">Rucoy KKs</span>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>` :
            `<div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">
                        R$ ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>`
        }
            </div>
        </div>
    `).join('');

    if (totalContainer) {
        const total = getCartTotal();
        totalContainer.innerHTML = `
            <div class="cart-summary card">
                <div class="card-header">
                    <h3>Resumo do Pedido</h3>
                </div>
                <div class="card-body">
                    <div class="summary-line">
                        <span>Subtotal:</span>
                        <span>R$ ${total.toFixed(2)}</span>
                    </div>
                    <div class="summary-line total">
                        <span>Total:</span>
                        <span>R$ ${total.toFixed(2)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-yellow btn-round w-100" onclick="generateWhatsAppMessage()">
                        <i class="fab fa-whatsapp"></i>
                        Finalizar no WhatsApp
                    </button>
                    <button class="btn btn-outline btn-round w-100 mt-2" onclick="clearCart(); renderCart();">
                        <i class="fas fa-trash"></i>
                        Limpar Carrinho
                    </button>
                </div>
            </div>
        `;
    }

    // Página de contato
    function contato() {
        console.log('Executando handler da página contato');

        // Aguardar os dados serem carregados
        if (!siteData.site) {
            console.log('Dados ainda não carregados, aguardando...');
            setTimeout(() => this.contato(), 100);
            return;
        }

        // Atualizar informações de contato com dados do site
        const contactMethods = document.querySelectorAll('.contact-method');
        contactMethods.forEach(method => {
            const whatsappLink = method.querySelector('a[href*="wa.me"]');
            if (whatsappLink && siteData.site.whatsapp) {
                const currentText = whatsappLink.getAttribute('href').split('text=')[1];
                if (currentText) {
                    const decodedText = decodeURIComponent(currentText);
                    whatsappLink.href = `https://api.whatsapp.com/send/?phone=${siteData.site.whatsapp}&text=${encodeURIComponent(decodedText)}&type=phone_number&app_absent=0`;
                }
            }
        });

        // Atualizar número do WhatsApp na interface
        const phoneDisplay = document.querySelector('.contact-details p');
        if (phoneDisplay && siteData.site.whatsapp) {
            const formattedPhone = siteData.site.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            phoneDisplay.textContent = formattedPhone;
        }

        // Atualizar botão flutuante do WhatsApp
        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat && siteData.site.whatsapp) {
            const currentText = whatsappFloat.getAttribute('href').split('text=')[1];
            if (currentText) {
                const decodedText = decodeURIComponent(currentText);
                whatsappFloat.href = `https://api.whatsapp.com/send/?phone=${siteData.site.whatsapp}&text=${encodeURIComponent(decodedText)}&type=phone_number&app_absent=0`;
            }
        }
    }
}

// === RUCOY PAGE FUNCTIONS ===

// Inicializar página Rucoy
function initializeRucoyPage() {
    const quantityInput = document.getElementById('kkQuantity');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const totalKksSpan = document.getElementById('totalKks');
    const totalPriceSpan = document.getElementById('totalPrice');
    const characterInput = document.getElementById('characterName');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');

    // Preço por KK
    const pricePerKK = 1.45;

    // Função para atualizar totais
    function updateTotals() {
        const quantity = parseInt(quantityInput.value) || 1;
        const totalPrice = (quantity * pricePerKK).toFixed(2);

        totalKksSpan.textContent = `${quantity}KK`;
        totalPriceSpan.textContent = `R$ ${totalPrice}`;
    }

    // Event listeners para controles de quantidade
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function () {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updateTotals();
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', function () {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue < 999) {
                quantityInput.value = currentValue + 1;
                updateTotals();
            }
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('input', function () {
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            if (value > 999) value = 999;
            this.value = value;
            updateTotals();
        });
    }

    // Função para validar formulário
    function validateForm() {
        const quantity = parseInt(quantityInput.value) || 1;
        const characterName = characterInput.value.trim();

        if (!characterName) {
            showNotification('Por favor, digite o nome do seu personagem', 'warning');
            characterInput.focus();
            return false;
        }

        if (characterName.length < 2) {
            showNotification('O nome do personagem deve ter pelo menos 2 caracteres', 'warning');
            characterInput.focus();
            return false;
        }

        return { quantity, characterName };
    }

    // Event listener para comprar agora
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function () {
            const formData = validateForm();
            if (formData) {
                buyRucoyKKsNow(formData.quantity, formData.characterName);
            }
        });
    }

    // Event listener para adicionar ao carrinho
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            const formData = validateForm();
            if (formData) {
                addRucoyKKsToCart(formData.quantity, formData.characterName);
            }
        });
    }

    // Inicializar totais
    updateTotals();
}

// Comprar KKs do Rucoy diretamente
function buyRucoyKKsNow(quantity, characterName) {
    const pricePerKK = 1.45;
    const totalPrice = (quantity * pricePerKK).toFixed(2);

    // Criar objeto do produto
    const rucoyProduct = {
        id: 'rucoy-kks',
        name: `${quantity}KK Rucoy Online`,
        price: parseFloat(totalPrice),
        quantity: 1,
        image: 'img/rucoyonline.png',
        character: characterName,
        type: 'rucoy-kks'
    };

    // Gerar mensagem para WhatsApp
    const message = generateRucoyWhatsAppMessage([rucoyProduct]);

    // Redirecionar para WhatsApp
    if (siteData.site && siteData.site.whatsapp) {
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${siteData.site.whatsapp}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
        window.open(whatsappUrl, '_blank');
        showNotification('Redirecionando para WhatsApp...', 'success');
    } else {
        showNotification('Erro: WhatsApp não configurado', 'danger');
    }
}

// Adicionar KKs do Rucoy ao carrinho
function addRucoyKKsToCart(quantity, characterName) {
    const pricePerKK = 1.45;
    const totalPrice = (quantity * pricePerKK).toFixed(2);

    // Criar objeto do produto
    const rucoyProduct = {
        id: `rucoy-kks-${Date.now()}`, // ID único para cada item
        name: `${quantity}KK Rucoy Online`,
        price: parseFloat(totalPrice),
        quantity: 1,
        image: 'img/rucoyonline.png',
        character: characterName,
        type: 'rucoy-kks'
    };

    // Adicionar ao carrinho
    cart.push(rucoyProduct);
    localStorage.setItem('chefinho-cart', JSON.stringify(cart));
    updateCartCount();

    showNotification(`${quantity}KK para ${characterName} adicionado ao carrinho!`, 'success');

    // Limpar formulário
    document.getElementById('kkQuantity').value = 1;
    document.getElementById('characterName').value = '';

    // Atualizar totais
    const totalKksSpan = document.getElementById('totalKks');
    const totalPriceSpan = document.getElementById('totalPrice');
    if (totalKksSpan) totalKksSpan.textContent = '1KK';
    if (totalPriceSpan) totalPriceSpan.textContent = 'R$ 1,45';
}

// Gerar mensagem do WhatsApp para Rucoy
function generateRucoyWhatsAppMessage(items) {
    let message = `🎮 *PEDIDO RUCOY ONLINE - CHEFINHO GAMING STORE*\n\n`;
    message += `📋 *DETALHES DO PEDIDO:*\n`;

    let total = 0;
    items.forEach((item, index) => {
        message += `\n${index + 1}. ${item.name}\n`;
        message += `   👤 Personagem: ${item.character}\n`;
        message += `   💰 Valor: R$ ${item.price.toFixed(2)}\n`;
        total += item.price;
    });

    message += `\n💵 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    message += `⚡ *INFORMAÇÕES IMPORTANTES:*\n`;
    message += `• Entrega em até 30 minutos\n`;
    message += `• Confirme se o nome do personagem está correto\n`;
    message += `• Você deve estar online no momento da entrega\n\n`;
    message += `🛒 Pedido realizado através do site da Chefinho Gaming Store`;

    return message;
}

// Função para alternar entre imagem e vídeo na página do produto
function showMedia(mediaId) {
    // Remover classe active de todos os media items
    document.querySelectorAll('.media-item').forEach(item => {
        item.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.media-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Ativar o media selecionado
    const selectedMedia = document.getElementById(mediaId);
    if (selectedMedia) {
        selectedMedia.classList.add('active');
    }

    // Ativar o botão correspondente baseado no tipo de mídia
    const buttons = document.querySelectorAll('.media-tab-btn');
    let activeButtonIndex = 0;

    if (mediaId.includes('youtube-')) {
        activeButtonIndex = 1; // YouTube é o segundo botão
    } else if (mediaId.includes('video-')) {
        // Se tem YouTube, vídeo é o terceiro botão, senão é o segundo
        const hasYoutubeBtn = document.querySelector('.media-tab-btn .fab.fa-youtube');
        activeButtonIndex = hasYoutubeBtn ? 2 : 1;
    }

    if (buttons[activeButtonIndex]) {
        buttons[activeButtonIndex].classList.add('active');
    }

    // Pausar vídeo se trocar para outra mídia
    if (!mediaId.includes('video-')) {
        document.querySelectorAll('.product-detail-video').forEach(video => {
            video.pause();
        });
    }
}

// =============================================================================
// Modal de Imagem / Lightbox
// =============================================================================

// Gerar URL de thumbnail do vídeo
function getVideoThumbnail(videoUrl) {
    if (!videoUrl) return null;

    // Se for um vídeo do Supabase, tentar gerar thumbnail
    if (videoUrl.includes('supabase.co')) {
        // Placeholder: em produção real, você poderia usar um serviço de thumbnail
        return `https://via.placeholder.com/800x450/8B5CF6/ffffff?text=📹+Video+Preview`;
    }

    // Para outros vídeos, retornar null para usar placeholder
    return null;
}

// Obter a melhor imagem disponível para um produto
function getProductImage(product, size = 'medium') {
    // Definir tamanhos de placeholder
    const sizes = {
        small: '300x250',
        medium: '500x400',
        large: '800x600'
    };

    const placeholderSize = sizes[size] || sizes.medium;

    // Se tem imagem, usar ela
    if (product.image_url && product.image_url.trim() !== '') {
        return product.image_url;
    }

    // Se não tem imagem mas tem vídeo, tentar thumbnail
    if (product.video_url) {
        const thumbnail = getVideoThumbnail(product.video_url);
        if (thumbnail) return thumbnail;

        // Fallback: placeholder específico para produtos com vídeo
        const productName = encodeURIComponent(product.name || 'Produto');
        return `https://via.placeholder.com/${placeholderSize}/8B5CF6/ffffff?text=📹+${productName}`;
    }

    // Fallback final: placeholder genérico
    const productName = encodeURIComponent(product.name || 'Produto');
    return `https://via.placeholder.com/${placeholderSize}/8B5CF6/ffffff?text=${productName}`;
}

// Abrir modal de imagem (melhorado para lidar com vídeos)
function openImageModal(imageSrc, title, description, videoUrl = null) {
    console.log('🖼️ Abrindo modal de imagem:', title);
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');

    if (modal && modalImage) {
        // Se não há imagem mas há vídeo, usar thumbnail do vídeo
        if ((!imageSrc || imageSrc === '') && videoUrl) {
            const thumbnail = getVideoThumbnail(videoUrl);
            imageSrc = thumbnail || `https://via.placeholder.com/800x450/8B5CF6/ffffff?text=${encodeURIComponent(title || 'Produto com Vídeo')}`;
            console.log('📹 Usando thumbnail do vídeo:', imageSrc);
        }

        modalImage.src = imageSrc;
        modalImage.alt = title || 'Imagem do produto';

        if (modalTitle) modalTitle.textContent = title || '';
        if (modalDescription) {
            let desc = description || '';
            // Adicionar aviso se for thumbnail de vídeo
            if (videoUrl && (!imageSrc || imageSrc.includes('placeholder'))) {
                desc += (desc ? '\n\n' : '') + '📹 Este produto possui vídeo demonstrativo disponível.';
            }
            modalDescription.textContent = desc;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll do fundo

        console.log('✅ Modal aberto com sucesso');
    } else {
        console.error('❌ Elementos do modal não encontrados');
    }
}

// Fechar modal de imagem
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restaurar scroll
    }
}

// Event listeners para o modal
document.addEventListener('DOMContentLoaded', function () {
    // Fechar modal clicando no fundo
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});

// === FUNÇÕES DE DEMONSTRAÇÃO - SISTEMA DE CATEGORIAS DINÂMICAS ===

// Função demo para adicionar produto com nova categoria (apenas para demonstração)
function addExampleProduct() {
    if (!siteData || !siteData.products) return;

    const exampleProduct = {
        "id": "demo-1",
        "name": "GTA V - Conta com $500M + RP Boost",
        "image_url": "https://via.placeholder.com/400x300/8B5CF6/ffffff?text=GTA+V+Demo",
        "rl_price": 45.00,
        "parcelado_price": 50.00,
        "kks_price": 31.03,
        "quantity": 1,
        "purchased_value": 0,
        "category": "gta v", // Nova categoria dinâmica!
        "description": "Conta GTA V Online com dinheiro ilimitado, todos os veículos desbloqueados e RP boost para level up rápido.",
        "created_at": "2025-11-08",
        "is_active": true
    };

    // Adicionar temporariamente para demonstração
    siteData.products.push(exampleProduct);

    console.log('✅ Produto de exemplo adicionado com nova categoria "gta v"');
    console.log('🔄 Sistema detectou automaticamente e criou categoria dinâmica');
    console.log('📋 Categorias atualizadas:', getAllCategories());

    // Re-renderizar a página atual
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    if (PageHandlers[page]) {
        PageHandlers[page]();
    }

    showNotification('Produto de exemplo GTA V adicionado! Categoria criada automaticamente.', 'success');
}

// Função para mostrar estatísticas do sistema de categorias
function showCategoryStats() {
    if (!siteData) return;

    const allCategories = getAllCategories();
    const mainCategories = allCategories.filter(cat => cat.type === 'main');
    const dynamicCategories = allCategories.filter(cat => cat.type === 'dynamic');

    const stats = {
        total: allCategories.length,
        principais: mainCategories.length,
        dinamicas: dynamicCategories.length,
        totalProdutos: siteData.products?.length || 0,
        categoriasComProdutos: allCategories.filter(cat => cat.productCount > 0).length
    };

    console.log('📊 Estatísticas do Sistema de Categorias:', stats);
    console.log('🏷️ Categorias Principais:', mainCategories);
    console.log('🔄 Categorias Dinâmicas:', dynamicCategories);

    return stats;
}

// === SISTEMA DE PAGINAÇÃO PROFISSIONAL ===

// Aplicar filtros e atualizar produtos
function applyFilters(category = '', searchTerm = '', resetPage = true) {
    currentFilters.category = category;
    currentFilters.search = searchTerm;

    if (resetPage) {
        currentPage = 1;
    }

    // Filtrar produtos
    filteredProducts = filterProducts(category, searchTerm);
    totalItems = filteredProducts.length;

    // Renderizar página atual
    renderCurrentPage();

    // Atualizar paginação
    renderPagination();

    // Atualizar info dos produtos
    updateProductsInfo();
}

// Renderizar página atual
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    console.log(`📄 Página ${currentPage}: produtos ${startIndex + 1}-${Math.min(endIndex, totalItems)} de ${totalItems}`);

    // Verificar modo de visualização
    const container = document.getElementById('productsGrid');
    const isList = container?.classList.contains('products-list');

    if (isList) {
        renderProductsList(pageProducts, 'productsGrid');
    } else {
        renderProducts(pageProducts, 'productsGrid');
    }
}

// Renderizar controles de paginação
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    const pagination = document.getElementById('pagination');

    if (!container || !pagination) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    let paginationHTML = '';

    // Botão Primeira Página
    if (currentPage > 1) {
        paginationHTML += `
            <button class="pagination-btn first-last" onclick="goToPage(1)" title="Primeira página">
                <i class="fas fa-angle-double-left"></i>
            </button>
        `;
    }

    // Botão Anterior
    paginationHTML += `
        <button class="pagination-btn prev-next ${currentPage <= 1 ? 'disabled' : ''}" 
                onclick="goToPage(${currentPage - 1})" title="Página anterior">
            <i class="fas fa-angle-left"></i> Anterior
        </button>
    `;

    // Números das páginas
    const pageNumbers = generatePageNumbers(currentPage, totalPages);

    pageNumbers.forEach(page => {
        if (page === '...') {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        } else {
            const isActive = page === currentPage;
            paginationHTML += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" 
                        onclick="goToPage(${page})" title="Página ${page}">
                    ${page}
                </button>
            `;
        }
    });

    // Botão Próximo
    paginationHTML += `
        <button class="pagination-btn prev-next ${currentPage >= totalPages ? 'disabled' : ''}" 
                onclick="goToPage(${currentPage + 1})" title="Próxima página">
            Próximo <i class="fas fa-angle-right"></i>
        </button>
    `;

    // Botão Última Página
    if (currentPage < totalPages) {
        paginationHTML += `
            <button class="pagination-btn first-last" onclick="goToPage(${totalPages})" title="Última página">
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;
    }

    pagination.innerHTML = paginationHTML;

    // Info da paginação
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        paginationInfo.innerHTML = `
            <div>
                Mostrando ${startItem}-${endItem} de ${totalItems} produtos (Página ${currentPage} de ${totalPages})
            </div>
            <div class="pagination-jump">
                <span>Ir para página:</span>
                <input type="number" id="pageJumpInput" min="1" max="${totalPages}" value="${currentPage}">
                <button onclick="jumpToPage()">Ir</button>
            </div>
        `;
    }
}

// Gerar números das páginas para exibição
function generatePageNumbers(current, total) {
    const pages = [];
    const delta = 2; // Quantas páginas mostrar antes/depois da atual

    // Sempre mostrar primeira página
    if (current > delta + 1) {
        pages.push(1);
        if (current > delta + 2) {
            pages.push('...');
        }
    }

    // Páginas ao redor da atual
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    // Sempre mostrar última página
    if (current < total - delta) {
        if (current < total - delta - 1) {
            pages.push('...');
        }
        pages.push(total);
    }

    return pages;
}

// Ir para página específica
function goToPage(page) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (page < 1 || page > totalPages || page === currentPage) {
        return;
    }

    const previousPage = currentPage;
    currentPage = page;

    // Scroll suave para o topo dos produtos
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Mostrar loading
    showPageLoading();

    // Log para debug
    console.log(`📄 Navegando da página ${previousPage} para ${currentPage}`);

    // Simular pequeno delay para UX suave (menos delay para melhor performance)
    setTimeout(() => {
        renderCurrentPage();
        renderPagination();
        hidePageLoading();
        updateURL();

        // Anunciar mudança para leitores de tela
        const announcement = `Página ${currentPage} de ${totalPages} carregada`;
        announceToScreenReader(announcement);
    }, 200);
}

// Anunciar para leitores de tela (acessibilidade)
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0,0,0,0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    `;
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Saltar para página digitada
function jumpToPage() {
    const input = document.getElementById('pageJumpInput');
    if (!input) return;

    const page = parseInt(input.value);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (page >= 1 && page <= totalPages) {
        goToPage(page);
        updateURL();
    } else {
        input.value = currentPage;
        showNotification(`Página deve estar entre 1 e ${totalPages}`, 'warning');
    }
}

// Atualizar URL com parâmetros da paginação (opcional, para bookmarking)
function updateURL() {
    const url = new URL(window.location);

    // Atualizar parâmetros
    if (currentFilters.category) {
        url.searchParams.set('category', currentFilters.category);
    } else {
        url.searchParams.delete('category');
    }

    if (currentFilters.search) {
        url.searchParams.set('search', currentFilters.search);
    } else {
        url.searchParams.delete('search');
    }

    if (currentPage > 1) {
        url.searchParams.set('page', currentPage.toString());
    } else {
        url.searchParams.delete('page');
    }

    // Atualizar URL sem recarregar a página
    window.history.replaceState({}, '', url);
}

// Atualizar informações dos produtos
function updateProductsInfo() {
    const productsCount = document.getElementById('productsCount');
    if (!productsCount) return;

    if (totalItems === 0) {
        productsCount.textContent = 'Nenhum produto encontrado';
    } else if (currentFilters.category || currentFilters.search) {
        const categoryText = currentFilters.category ? getCategoryName(currentFilters.category) : '';
        const searchText = currentFilters.search ? ` "${currentFilters.search}"` : '';
        productsCount.textContent = `${totalItems} produto${totalItems !== 1 ? 's' : ''} encontrado${totalItems !== 1 ? 's' : ''} ${categoryText}${searchText}`;
    } else {
        productsCount.textContent = `${totalItems} produto${totalItems !== 1 ? 's' : ''} disponíve${totalItems !== 1 ? 'is' : 'l'}`;
    }
}

// Mostrar loading na paginação
function showPageLoading() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.style.opacity = '0.5';
        productsGrid.style.pointerEvents = 'none';
    }
}

// Esconder loading na paginação
function hidePageLoading() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.style.opacity = '1';
        productsGrid.style.pointerEvents = 'auto';
    }
}

// Alterar quantidade de itens por página
function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage = parseInt(newItemsPerPage);
    currentPage = 1; // Resetar para primeira página

    renderCurrentPage();
    renderPagination();

    // Salvar preferência no localStorage
    localStorage.setItem('chefinho-items-per-page', itemsPerPage.toString());
}

// Tornar funções disponíveis globalmente
window.goToPage = goToPage;
window.jumpToPage = jumpToPage;
window.changeItemsPerPage = changeItemsPerPage;
window.addExampleProduct = addExampleProduct;
window.showCategoryStats = showCategoryStats;
window.getAllCategories = getAllCategories;