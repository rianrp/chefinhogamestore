// =====================================================
// Admin Token Helper - para uso no painel admin
// =====================================================

// O ADMIN_API_TOKEN deve ser armazenado de forma segura
// NUNCA commite o token no código!

class AdminAuth {
    constructor() {
        this.tokenKey = 'chefinho_admin_api_token';
    }

    // Salvar token no localStorage (apenas para desenvolvimento local)
    // Em produção, considere usar um método mais seguro
    setToken(token) {
        if (!token) {
            console.error('Token inválido');
            return false;
        }
        localStorage.setItem(this.tokenKey, token);
        return true;
    }

    // Obter token atual
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Remover token
    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    // Verificar se tem token
    hasToken() {
        return !!this.getToken();
    }

    // Obter header de autorização formatado
    getAuthHeader() {
        const token = this.getToken();
        return token ? `Bearer ${token}` : null;
    }

    // Solicitar token ao usuário (primeira vez)
    async promptForToken() {
        const token = prompt(
            '🔐 Digite o ADMIN_API_TOKEN:\n\n' +
            'Este token é necessário para operações administrativas.\n' +
            'Você deve ter recebido este token do administrador do sistema.'
        );

        if (token && token.trim()) {
            this.setToken(token.trim());
            return true;
        }

        return false;
    }

    // Validar se o token funciona (tenta fazer uma requisição)
    async validateToken() {
        const token = this.getToken();
        
        if (!token) {
            return false;
        }

        try {
            const response = await fetch('/api/admin/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Erro ao validar token:', error);
            return false;
        }
    }
}

// Instância global
const adminAuth = new AdminAuth();

// Auto-inicializar se não tiver token
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        // Verificar se estamos em uma página admin
        if (window.location.pathname.includes('/admin')) {
            if (!adminAuth.hasToken()) {
                console.log('⚠️ ADMIN_API_TOKEN não encontrado');
                console.log('💡 Use adminAuth.promptForToken() para configurar');
            } else {
                // Validar token existente
                const isValid = await adminAuth.validateToken();
                if (!isValid) {
                    console.warn('⚠️ Token inválido ou expirado');
                    adminAuth.clearToken();
                    console.log('💡 Token removido. Use adminAuth.promptForToken() para configurar novo token');
                } else {
                    console.log('✅ ADMIN_API_TOKEN válido');
                }
            }
        }
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.adminAuth = adminAuth;
}
