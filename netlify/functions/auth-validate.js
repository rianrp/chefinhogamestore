// Netlify Function para validar token de autenticação
exports.handler = async (event, context) => {
  // Headers CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    // Obter token do header ou body
    let token = event.headers.authorization || event.headers.Authorization;
    
    if (token && token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    } else {
      // Tentar obter do body
      const body = JSON.parse(event.body || "{}");
      token = body.token;
    }

    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          valid: false, 
          error: "Token não fornecido" 
        })
      };
    }

    // Validar token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, timestamp, password] = decoded.split(':');
      
      const validPassword = process.env.AUTH_PASSWORD || "admin123";
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      // Verificar se token é válido e não expirou
      if (username === "admin" && password === validPassword && tokenAge < maxAge) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            valid: true, 
            username: username,
            expiresIn: maxAge - tokenAge
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ 
            valid: false, 
            error: "Token inválido ou expirado" 
          })
        };
      }
      
    } catch (decodeError) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          valid: false, 
          error: "Token malformado" 
        })
      };
    }

  } catch (error) {
    console.error("Erro na validação:", error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        valid: false, 
        error: "Erro interno do servidor" 
      })
    };
  }
};