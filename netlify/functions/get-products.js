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

    // Tentar obter dados do KV Store se estiver em produção no Netlify
    try {
      if (process.env.NETLIFY) {
        const { get } = await import("@netlify/kv");
        const kvData = await get("products");
        if (kvData && kvData.products) {
          responseData = kvData;
          console.log(`Dados carregados do KV Store: ${kvData.products.length} produtos`);
        }
      } else {
        console.log("Ambiente local detectado, usando dados padrão");
      }
    } catch (kvError) {
      console.log("KV Store não disponível, usando dados padrão:", kvError.message);
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseData)
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