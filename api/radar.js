async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        results: [],
        error: `HTTP ${response.status}`,
        raw: text
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        ok: false,
        results: [],
        error: "Réponse non JSON",
        raw: text
      };
    }
  } catch (error) {
    return { ok: false, results: [], error: error.message };
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("fr-FR");
}

function renderTable(title, rows, variant = "default") {
  const badgeClass =
    variant === "success" ? "badge success" : "badge warning";

  if (!rows.length) {
    return `
      <section class="card">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <span class="${badgeClass}">0</span>
        </div>
        <p class="empty">Aucun résultat dans cette section.</p>
      </section>
    `;
  }

  const body = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(formatDate(row.date))}</td>
        <td>${escapeHtml(row.source || "-")}</td>
        <td>${escapeHtml(row.segment || "-")}</td>
        <td>${escapeHtml(row.ville || (row.departements || []).join(", ") || "-")}</td>
        <td>${escapeHtml(row.porteur || row.acheteur || "-")}</td>
        <td>
          <div class="objet">${escapeHtml(row.objet || "-")}</div>
          <div class="subline">${escapeHtml(row.raison || "")}</div>
        </td>
        <td>${escapeHtml(row.type_source || row.type_marche || "-")}</td>
        <td>${escapeHtml(formatDate(row.date_limite))}</td>
        <td><strong>${escapeHtml(row.score ?? "-")}</strong></td>
        <td>${
          row.url
            ? `<a href="${escapeHtml(row.url)}" target="_blank" rel="noopener noreferrer">Consulter</a>`
            : "-"
        }</td>
      </tr>
    `
    )
    .join("");

  return `
    <section class="card">
      <div class="section-header">
        <h2>${escapeHtml(title)}</h2>
        <span class="${badgeClass}">${rows.length}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Segment</th>
              <th>Ville / Zone</th>
              <th>Porteur</th>
              <th>Objet / Analyse</th>
              <th>Type</th>
              <th>Date limite</th>
              <th>Score</th>
              <th>Lien</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSourceStatus(name, payload) {
  const ok = payload && payload.ok;
  return `
    <div class="summary-box">
      <div class="label">${escapeHtml(name)}</div>
      <div class="value" style="font-size:18px;">
        ${ok ? "OK" : "Erreur"}
      </div>
      ${
        !ok && payload?.error
          ? `<div class="small">${escapeHtml(payload.error)}</div>`
          : ""
      }
    </div>
  `;
}

export default async function handler(req, res) {
  try {
    const proto =
      req.headers["x-forwarded-proto"] ||
      req.headers["x-forwarded-protocol"] ||
      "https";

    const host =
      req.headers.host ||
      process.env.VERCEL_URL ||
      "stone-radar.vercel.app";

    const baseUrl = host.startsWith("http") ? host : `${proto}://${host}`;

    const [boamp, urbanisme, monaco] = await Promise.all([
      fetchJson(`${baseUrl}/api/boamp-daily`),
      fetchJson(`${baseUrl}/api/urbanisme-daily`),
      fetchJson(`${baseUrl}/api/monaco-daily`)
    ]);

    const allRows = [
      ...(Array.isArray(boamp.results) ? boamp.results : []),
      ...(Array.isArray(urbanisme.results) ? urbanisme.results : []),
      ...(Array.isArray(monaco.results) ? monaco.results : [])
    ];

    const prioritaires = allRows
      .filter((r) => r.verdict === "Pertinent")
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    const aSurveiller = allRows
      .filter((r) => r.verdict === "À vérifier")
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Radar Pierre / Luxe 06 83 Monaco</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 24px;
            background: #f6f7f9;
            color: #1f2937;
          }
          .container {
            max-width: 1500px;
            margin: 0 auto;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 30px;
          }
          .subtitle {
            margin: 0 0 24px 0;
            color: #6b7280;
          }
          .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          .summary-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px;
          }
          .summary-box .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .summary-box .value {
            font-size: 24px;
            font-weight: bold;
          }
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .section-header h2 {
            margin: 0;
            font-size: 22px;
          }
          .badge {
            display: inline-block;
            min-width: 32px;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
          }
          .success {
            background: #dcfce7;
            color: #166534;
          }
          .warning {
            background: #fef3c7;
            color: #92400e;
          }
          .table-wrap {
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          th, td {
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            vertical-align: top;
            padding: 10px 8px;
          }
          th {
            background: #f9fafb;
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
          }
          .objet {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .subline, .small {
            color: #6b7280;
            font-size: 12px;
          }
          .empty {
            color: #6b7280;
            margin: 0;
          }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          pre {
            white-space: pre-wrap;
            word-break: break-word;
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <section class="card">
            <h1>Radar Pierre / Luxe — 06 + 83 + Monaco</h1>
            <p class="subtitle">
              Hôtellerie, villas de luxe, promoteurs, urbanisme, appels d’offres,
              déclarations préalables, permis de construire.
            </p>

            <div class="summary-grid">
              <div class="summary-box">
                <div class="label">Zone</div>
                <div class="value">06 / 83 / Monaco</div>
              </div>
              <div class="summary-box">
                <div class="label">Sources</div>
                <div class="value">3</div>
              </div>
              <div class="summary-box">
                <div class="label">Prioritaires</div>
                <div class="value">${prioritaires.length}</div>
              </div>
              <div class="summary-box">
                <div class="label">À surveiller</div>
                <div class="value">${aSurveiller.length}</div>
              </div>
              <div class="summary-box">
                <div class="label">Total</div>
                <div class="value">${allRows.length}</div>
              </div>
            </div>

            <div class="summary-grid" style="margin-top:16px;">
              ${renderSourceStatus("BOAMP", boamp)}
              ${renderSourceStatus("URBANISME", urbanisme)}
              ${renderSourceStatus("MONACO", monaco)}
            </div>

            <p class="small" style="margin-top:16px;">
              Liens de consultation inclus dans chaque ligne.
            </p>
          </section>

          ${renderTable("Opportunités prioritaires", prioritaires, "success")}
          ${renderTable("À surveiller", aSurveiller, "warning")}
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    return res
      .status(500)
      .send(`<h1>Erreur radar</h1><pre>${escapeHtml(error.message)}</pre>`);
  }
}
