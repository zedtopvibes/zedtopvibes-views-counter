export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }

    // READ ONLY
    if (url.pathname === "/views") {
      const { results } = await env.DB
        .prepare("SELECT count FROM views WHERE slug = ?")
        .bind(slug)
        .all();

      return Response.json({
        slug,
        views: results.length ? results[0].count : 0
      });
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

      return Response.json({
        slug,
        views: result.count
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
