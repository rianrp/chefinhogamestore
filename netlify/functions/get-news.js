export default async () => {
  const { get } = await import("@netlify/kv");

  const data = await get("news");

  return new Response(JSON.stringify(data || { items: [] }), {
    headers: { "Content-Type": "application/json" }
  });
};
