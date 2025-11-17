// netlify/functions/get-products.js
const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // JSON padrão caso o Blobs ainda esteja vazio
  const defaultData = {
    site: {
      name: "Chefinho",
      tagline: "Gaming Store",
      description:
        "Sua loja gamer de confiança - Personagens, contas e itens para seus jogos favoritos com os melhores preços",
      whatsapp: "556993450986",
    },
    theme: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#A855F7",
        yellow: "#FCD34D",
        dark: "#0F0F23",
        darker: "#0A0A1A",
      },
      mode: "dark",
    },
    categories: [
      {
        id: "freefire",
        name: "Free Fire",
        description: "Skins, Personagens, Diamantes",
        icon: "fas fa-fire",
      },
      {
        id: "mage",
        name: "Rucoy Mage",
        description: "Personagens Mage, Items",
        icon: "fas fa-magic",
      },
      {
        id: "kina",
        name: "Rucoy Knight",
        description: "Personagens Knight, Items",
        icon: "fas fa-shield-alt",
      },
      {
        id: "pally",
        name: "Rucoy Paladin",
        description: "Personagens Paladin, Items",
        icon: "fas fa-crosshairs",
      },
      {
        id: "supercell",
        name: "Supercell Games",
        description: "Clash of Clans, Clash Royale",
        icon: "fas fa-crown",
      },
      {
        id: "itens",
        name: "Itens Diversos",
        description: "Items, Acessórios, Outros",
        icon: "fas fa-gem",
      },
      {
        id: "geral",
        name: "Geral",
        description: "Produtos Diversos",
        icon: "fas fa-gamepad",
      },
      {
        id: "roblox",
        name: "Roblox",
        description: "Contas e itens Roblox",
        icon: "fas fa-cube",
      },
    ],
    stats: {
      products: "2K+",
      users: "10K+",
      support: "24/7",
    },
    contact: {
      whatsapp: "+55 69 9345-0986",
      email: "contato@chefinho.com",
      hours: {
        weekdays: "Segunda à Sexta: 8h às 18h",
        saturday: "Sábado: 8h às 14h",
        sunday: "Domingo: Fechado",
      },
    },
    social: {
      instagram: "#",
      twitter: "#",
      youtube: "#",
      twitch: "#",
    },
    products: [],
  };

  try {
    const store = getStore("chefinho-store"); // nome qualquer, só manter igual nas duas functions
    const blobsData = await store.get("products", { type: "json" });

    const responseData = blobsData || defaultData;

    const debugInfo = {
      source: blobsData ? "blobs" : "default",
      productCount: responseData.products?.length || 0,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ...responseData,
        _debug: debugInfo,
      }),
    };
  } catch (error) {
    console.error("Erro ao ler do Blobs:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Erro interno ao obter produtos",
        message: error.message,
      }),
    };
  }
};
