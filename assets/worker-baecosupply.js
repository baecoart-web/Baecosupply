// Cloudflare Worker — baecosupply.ro
// Settings → Variables → adaugă ca secrets:
//   AIRTABLE_API_KEY  = tokenul tău Airtable (nou, după revocare)
//   AIRTABLE_BASE_ID  = appAWjfyfS74zwnOd
//   RESEND_API_KEY    = tokenul tău Resend
//   ADMIN_EMAIL       = email-ul tău pentru notificări

const TABLE_CERERI = "Cereri";
const TABLE_FIRME  = "Firme";
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/cereri") return handleCereri(request, env);
    if (pathname === "/firme")  return handleFirme(request, env);

    return json({ error: "Endpoint necunoscut. Folosește /cereri sau /firme." }, 404);
  },
};

// ══════════════════════════════════════════
//  /cereri — Cereri clienți
// ══════════════════════════════════════════
async function handleCereri(request, env) {
  try {
    const body = await request.json();
    const { tip, ce_cauta, judet, localitate, telefon, descriere } = body;

    if (!tip || !telefon) {
      return json({ error: "Câmpurile 'tip' și 'telefon' sunt obligatorii." }, 400);
    }

    const azi = new Date().toISOString().split("T")[0];

    // — Salvare Airtable: tabela Cereri —
    const atRes = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE_CERERI}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            tip:        tip,
            ce_cauta:   ce_cauta  || "",
            judet:      judet     || "",
            localitate: localitate || "",
            telefon:    telefon,
            descriere:  descriere || "",
            status:     "pending",
            data:       azi,
          },
        }),
      }
    );

    if (!atRes.ok) {
      const err = await atRes.text();
      return json({ error: "Eroare Airtable (Cereri).", detalii: err }, 500);
    }

    // — Email notificare admin —
    if (env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@baecosupply.ro",
          to:   [env.ADMIN_EMAIL || "contact@baecosupply.ro"],
          subject: `[BaecoSupply] Cerere nouă: ${tip}`,
          html: `
            <h2>Cerere nouă pe baecosupply.ro</h2>
            <table cellpadding="6" style="font-family:sans-serif;font-size:14px">
              <tr><td><b>Tip</b></td><td>${tip}</td></tr>
              <tr><td><b>Ce caută</b></td><td>${ce_cauta || "-"}</td></tr>
              <tr><td><b>Județ</b></td><td>${judet || "-"}</td></tr>
              <tr><td><b>Localitate</b></td><td>${localitate || "-"}</td></tr>
              <tr><td><b>Telefon</b></td><td>${telefon}</td></tr>
              <tr><td><b>Descriere</b></td><td>${descriere || "-"}</td></tr>
              <tr><td><b>Data</b></td><td>${azi}</td></tr>
            </table>
          `,
        }),
      }).catch(() => {});
    }

    return json({ success: true, mesaj: "Cererea a fost înregistrată cu succes!" });

  } catch (err) {
    return json({ error: "Eroare internă.", detalii: err.message }, 500);
  }
}

// ══════════════════════════════════════════
//  /firme — Înregistrare firmă via CUI + ANAF
// ══════════════════════════════════════════
async function handleFirme(request, env) {
  try {
    const body = await request.json();
    const { cui, telefon, email, nume_persoana, functie, pagina, sursa } = body;

    // Suportă și apelul din modalul de pe paginile de firmă
    // (fără CUI — doar contact)
    if (!cui && !telefon && !email) {
      return json({ error: "CUI sau date de contact obligatorii." }, 400);
    }

    const azi = new Date().toISOString().split("T")[0];
    let dateFirema = { cui: "", nume: "", adresa: "", judet: "", localitate: "", cod_caen: "", tva: "", activa: "" };

    // — Interogare ANAF (doar dacă s-a trimis CUI) —
    if (cui) {
      const cuiCurat = String(cui).replace(/\D/g, "");
      if (!cuiCurat || cuiCurat.length < 2 || cuiCurat.length > 10) {
        return json({ error: "CUI invalid." }, 400);
      }

      const anafRes = await fetch(
        "https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ cui: parseInt(cuiCurat), data: azi }]),
        }
      );

      if (!anafRes.ok) {
        return json({ error: "Eroare la interogarea ANAF. Încearcă din nou." }, 502);
      }

      const anafData = await anafRes.json();
      const firma = anafData?.found?.[0];

      if (!firma) {
        return json({ error: "CUI-ul nu a fost găsit în ANAF." }, 404);
      }

      const adresa = [
        firma.adresa_domeniu_strada,
        firma.adresa_domeniu_nrStrada ? `nr. ${firma.adresa_domeniu_nrStrada}` : null,
        firma.adresa_domeniu_localitate,
        firma.adresa_domeniu_judet,
      ].filter(Boolean).join(", ");

      dateFirema = {
        cui:       cuiCurat,
        nume:      firma.denumire || "",
        adresa:    adresa || "",
        judet:     firma.adresa_domeniu_judet || "",
        localitate: firma.adresa_domeniu_localitate || "",
        cod_caen:  firma.cod_caen || "",
        tva:       firma.scpTVA ? "Da" : "Nu",
        activa:    firma.statusInactivi === false ? "Da" : "Nu",
      };
    }

    // — Salvare Airtable: tabela Firme —
    const atRes = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${TABLE_FIRME}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            CUI:             dateFirema.cui,
            Nume:            dateFirema.nume,
            Adresa:          dateFirema.adresa,
            Judet:           dateFirema.judet,
            Localitate:      dateFirema.localitate,
            CodCAEN:         dateFirema.cod_caen,
            TVA:             dateFirema.tva,
            Activa:          dateFirema.activa,
            Telefon:         telefon  || "",
            Email:           email    || "",
            NumePersoana:    nume_persoana || "",
            Functie:         functie  || "",
            Pagina:          pagina   || "",
            Sursa:           sursa    || "formular",
            DataInregistrare: azi,
            Status:          "nou",
          },
        }),
      }
    );

    if (!atRes.ok) {
      const err = await atRes.text();
      return json({ error: "Eroare Airtable (Firme).", detalii: err }, 500);
    }

    // — Email confirmare către firmă —
    if (env.RESEND_API_KEY && email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@baecosupply.ro",
          to:   [email],
          subject: "Înregistrare confirmată — baecosupply.ro",
          html: `
            <h2>Bună ziua,</h2>
            <p>Firma <b>${dateFirema.nume || "dvs."}</b> a fost înregistrată pe baecosupply.ro.</p>
            ${dateFirema.adresa ? `<p><b>Adresă:</b> ${dateFirema.adresa}</p>` : ""}
            <p>Profilul va fi activ în 24h. Vă vom contacta la ${email}.</p>
            <br/><p>Echipa baecosupply.ro</p>
          `,
        }),
      }).catch(() => {});
    }

    return json({
      success: true,
      mesaj:   "Firma a fost înregistrată cu succes!",
      firma: {
        cui:    dateFirema.cui,
        nume:   dateFirema.nume,
        adresa: dateFirema.adresa,
        judet:  dateFirema.judet,
      },
    });

  } catch (err) {
    return json({ error: "Eroare internă.", detalii: err.message }, 500);
  }
}

// ══════════════════════════════════════════
//  Helper
// ══════════════════════════════════════════
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
