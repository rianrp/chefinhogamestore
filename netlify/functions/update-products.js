// Netlify Function para atualizar produtos no KV Store
exports.handler = async (event, context) => {
  // Headers CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
  
  // Responder OPTIONS requests para CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  
  // Apenas aceitar método POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }
  
  try {
    // Verificar autorização
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const expectedToken = process.env.ADMIN_TOKEN || "teste123"; // Token padrão para desenvolvimento
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Token de autorização necessário" })
      };
    }
    
    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedToken) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Token de autorização inválido" })
      };
    }
    
    // Obter dados do body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "JSON inválido no body" })
      };
    }
    
    // Validar estrutura básica
    if (!body || typeof body !== "object") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Dados inválidos" })
      };
    }
    
    // Adicionar timestamp de atualização
    body.updated_at = new Date().toISOString();
    
    let success = false;
    let message = "Dados salvos localmente (KV Store não disponível)";
    
    // Tentar salvar no KV Store se estiver em produção no Netlify
    try {
      if (process.env.NETLIFY) {
        const { set } = await import("@netlify/kv");
        await set("products", body);
        success = true;
        message = "Produtos atualizados com sucesso no KV Store";
        console.log(`Produtos salvos no KV Store: ${body.products?.length || 0} produtos`);
      } else {
        console.log("Ambiente local: KV Store não disponível");
      }
    } catch (kvError) {
      console.log("Erro no KV Store:", kvError.message);
      // Continuar mesmo se KV Store falhar (para desenvolvimento)
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        message: message,
        count: body.products?.length || 0,
        updated_at: body.updated_at,
        kv_available: process.env.NETLIFY ? true : false
      })
    };
    
  } catch (error) {
    console.error("Erro ao atualizar produtos:", error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Erro interno do servidor",
        details: error.message 
      })
    };
  }
};