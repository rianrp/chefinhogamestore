// Netlify Function para autenticação do admin
exports.handler = async (event, context) => {
  // Headers CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    // Obter dados do body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          error: "JSON inválido" 
        })
      };
    }

    const { username, password } = body;

    // Validar dados
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          error: "Username e password são obrigatórios" 
        })
      };
    }

    // Verificar credenciais
    const validUsername = "admin";
    const validPassword = process.env.AUTH_PASSWORD || "admin123"; // fallback para desenvolvimento

    console.log("Tentativa de login:", { username, hasPassword: !!password });

    if (username === validUsername && password === validPassword) {
      // Gerar token simples (timestamp + hash básico)
      const timestamp = Date.now();
      const token = Buffer.from(`${username}:${timestamp}:${validPassword}`).toString('base64');

      console.log("Login bem-sucedido para:", username);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          token: token,
          message: "Login realizado com sucesso",
          expires: timestamp + (24 * 60 * 60 * 1000) // 24 horas
        })
      };
    } else {
      console.log("Login falhou - credenciais inválidas");
      
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          error: "Credenciais inválidas" 
        })
      };
    }

  } catch (error) {
    console.error("Erro na autenticação:", error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        error: "Erro interno do servidor" 
      })
    };
  }
};