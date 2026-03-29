export default async function handler(req, res) {
  try {
    const urls = [
      "https://journaldemonaco.gouv.mc/",
      "https://journaldemonaco.gouv.mc/recherche",
      "https://journaldemonaco.gouv.mc/en/recherche"
    ];

    let html = "";
    let workingUrl = "";

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "text/html,application/xhtml+xml"
          }
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.length > 100) {
            html = text;
            workingUrl = url;
            break;
          }
        }
      } catch (e) {
      }
    }

    if (!html) {
      return res.status(200).json({
        ok: false,
        source: "MONACO",
        total: 0,
        error: "Aucune page Monaco exploitable récupérée",
        results: []
      });
    }

    const text = html
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const includeKeywords = [
      "appel d'offres",
      "appel a concurrence",
      "appel a candidatures",
      "marche",
      "marches",
      "travaux",
      "urbanisme",
      "construction",
      "renovation",
      "rehabilitation",
      "hotel",
      "villa",
      "residence",
      "immobilier",
      "promotion immobiliere",
      "architecte",
      "marbre",
      "travertin",
      "granit",
      "granite",
      "quartzite",
      "onyx",
      "corian",
      "dekton",
      "cosentino",
      "xtone",
      "porcelanosa",
      "infinity",
      "surface",
      "pierre",
      "pierre naturelle",
      "revetement",
      "carrelage",
      "parement",
      "dallage",
      "plan de travail"
    ];

    const hits = includeKeywords.filter((k) => text.includes(k));

    const results = hits.length
      ? [
          {
            source: "MONACO",
            type_source: "Publication officielle Monaco",
            date: null,
            ville: "Monaco",
            acheteur: "Journal de Monaco",
            porteur: "Monaco",
            objet: "Publications officielles Monaco avec mots-clés détectés",
            departements: ["Monaco"],
            type_marche: "Avis / Marché / Urbanisme",
            nature_avis: "Publication officielle",
            descripteurs: hits.slice(0, 10),
            date_limite: null,
            url: workingUrl || "https://journaldemonaco.gouv.mc/",
            score: hits.length * 3,
            segment: "Monaco",
            mots_cles_detectes: hits.slice(0, 10),
            mots_cles_exclus: [],
            verdict: hits.length >= 2 ? "Pertinent" : "À vérifier",
            raison: `Mots-clés détectés : ${hits.slice(0, 5).join(", ")}`
          }
        ]
      : [];

    return res.status(200).json({
      ok: true,
      source: "MONACO",
      total: results.length,
      tested_url: workingUrl || null,
      results
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      source: "MONACO",
      total: 0,
      error: error.message,
      results: []
    });
  }
}
