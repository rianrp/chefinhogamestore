// Vercel Serverless Function - Admin Products CRUD
// Usa SERVICE_ROLE para bypass de RLS
import { createClient } from '@supabase/supabase-js';

// Validar autenticação admin
function validateAuth(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_API_TOKEN;
  
  if (!adminToken) {
    console.error('❌ ADMIN_API_TOKEN não configurado');
    return false;
  }
  
  return token === adminToken;
}

// Inicializar Supabase com SERVICE_ROLE (bypass RLS)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Credenciais Supabase não configuradas');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export default async function handler(req, res) {
  // Validar autenticação
  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { method } = req;

    // GET - Listar todos os produtos (incluindo inativos)
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // POST - Criar novo produto
    if (method === 'POST') {
      const productData = req.body;
      
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH - Atualizar produto existente
    if (method === 'PATCH') {
      const { id, ...updates } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID obrigatório' });
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE - Remover produto (hard delete)
    if (method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID obrigatório' });
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Produto removido' });
    }

    // Método não suportado
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Erro no CRUD de produtos:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
