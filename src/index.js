export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    // CORS headers (allow all origins for testing)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // Handle preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // READ ONLY
    if (url.pathname === "/views") {
      const { results } = await env.DB
        .prepare("SELECT count FROM views WHERE slug = ?")
        .bind(slug)
        .all();

      return new Response(
        JSON.stringify({
          slug,
          views: results.length ? results[0].count : 0
        }),
        { headers: corsHeaders }
      );
    }

    // INCREMENT VIEW
    if (url.pathname === "/count") {
      const result = await env.DB
        .prepare(`
          INSERT INTO views (slug, count)
          VALUES (?, 1)
          ON CONFLICT(slug)
          DO UPDATE SET count = count + 1
          RETURNING count
        `)
        .bind(slug)
        .first();

      return new Response(
        JSON.stringify({
          slug,
          views: result.count
        }),
        { headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
