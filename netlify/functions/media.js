// netlify/functions/media.js
import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const url = new URL(req.url);
    // /.netlify/functions/media/<key>
    const key = decodeURIComponent(
      url.pathname.replace("/.netlify/functions/media/", "")
    );

    const store = getStore("chefinho-media");
    const { body, metadata } = await store.getWithMetadata(key);

    if (!body) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": metadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("media error:", err);
    return new Response("Erro", { status: 500 });
  }
};
