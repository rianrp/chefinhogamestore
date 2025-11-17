// netlify/functions/upload-media.js
import { getStore } from "@netlify/blobs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const ADMIN_PASSWORD = process.env.AUTH_PASSWORD || "teste123";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: corsHeaders }
    );
  }

  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Token necessário" }),
      { status: 401, headers: corsHeaders }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Token inválido" }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = formData.get("kind") || "image";

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "Arquivo não enviado" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const store = getStore("chefinho-media");
    const key = `${kind}/${Date.now()}-${file.name}`;

    await store.set(key, bytes, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    // URL pública que você vai usar no site
    const url = `/media/${encodeURIComponent(key)}`;

    return new Response(
      JSON.stringify({ success: true, key, url }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("upload-media error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar arquivo", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
};
