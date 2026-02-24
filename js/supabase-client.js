// Configurações públicas (seguro expor - são chaves anônimas/públicas)
const SUPABASE_URL = 'https://kirrtgqquxujcjeebqgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8RXpynIaSeZFMoJXqWvfuw_ZxJaoC9i';

const IMAGEKIT_CONFIG = {
    publicKey: 'public_RFHx5SA7xB0qBre+v5ntPZg4Jew=',
    urlEndpoint: 'https://ik.imagekit.io/chefinho',
    uploadEndpoint: 'https://upload.imagekit.io/api/v1/files/upload',
    authEndpoint: '/api/imagekit-auth' // Endpoint seguro para auth
};

class ImageKitUploader {     
    constructor(config) {
        this.publicKey = config.publicKey;
        this.urlEndpoint = config.urlEndpoint;
        this.uploadEndpoint = config.uploadEndpoint;
        this.authEndpoint = config.authEndpoint;
    }
    
    async uploadImage(file, folder = 'produtos') {
        try {
            console.log('📤 [ImageKit] Iniciando upload:', file.name);
            
            console.log('🔐 [ImageKit] Solicitando credenciais...');
            const authResponse = await fetch(this.authEndpoint, {
                method: 'POST'
            });
            
            if (!authResponse.ok) {
                throw new Error('Falha ao obter credenciais de upload');
            }
            
            const { token, expire, signature } = await authResponse.json();
            console.log('✅ [ImageKit] Credenciais obtidas');
            
            // 2. Preparar upload com credenciais temporárias
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', `${folder}_${Date.now()}_${file.name}`);
            formData.append('publicKey', this.publicKey);
            formData.append('folder', `/${folder}`);
            formData.append('token', token);
            formData.append('expire', expire);
            formData.append('signature', signature);
            
            console.log('📤 [ImageKit] Enviando arquivo...');
            
            // 3. Fazer upload
            const response = await fetch(this.uploadEndpoint, {
                method: 'POST',
                body: formData
            });
            
            console.log('📡 [ImageKit] Status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ [ImageKit] Erro:', errorData);
                throw new Error(`Upload falhou: ${response.status} - ${errorData}`);
            }
            
            const result = await response.json();
            console.log('✅ [ImageKit] Upload completo!');
            console.log('🖼️ [ImageKit] URL:', result.url);
            
            return result.url;
        } catch (error) {
            console.error('❌ [ImageKit] Erro no upload:', error.message);
            alert('ERRO NO UPLOAD IMAGEKIT:\n\n' + error.message);
            throw error;
        }
    }

    // Extrair timestamp da imagen URL do ImageKit
    extractTimestampFromUrl(imageUrl) {
        if (!imageUrl || !imageUrl.includes('produtos_')) return null;
        
        // Padrão: produtos_1771727827420_hash.jpg
        const match = imageUrl.match(/produtos_([0-9]+)_/);
        return match ? match[1] : null;
    }
    
    // Construir URL da imagem baseada no timestamp
    buildImageUrlFromTimestamp(timestamp, fallbackUrl = '') {
        if (!timestamp) return fallbackUrl;
        
        // Se o timestamp parece ser um ID do Supabase (muito alto), usar fallback
        if (timestamp.length < 13) return fallbackUrl;
        
        // Construir URL padrão do ImageKit baseada no timestamp
        // Note: Não podemos saber o hash exato, mas podemos tentar o padrão
        return `${this.urlEndpoint}/produtos/produtos_${timestamp}_*.jpg`;
    }

    // Gerar URL otimizada do ImageKit a partir de URL existente
    getOptimizedUrl(originalUrl, options = {}) {
        if (!originalUrl) return '';
        
        const { width, height, quality = 80 } = options;
        
        // Se já é uma URL do ImageKit, retornar
        if (originalUrl.includes('ik.imagekit.io')) {
            return originalUrl;
        }
        
        // Construir transformações
        let transforms = [];
        if (width) transforms.push(`w-${width}`);
        if (height) transforms.push(`h-${height}`);
        transforms.push(`q-${quality}`);
        transforms.push('f-webp'); // Formato otimizado
        
        const transformStr = transforms.join(',');
        
        // Usar URL fetch do ImageKit para otimizar imagens externas
        const encodedUrl = encodeURIComponent(originalUrl);
        return `${this.urlEndpoint}/tr:${transformStr}/${encodedUrl}`;
    }

    getThumbnail(url, size = 200) {
        return this.getOptimizedUrl(url, { width: size, height: size, quality: 70 });
    }

    getProductCard(url) {
        return this.getOptimizedUrl(url, { width: 400, height: 300, quality: 80 });
    }

    // Gerar imagem full size otimizada
    getFullSize(url) {
        return this.getOptimizedUrl(url, { width: 1200, quality: 85 });
    }
}

// Instância global do ImageKit
const imageKit = new ImageKitUploader(IMAGEKIT_CONFIG);

// Classe do Cliente Supabase (sem dependências externas)
class ChefinhoSupabase {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.adminToken = localStorage.getItem('admin_token'); // Token Supabase (admin_users)
        this.apiToken = localStorage.getItem('admin_api_token'); // Token para /api/admin/*
    }

    getHeaders(includeAuth = false) {
        const headers = {
            'apikey': this.key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };

        if (includeAuth && this.adminToken) {
            headers['x-admin-token'] = this.adminToken;
        }

        return headers;
    }

    async getSiteData() {
        try {
            const response = await fetch(`${this.url}/rest/v1/rpc/get_site_data`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar dados do site:', error);
            throw error;
        }
    }

    // Buscar produtos ativos
    async getProducts() {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/products?is_active=eq.true&order=created_at.desc`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            throw error;
        }
    }

    // Buscar produto por ID (Supabase ID ou Timestamp da imagem)
    async getProductById(id) {
        try {
            // Primeira tentativa: buscar por ID do Supabase
            let response = await fetch(
                `${this.url}/rest/v1/products?id=eq.${id}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            let products = await response.json();
            
            // Se encontrou pelo ID do Supabase, retorna
            if (products && products.length > 0) {
                console.log('🔍 Produto encontrado por ID Supabase:', id);
                return products[0];
            }
            
            // Segunda tentativa: buscar por timestamp na image_url
            console.log('🔄 Tentando buscar por timestamp da imagem:', id);
            response = await fetch(
                `${this.url}/rest/v1/products?image_url=like.*${id}*`,
                { headers: this.getHeaders() }
            );
            
            if (!response.ok) {
                throw new Error(`Erro HTTP na busca por timestamp: ${response.status}`);
            }
            
            products = await response.json();
            
            if (products && products.length > 0) {
                console.log('✅ Produto encontrado por timestamp da imagem:', id);
                return products[0];
            }
            
            console.log('❌ Produto não encontrado com ID/timestamp:', id);
            return null;
            
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            throw error;
        }
    }

    // Buscar categorias
    async getCategories() {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/categories?is_active=eq.true&order=sort_order`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            throw error;
        }
    }

    // Buscar configurações do site
    async getSiteConfig() {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/site_config`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const configs = await response.json();
            // Converter array para objeto
            const configObj = {};
            configs.forEach(c => {
                configObj[c.key] = c.value;
            });
            return configObj;
        } catch (error) {
            console.error('Erro ao buscar config:', error);
            throw error;
        }
    }

    // =====================================================
    // MÉTODOS DE ADMIN (com autenticação)
    // =====================================================

    // Login do admin
    async adminLogin(username, password) {
        try {
            // Usar função do banco para validar
            const response = await fetch(`${this.url}/rest/v1/rpc/validate_admin_login_simple`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    p_username: username,
                    p_password: password
                })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result && result.length > 0 && result[0].success) {
                this.adminToken = result[0].token;
                localStorage.setItem('admin_token', this.adminToken);
                
                // Solicitar ADMIN_API_TOKEN se não existir
                if (!this.apiToken) {
                    const apiToken = prompt(
                        '🔐 Digite o ADMIN_API_TOKEN:\n\n' +
                        'Este token protege operações no servidor.\n' +
                        'Você deve ter recebido este token do administrador.'
                    );
                    
                    if (apiToken && apiToken.trim()) {
                        this.setApiToken(apiToken.trim());
                    } else {
                        console.warn('⚠️ ADMIN_API_TOKEN não configurado - operações admin podem falhar');
                    }
                }
                
                return { success: true, token: this.adminToken };
            }

            return { 
                success: false, 
                error: result[0]?.message || 'Credenciais inválidas' 
            };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    // Validar token do admin
    async validateToken(token) {
        try {
            const response = await fetch(`${this.url}/rest/v1/rpc/validate_admin_token`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ p_token: token })
            });

            if (!response.ok) {
                return false;
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao validar token:', error);
            return false;
        }
    }

    // Logout
    logout() {
        this.adminToken = null;
        this.apiToken = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_api_token');
    }

    // Verificar se está logado
    isLoggedIn() {
        return !!this.adminToken;
    }

    // Definir token manualmente
    setToken(token) {
        this.adminToken = token;
        localStorage.setItem('admin_token', token);
    }
    
    // Definir API token
    setApiToken(token) {
        this.apiToken = token;
        localStorage.setItem('admin_api_token', token);
    }
    
    // Obter API token
    getApiToken() {
        return this.apiToken || localStorage.getItem('admin_api_token');
    }

    // =====================================================
    // CRUD de Produtos (Admin) - Via API Serverless
    // =====================================================

    // Buscar TODOS os produtos (incluindo inativos) - Admin
    async getAllProducts() {
        try {
            const apiToken = this.getApiToken();
            
            if (!apiToken) {
                throw new Error('ADMIN_API_TOKEN não configurado. Execute: supabase.setApiToken("seu_token")');
            }
            
            const response = await fetch('/api/admin/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Não autorizado - ADMIN_API_TOKEN inválido');
                }
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar todos produtos:', error);
            throw error;
        }
    }

    // Adicionar produto
    async addProduct(product) {
        try {
            const apiToken = this.getApiToken();
            
            if (!apiToken) {
                throw new Error('ADMIN_API_TOKEN não configurado');
            }
            
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Não autorizado - ADMIN_API_TOKEN inválido');
                }
                const error = await response.json();
                throw new Error(error.message || 'Erro ao adicionar produto');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
    }

    // Atualizar produto
    async updateProduct(id, updates) {
        try {
            const apiToken = this.getApiToken();
            
            if (!apiToken) {
                throw new Error('ADMIN_API_TOKEN não configurado');
            }
            
            const response = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, ...updates })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Não autorizado - ADMIN_API_TOKEN inválido');
                }
                const error = await response.json();
                throw new Error(error.message || 'Erro ao atualizar produto');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    // Deletar produto (soft delete - marca como inativo)
    async deleteProduct(id) {
        return this.updateProduct(id, { is_active: false });
    }

    // Deletar produto permanentemente
    async hardDeleteProduct(id) {
        try {
            const apiToken = this.getApiToken();
            
            if (!apiToken) {
                throw new Error('ADMIN_API_TOKEN não configurado');
            }
            
            const response = await fetch('/api/admin/products', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Não autorizado - ADMIN_API_TOKEN inválido');
                }
                throw new Error('Erro ao deletar produto');
            }

            return true;
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            throw error;
        }
    }

    // =====================================================
    // Reordenação de Produtos (Display Order)
    // =====================================================

    async updateProductDisplayOrder(productId, newOrder) {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/rpc/update_product_display_order`,
                {
                    method: 'POST',
                    headers: this.getHeaders(true),
                    body: JSON.stringify({ 
                        p_product_id: productId,
                        p_new_order: parseInt(newOrder)
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Erro ao atualizar ordem do produto');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            throw error;
        }
    }

    // =====================================================
    // Upload de Imagens (Supabase Storage)
    // =====================================================

    async uploadImage(file, folder = 'produtos') {
        console.log('🔄 [Supabase] Upload redirecionado para ImageKit.io');
        // Usar ImageKit.io ao invés de Supabase Storage
        return await imageKit.uploadImage(file, folder);
    }

    // Upload com preview via ImageKit
    async uploadImageWithOptimization(file, folder = 'produtos') {
        const url = await this.uploadImage(file, folder);
        return {
            original: url,
            thumbnail: imageKit.getThumbnail(url),
            card: imageKit.getProductCard(url),
            full: imageKit.getFullSize(url)
        };
    }
}

// =====================================================
// Instância global do cliente Supabase
// =====================================================

const supabase = new ChefinhoSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// Funções auxiliares globais
// =====================================================

// Otimizar URL de imagem via ImageKit
function optimizeImage(url, options) {
    return imageKit.getOptimizedUrl(url, options);
}

// Obter thumbnail de produto
function getProductThumbnail(url) {
    return imageKit.getThumbnail(url);
}

// Obter imagem de card
function getProductCardImage(url) {
    return imageKit.getProductCard(url);
}
