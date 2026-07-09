import type { APIRoute } from "astro";
import { buildPayload } from "../../lib/data";

// On-demand: se ejecuta en cada petición del navegador (polling cada 3s).
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const payload = await buildPayload();
    return new Response(JSON.stringify(payload), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "s-maxage=3, stale-while-revalidate=10",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
};
