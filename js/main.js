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

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado, iniciando aplicação...');
    await loadSiteData();
    updateCartCount();
    initializeEventListeners();
    
    // Aguardar um pouco para garantir que todos os dados estejam carregados
    setTimeout(() => {
        // Executar handler da página atual após carregar os dados
        let page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        
        // Se a URL é /produto/algo, considerar como página 'produto'
        if (window.location.pathname.startsWith('/produto/')) {
            page = 'produto';
        }
        
        console.log('Página atual:', page);
        console.log('Pathname completo:', window.location.pathname);
        
        if (PageHandlers[page]) {
            console.log('Executando handler para página:', page);
            PageHandlers[page]();
        } else {
            console.log('Handler não encontrado para página:', page);
        }
    }, 100);
});

// Carregar dados do site
async function loadSiteData() {
    try {
        console.log('Tentando carregar data.json...');
        const response = await fetch('/data.json');
        console.log('Resposta recebida:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        siteData = await response.json();
        console.log('Dados carregados com sucesso:', siteData);
        console.log('Número de produtos:', siteData.products?.length || 0);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Mostrar erro para o usuário
        showNotification('Erro ao carregar produtos. Recarregue a página.', 'warning');
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

// Criar slug amigável para URLs
function createProductSlug(productName) {
    const slug = productName.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-')      // Substitui espaços por hífens
        .replace(/-+/g, '-')       // Remove hífens duplos
        .trim();
    console.log(`🏭 createProductSlug: "${productName}" → "${slug}"`);
    return slug;
}

// Gerar URL de compartilhamento do produto
function generateShareableProductUrl(product) {
    if (!product) return '';
    
    const baseUrl = window.location.origin;
    const slug = createProductSlug(product.name);
    const productUrl = `${baseUrl}/produto/${slug}`;
    
    return productUrl;
}

// Compartilhar produto específico
function shareProduct(product, platform = 'whatsapp') {
    const productUrl = generateShareableProductUrl(product);
    const shareText = `Olha esse produto incrível: ${product.name} por R$ ${product.rl_price.toFixed(2)}! 🎮`;
    
    let shareUrl = '';
    
    switch (platform) {
        case 'whatsapp':
            const whatsappNumber = siteData?.site?.whatsapp || '556993450986';
            const message = `${shareText}\n\nVeja mais detalhes: ${productUrl}`;
            shareUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
            break;
            
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
            break;
            
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
            break;
            
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
            break;
            
        case 'copy':
            navigator.clipboard.writeText(productUrl).then(() => {
                showNotification('Link copiado para a área de transferência!', 'success');
            });
            return;
            
        default:
            shareUrl = productUrl;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank');
        showNotification(`Compartilhando via ${platform}...`, 'info');
    }
}

// Obter nome da categoria
function getCategoryName(categoryId) {
    if (!siteData.categories) return categoryId;
    const category = siteData.categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
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

// Função auxiliar para obter URL da imagem do produto
function getImageUrl(product) {
    console.log('🖼️ getImageUrl chamado para:', product.name);
    console.log('   - image_url:', product.image_url);
    console.log('   - video_url:', product.video_url);
    
    // Se tem image_url válida, usar ela
    if (product.image_url && product.image_url.trim() !== '') {
        console.log('   ✅ Usando image_url:', product.image_url);
        return product.image_url;
    }
    
    // Se não tem imagem, usar uma imagem padrão que sabemos que funciona
    // Vamos usar uma das imagens do Supabase que já existem
    const defaultImage = 'https://znsfsumrrhjewbteiztr.supabase.co/storage/v1/object/public/contas/contas/boss-jewel.jpg';
    console.log('   🔄 Usando imagem padrão:', defaultImage);
    return defaultImage;
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
    
    container.innerHTML = products.map(product => `
        <div class="card product-card">
            <img src="${getImageUrl(product)}" alt="${product.name}" class="product-image" 
                 onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '${product.video_url || ''}')"
                 title="Clique para ver em tela cheia"
                 onerror="this.src='https://via.placeholder.com/300x250/8B5CF6/ffffff?text=Erro+ao+Carregar'">
            <div class="card-body">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-prices">
                    ${product.rl_price > 0 ? `<span class="price price-main">R$ ${product.rl_price.toFixed(2)}</span>` : ''}
                    ${product.parcelado_price > 0 ? `<span class="price price-parcelado">Parcelado: R$ ${product.parcelado_price.toFixed(2)}</span>` : ''}
                    <span class="price price-kks-secondary">${product.kks_price.toFixed(0)} KKs</span>
                </div>
                ${product.description ? `<p class="product-description">${product.description.substring(0, 100)}...</p>` : ''}
            </div>
            <div class="card-footer">
                <div class="product-actions d-flex gap-2">
                    <button class="btn btn-primary btn-round flex-1" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Adicionar
                    </button>
                    <a href="produto/${createProductSlug(product.name)}" class="btn btn-outline btn-round">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar categorias
function renderCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !siteData.categories) {
        console.log('Container ou categorias não encontradas:', containerId, !!siteData.categories);
        return;
    }
    
    console.log('Renderizando categorias:', siteData.categories.length);
    
    container.innerHTML = siteData.categories.map(category => `
        <a href="produtos.html?category=${category.id}" class="card category-card">
            <div class="category-icon">
                <i class="${category.icon}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description}</p>
        </a>
    `).join('');
}

// Inicializar event listeners
function initializeEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const filteredProducts = filterProducts(category, searchTerm);
            renderProducts(filteredProducts, 'productsGrid');
        });
    }
    
    // Filtro de categoria
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const category = this.value;
            const searchTerm = document.getElementById('searchInput')?.value || '';
            const filteredProducts = filterProducts(category, searchTerm);
            renderProducts(filteredProducts, 'productsGrid');
        });
    }
    
    // Botões de visualização (grid/lista)
    const viewButtons = document.querySelectorAll('.view-btn');
    console.log('Configurando event listeners para botões de visualização. Botões encontrados:', viewButtons.length);
    viewButtons.forEach(btn => {
        console.log('Configurando botão:', btn.dataset.view);
        btn.addEventListener('click', function() {
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

// Alternar entre visualização grid e lista
function toggleView(viewType) {
    console.log('toggleView chamado com tipo:', viewType);
    const container = document.getElementById('productsGrid');
    if (!container) {
        console.error('Container productsGrid não encontrado');
        return;
    }
    
    console.log('Container encontrado:', container);
    
    // Remover classes de visualização existentes
    container.classList.remove('products-grid', 'products-list');
    
    if (viewType === 'list') {
        console.log('Mudando para modo lista');
        container.classList.add('products-list');
        // Re-renderizar produtos no modo lista
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const filteredProducts = filterProducts(category, searchTerm);
        console.log('Produtos filtrados para lista:', filteredProducts.length);
        renderProductsList(filteredProducts, 'productsGrid');
    } else {
        console.log('Mudando para modo grid');
        container.classList.add('products-grid');
        // Re-renderizar produtos no modo grid
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const filteredProducts = filterProducts(category, searchTerm);
        console.log('Produtos filtrados para grid:', filteredProducts.length);
        renderProducts(filteredProducts, 'productsGrid');
    }
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
    container.innerHTML = products.map(product => `
        <div class="card product-card-list">
            <div class="product-list-content">
                <img src="${getImageUrl(product)}" alt="${product.name}" class="product-image-list" 
                     onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '${product.video_url || ''}')"
                     title="Clique para ver em tela cheia"
                     onerror="this.src='https://via.placeholder.com/120x120/8B5CF6/ffffff?text=Erro+ao+Carregar'">
                <div class="product-info-list">
                    <h3 class="product-name">${product.name}</h3>
                    ${product.description ? `<p class="product-description-list">${product.description.substring(0, 150)}...</p>` : ''}
                    <div class="product-meta-list">
                        <span class="product-category">${getCategoryName(product.category)}</span>
                        <span class="product-availability">Disponível: ${product.quantity}</span>
                    </div>
                </div>
                <div class="product-prices-list">
                    ${product.rl_price > 0 ? `<span class="price price-main">R$ ${product.rl_price.toFixed(2)}</span>` : ''}
                    ${product.parcelado_price > 0 ? `<span class="price price-parcelado">Parcelado: R$ ${product.parcelado_price.toFixed(2)}</span>` : ''}
                    <span class="price price-kks-secondary">${product.kks_price.toFixed(0)} KKs</span>
                </div>
                <div class="product-actions-list">
                    <button class="btn btn-primary btn-round" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Adicionar
                    </button>
                    <a href="produto/${createProductSlug(product.name)}" class="btn btn-outline btn-round">
                        <i class="fas fa-eye"></i>
                        Ver
                    </a>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('HTML gerado e inserido no container');
}

// Funções para páginas específicas
const PageHandlers = {
    // Página inicial
    index: function() {
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
                        <span class="stat-number">${siteData.stats.products}</span>
                        <span class="stat-label">Produtos</span>
                    </div>
                    <div class="stat-item fade-in-up">
                        <span class="stat-number">${siteData.stats.users}</span>
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
    
    // Página de produtos
    produtos: function() {
        console.log('Executando handler da página produtos');
        console.log('siteData disponível:', !!siteData);
        console.log('Categorias disponíveis:', !!siteData.categories);
        console.log('Produtos disponíveis:', !!siteData.products);
        console.log('Número de produtos:', siteData.products?.length || 0);
        
        // Aguardar os dados serem carregados
        if (!siteData.categories || !siteData.products) {
            console.log('Dados ainda não carregados, aguardando...');
            setTimeout(() => this.produtos(), 200);
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const searchTerm = urlParams.get('search') || '';
        
        console.log('Categoria:', category, 'Busca:', searchTerm);
        
        // Configurar filtros
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
        
        // Renderizar produtos filtrados
        const filteredProducts = filterProducts(category, searchTerm);
        console.log('Produtos filtrados:', filteredProducts.length);
        console.log('Primeiros 3 produtos:', filteredProducts.slice(0, 3));
        renderProducts(filteredProducts, 'productsGrid');
        
        // Preencher select de categorias
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && siteData.categories) {
            categoryFilter.innerHTML = `
                <option value="">Todas as categorias</option>
                ${siteData.categories.map(cat => 
                    `<option value="${cat.id}" ${cat.id === category ? 'selected' : ''}>${cat.name}</option>`
                ).join('')}
            `;
        }
    },
    
    // Página de produto individual
    produto: function() {
        console.log('Executando handler da página produto');
        
        // Aguardar os dados serem carregados
        if (!siteData.products) {
            console.log('Dados ainda não carregados, aguardando...');
            setTimeout(() => this.produto(), 100);
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        let productId = urlParams.get('id');
        let productSlug = urlParams.get('img') || urlParams.get('slug');
        
        // Tentar extrair slug da URL se não há parâmetros
        if (!productId && !productSlug) {
            const pathMatch = window.location.pathname.match(/\/produto\/(.+)/);
            if (pathMatch) {
                productSlug = pathMatch[1];
            }
        }
        
        console.log('ID do produto:', productId);
        console.log('Slug do produto:', productSlug);
        
        if (!productId && !productSlug) {
            console.log('Produto não encontrado na URL');
            window.location.href = '/produtos.html';
            return;
        }
        
        // Buscar produto por ID ou slug
        let product;
        if (productId) {
            product = siteData.products?.find(p => p.id === productId || p.id === parseInt(productId));
        } else if (productSlug) {
            product = siteData.products?.find(p => {
                const slug = createProductSlug(p.name);
                return slug === productSlug;
            });
        }
        
        if (!product) {
            console.log('Produto não encontrado:', productId || productSlug);
            window.location.href = 'produtos.html';
            return;
        }
        
        console.log('Produto encontrado:', product.name);
        
        // Meta tags são atualizadas automaticamente pela Edge Function no servidor
        // Não é necessário JavaScript para isso
        
        // Renderizar detalhes do produto
        const container = document.getElementById('productDetails');
        if (container) {
            container.innerHTML = `
                <div class="product-detail-grid">
                    <div class="product-image-container">
                        ${product.video_url ? `
                            <div class="product-media-tabs">
                                <div class="media-tab-buttons">
                                    <button class="media-tab-btn active" onclick="showMedia('image-${product.id}')">
                                        <i class="fas fa-image"></i> Imagem
                                    </button>
                                    <button class="media-tab-btn" onclick="showMedia('video-${product.id}')">
                                        <i class="fas fa-play"></i> Vídeo
                                    </button>
                                </div>
                                <div class="media-content">
                                    <div id="image-${product.id}" class="media-item active">
                                        <img src="${getImageUrl(product)}" alt="${product.name}" class="product-detail-image"
                                             onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '${product.video_url || ''}')"
                                             title="Clique para ver em tela cheia"
                                             onerror="this.src='https://via.placeholder.com/500x400/8B5CF6/ffffff?text=Erro+ao+Carregar'">
                                    </div>
                                    <div id="video-${product.id}" class="media-item">
                                        <video class="product-detail-video" controls preload="metadata">
                                            <source src="${product.video_url}" type="video/mp4">
                                            Seu navegador não suporta vídeo.
                                        </video>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <img src="${getImageUrl(product)}" alt="${product.name}" class="product-detail-image"
                                 onclick="openImageModal('${getImageUrl(product)}', '${product.name.replace(/'/g, "\\'")}', '${(product.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', '${product.video_url || ''}')"
                                 title="Clique para ver em tela cheia"
                                 onerror="this.src='https://via.placeholder.com/500x400/8B5CF6/ffffff?text=Erro+ao+Carregar'">
                        `}
                    </div>
                    <div class="product-info">
                        <h1 class="product-title">${product.name}</h1>
                        <div class="product-prices mb-4">
                            ${product.rl_price > 0 ? `<span class="price price-main">R$ ${product.rl_price.toFixed(2)}</span>` : ''}
                            ${product.parcelado_price > 0 ? `<span class="price price-parcelado">Parcelado: R$ ${product.parcelado_price.toFixed(2)}</span>` : ''}
                            <span class="price price-kks-secondary">${product.kks_price.toFixed(0)} KKs</span>
                        </div>
                        ${product.description ? `<div class="product-description mb-4"><p>${product.description}</p></div>` : ''}
                        <div class="product-meta mb-4">
                            <p><strong>Categoria:</strong> ${getCategoryName(product.category)}</p>
                            <p><strong>Disponível:</strong> ${product.quantity} unidade(s)</p>
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
    carrinho: function() {
        renderCart();
    },
    
    // Página Rucoy KKs
    rucoy: function() {
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
        decreaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updateTotals();
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue < 999) {
                quantityInput.value = currentValue + 1;
                updateTotals();
            }
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
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
        buyNowBtn.addEventListener('click', function() {
            const formData = validateForm();
            if (formData) {
                buyRucoyKKsNow(formData.quantity, formData.characterName);
            }
        });
    }
    
    // Event listener para adicionar ao carrinho
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
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
    
    // Ativar o botão correspondente
    const isVideo = mediaId.includes('video');
    const btnIndex = isVideo ? 1 : 0;
    const buttons = document.querySelectorAll('.media-tab-btn');
    if (buttons[btnIndex]) {
        buttons[btnIndex].classList.add('active');
    }
    
    // Pausar vídeo se trocar para imagem
    if (!isVideo) {
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
document.addEventListener('DOMContentLoaded', function() {
    // Fechar modal clicando no fundo
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});

// Executar handler da página atual (removido - agora executado no DOMContentLoaded)
// window.addEventListener('load', function() {
//     const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
//     if (PageHandlers[page]) {
//         PageHandlers[page]();
//     }
// });