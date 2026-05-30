// Cloudflare Worker — baecosupply-firme
// Salvează contactele din modalul "Actualizare informații" în Airtable
//
// wrangler.toml:
//   AIRTABLE_API_KEY = "..."
//   AIRTABLE_BASE_ID = "appAWjfyfS74zwnOd"
//   RESEND_API_KEY = "..."   (opțional)

const AIRTABLE_TABLE = "Firme";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Body JSON invalid" }, 400);
    }

    const {
      nume_firma = "",
      nume_persoana = "",
      functie = "",
      telefon = "",
      email = "",
      pagina = "",
      sursa = "modal-actualizare",
    } = body;

    if (!telefon && !email) {
      return json({ error: "Telefon sau email obligatoriu." }, 400);
    }

    const azi = new Date().toISOString().split("T")[0];

    // ── Salvare Airtable ──
    const atRes = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            NumeFirma:     nume_firma,
            NumePersoana:  nume_persoana,
            Functie:       functie,
            Telefon:       telefon,
            Email:         email,
            Pagina:        pagina,
            Sursa:         sursa,
            Data:          azi,
            Status:        "nou",
          },
        }),
      }
    );

    if (!atRes.ok) {
      const err = await atRes.text();
      return json({ error: "Eroare Airtable", detalii: err }, 500);
    }

    // ── Email notificare admin (opțional) ──
    if (env.RESEND_API_KEY && env.ADMIN_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@baecosupply.ro",
          to: [env.ADMIN_EMAIL],
          subject: `[BaecoSupply] Firmă nouă: ${nume_firma}`,
          html: `
            <h3>Cerere actualizare profil</h3>
            <p><b>Firmă:</b> ${nume_firma}</p>
            <p><b>Persoană:</b> ${nume_persoana} (${functie})</p>
            <p><b>Telefon:</b> ${telefon}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Pagină:</b> <a href="${pagina}">${pagina}</a></p>
            <p><b>Data:</b> ${azi}</p>
          `,
        }),
      }).catch(() => {}); // nu bloca răspunsul dacă emailul pică
    }

    return json({ success: true, mesaj: "Salvat cu succes." });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
