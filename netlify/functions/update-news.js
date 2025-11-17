export default async (req) => {
  const { set } = await import("@netlify/kv");

  const body = await req.json();

  await set("news", body);

  return new Response("ok");
};
