// Netlify Function para obter produtos do KV Store
export default async (request, context) => {
  try {
    // Importar o KV Store do Netlify
    const { get } = await import("@netlify/kv");
    
    // Ler dados dos produtos do KV Store
    const data = await get("products");
    
    // Se não existir dados, retornar estrutura padrão
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
    
    // Retornar dados ou padrão se vazio
    const responseData = data || defaultData;
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
    
  } catch (error) {
    console.error("Erro ao obter produtos:", error);
    
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor",
      products: [] 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};