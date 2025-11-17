// Netlify Function para obter produtos do KV Store
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

  try {
    // Estrutura padrão de dados
    const defaultData = {
      site: {
        name: "Chefinho",
        tagline: "Gaming Store", 
        description: "Sua loja gamer de confiança",
        whatsapp: "556993450986"
      },
      theme: {
        colors: {
          primary: "#8B5CF6",
          secondary: "#A855F7",
          yellow: "#FCD34D",
          dark: "#0F0F23",
          darker: "#0A0A1A"
        },
        mode: "dark"
      },
      categories: [
        { id: "freefire", name: "Free Fire", description: "Skins, Personagens, Diamantes", icon: "fas fa-fire" },
        { id: "mage", name: "Rucoy Mage", description: "Personagens Mage, Items", icon: "fas fa-magic" },
        { id: "kina", name: "Rucoy Knight", description: "Personagens Knight, Items", icon: "fas fa-shield-alt" },
        { id: "pally", name: "Rucoy Paladin", description: "Personagens Paladin, Items", icon: "fas fa-crosshairs" },
        { id: "supercell", name: "Supercell Games", description: "Clash of Clans, Clash Royale", icon: "fas fa-crown" },
        { id: "itens", name: "Itens Gerais", description: "Diversos itens para jogos", icon: "fas fa-gem" },
        { id: "geral", name: "Geral", description: "Diversos produtos", icon: "fas fa-gamepad" },
        { id: "roblox", name: "Roblox", description: "Contas e itens Roblox", icon: "fas fa-cube" }
      ],
      stats: {
        products: "2K+",
        users: "10K+", 
        support: "24/7"
      },
      contact: {
        whatsapp: "+55 69 9345-0986",
        email: "contato@chefinho.com",
        hours: {
          weekdays: "8h às 18h",
          saturday: "8h às 14h",
          sunday: "Fechado"
        }
      },
      social: {
        instagram: "#",
        twitter: "#",
        youtube: "#",
        twitch: "#"
      },
      products: []
    };

    let responseData = defaultData;

    // Tentar obter dados do KV Store (ambiente Netlify)
    try {
      console.log("🔍 Verificando KV Store...");
      
      // Importar KV Store
      const kv = await import("@netlify/kv");
      const kvData = await kv.get("products");
      
      if (kvData) {
        console.log("✅ Dados encontrados no KV Store!");
        console.log("Tipo:", typeof kvData);
        console.log("Produtos:", kvData.products?.length || 0);
        
        // Usar dados do KV Store
        responseData = kvData;
        console.log(`📦 Usando ${kvData.products?.length || 0} produtos do KV Store`);
      } else {
        console.log("📭 KV Store vazio - usando dados padrão");
      }
      
    } catch (kvError) {
      console.error("❌ Erro KV Store:", kvError.message);
      console.log("🔄 Fallback para dados padrão");
    }
    
    // Adicionar informações de debug na resposta
    const debugInfo = {
      source: responseData === defaultData ? "default" : "kv-store",
      productCount: responseData.products?.length || 0,
      timestamp: new Date().toISOString(),
      environment: process.env.NETLIFY ? "netlify" : "local"
    };
    
    console.log("📊 Enviando resposta:", debugInfo);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ...responseData,
        _debug: debugInfo
      })
    };
    
  } catch (error) {
    console.error("Erro ao obter produtos:", error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: "Erro interno do servidor",
        message: error.message,
        products: [] 
      })
    };
  }
};