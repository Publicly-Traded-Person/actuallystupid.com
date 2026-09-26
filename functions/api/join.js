// POST /api/join  — store an email in KV (binding: SIGNUPS).
// Accepts JSON {email, website} or a form post. `website` is a honeypot.
const RL_MAX = 5, RL_WINDOW_S = 600;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  const ct = request.headers.get("content-type") || "";
  const isForm = !ct.includes("application/json");
  let email = "", hp = "";
  try {
    if (isForm) { const d = await request.formData(); email = d.get("email") || ""; hp = d.get("website") || ""; }
    else { const j = await request.json(); email = j.email || ""; hp = j.website || ""; }
  } catch { return reply(isForm, { error: "Bad request." }, 400, request); }

  if (hp) return reply(isForm, { ok: true }, 200, request); // bot: pretend success

  email = String(email).trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return reply(isForm, { error: "That doesn't look like an email." }, 400, request);

  if (!env.SIGNUPS) return reply(isForm, { error: "Not configured." }, 500, request);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (ip) {
    const k = `rl:${ip}`, n = parseInt((await env.SIGNUPS.get(k)) || "0", 10) + 1;
    if (n > RL_MAX) return reply(isForm, { error: "Too many tries. Come back later." }, 429, request);
    await env.SIGNUPS.put(k, String(n), { expirationTtl: RL_WINDOW_S });
  }

  const key = `email:${email}`;
  if (!(await env.SIGNUPS.get(key))) {
    await env.SIGNUPS.put(key, JSON.stringify({
      email, ts: new Date().toISOString(),
      ref: request.headers.get("referer") || "",
      country: request.cf?.country || "",
    }));
  }
  return reply(isForm, { ok: true }, 200, request);
}

function reply(isForm, body, status, request) {
  if (isForm) {
    if (status < 400) return Response.redirect(new URL("/thanks.html", request.url), 303);
    return new Response(body.error, { status, headers: { "content-type": "text/plain" } });
  }
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
