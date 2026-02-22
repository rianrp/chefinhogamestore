// =====================================================
// Chefinho Gaming Store - Cliente Supabase + ImageKit
// =====================================================

// Configuração do Supabase
const SUPABASE_URL = 'https://kirrtgqquxujcjeebqgr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8RXpynIaSeZFMoJXqWvfuw_ZxJaoC9i';

// =====================================================
// ImageKit.io - Upload de Imagens DIRETO
// =====================================================
const IMAGEKIT_CONFIG = {
    publicKey: 'public_RFHx5SA7xB0qBre+v5ntPZg4Jew=',
    privateKey: 'private_E3xQV5Eao948+1ADX0oYoibXaB0=', // ⚠️ EM PRODUÇÃO, MOVER PARA BACKEND!
    urlEndpoint: 'https://ik.imagekit.io/chefinho',
    uploadEndpoint: 'https://upload.imagekit.io/api/v1/files/upload'
};

// Classe para gerenciar uploads de imagem
class ImageKitUploader {
    constructor(config) {
        this.publicKey = config.publicKey;
        this.privateKey = config.privateKey;
        this.urlEndpoint = config.urlEndpoint;
        this.uploadEndpoint = config.uploadEndpoint;
    }
    
    // Upload DIRETO para ImageKit.io
    async uploadImage(file, folder = 'produtos') {
        try {
            console.log('📤 [ImageKit] Iniciando upload:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', `${folder}/${Date.now()}_${file.name}`);
            formData.append('publicKey', this.publicKey);
            formData.append('folder', `/${folder}`);
            
            // Autenticação básica com private key
            const auth = btoa(`${this.privateKey}:`);
            
            console.log('🔐 [ImageKit] Autenticando...');
            
            const response = await fetch(this.uploadEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`
                },
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

    // Gerar thumbnail
    getThumbnail(url, size = 200) {
        return this.getOptimizedUrl(url, { width: size, height: size, quality: 70 });
    }

    // Gerar imagem para card de produto
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
        this.adminToken = localStorage.getItem('admin_token');
    }

    // Headers padrão para requisições
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

    // =====================================================
    // MÉTODOS PÚBLICOS (sem autenticação)
    // =====================================================

    // Buscar todos os dados do site (usa função do banco)
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

    // Buscar produto por ID
    async getProductById(id) {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/products?id=eq.${id}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const products = await response.json();
            return products[0] || null;
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
        localStorage.removeItem('admin_token');
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

    // =====================================================
    // CRUD de Produtos (Admin)
    // =====================================================

    // Buscar TODOS os produtos (incluindo inativos) - Admin
    async getAllProducts() {
        try {
            const response = await fetch(
                `${this.url}/rest/v1/products?order=created_at.desc`,
                { headers: this.getHeaders(true) }
            );

            if (!response.ok) {
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
            const response = await fetch(`${this.url}/rest/v1/products`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(product)
            });

            if (!response.ok) {
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
            const response = await fetch(
                `${this.url}/rest/v1/products?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: this.getHeaders(true),
                    body: JSON.stringify(updates)
                }
            );

            if (!response.ok) {
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
            const response = await fetch(
                `${this.url}/rest/v1/products?id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders(true)
                }
            );

            if (!response.ok) {
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
