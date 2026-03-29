export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://journaldemonaco.gouv.mc/recherche?SearchText=&filter%5B%5D=attr_category_s%3A%22Avis+et+Communiqu%C3%A9s%22&page_limit=50&sort=published_desc",
      {
        headers: {
          Accept: "text/html"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Monaco: ${response.status}`);
    }

    const html = await response.text();
    const text = html.toLowerCase();

    const includeKeywords = [
      "appel d'offres",
      "appel a concurrence",
      "appel à concurrence",
      "marche",
      "marché",
      "travaux",
      "urbanisme",
      "construction",
      "renovation",
      "rénovation",
      "rehabilitation",
      "réhabilitation",
      "hôtel",
      "hotel",
      "villa",
      "residence",
      "résidence",
      "marbre",
      "travertin",
      "granit",
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
      "revêtement",
      "revetement",
      "carrelage",
      "parement",
      "dallage"
    ];

    const hits = includeKeywords.filter((k) => text.includes(k.toLowerCase()));

    const results = hits.length
      ? [
          {
            source: "MONACO",
            type_source: "Avis / Appel d'offres / Publication officielle",
            date: null,
            ville: "Monaco",
            acheteur: "Journal de Monaco",
            porteur: "Monaco",
            objet: "Résultats détectés sur les publications officielles de Monaco",
            departements: ["MC"],
            type_marche: "Monaco",
            nature_avis: "Publication officielle",
            descripteurs: hits.slice(0, 10),
            date_limite: null,
            url: "https://journaldemonaco.gouv.mc/",
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
      results
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
