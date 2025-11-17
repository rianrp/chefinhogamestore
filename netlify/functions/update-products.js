// netlify/functions/update-products.js
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    const expectedToken = process.env.ADMIN_TOKEN || "teste123";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Token de autorização necessário" }),
      };
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedToken) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Token de autorização inválido" }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "JSON inválido no body" }),
      };
    }

    if (!body || typeof body !== "object" || !Array.isArray(body.products)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Estrutura de dados inválida" }),
      };
    }

    body.updated_at = new Date().toISOString();

    const store = getStore("chefinho-store");
    await store.set("products", body);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: "Produtos atualizados com sucesso",
        count: body.products.length,
        updated_at: body.updated_at,
      }),
    };
  } catch (error) {
    console.error("Erro ao atualizar produtos:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Erro interno ao atualizar produtos",
        details: error.message,
      }),
    };
  }
};
