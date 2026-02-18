// netlify/functions/update-products.js
import { getStore } from "@netlify/blobs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "teste123";

export default async (req, ctx) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Token de autorização inválido" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object" || !Array.isArray(body.products)) {
      return new Response(
        JSON.stringify({ error: "Estrutura de dados inválida" }),
        { status: 400, headers: corsHeaders }
      );
    }

    body.updated_at = new Date().toISOString();

    const store = getStore("chefinho-store");
    await store.setJSON("products", body);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Produtos atualizados com sucesso",
        count: body.products.length,
        updated_at: body.updated_at,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("update-products error:", err);
    return new Response(
      JSON.stringify({
        error: "Erro interno ao atualizar produtos",
        details: err.message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
