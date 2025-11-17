// Netlify Function para atualizar produtos no KV Store
export default async (request, context) => {
  // Permitir CORS para todas as origens (para desenvolvimento)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  
  // Responder OPTIONS requests para CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  // Apenas aceitar método POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  
  try {
    // Verificar autorização
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.ADMIN_TOKEN || "teste123"; // Token padrão para desenvolvimento
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Token de autorização necessário" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedToken) {
      return new Response(JSON.stringify({ error: "Token de autorização inválido" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Obter dados do body
    const body = await request.json();
    
    // Validar estrutura básica
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Importar o KV Store do Netlify
    const { set } = await import("@netlify/kv");
    
    // Adicionar timestamp de atualização
    body.updated_at = new Date().toISOString();
    
    // Salvar no KV Store
    await set("products", body);
    
    console.log(`Produtos atualizados com sucesso. Total: ${body.products?.length || 0} produtos`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Produtos atualizados com sucesso",
      count: body.products?.length || 0,
      updated_at: body.updated_at
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error("Erro ao atualizar produtos:", error);
    
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor",
      details: error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};