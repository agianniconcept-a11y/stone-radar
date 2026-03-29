export default async function handler(req, res) {
  try {
    const keywords = [
      "marbre",
      "marfil",
      "travertin",
      "granit",
      "granite",
      "quartz",
      "quartzite",
      "corian",
      "dekton",
      "porcelanosa",
      "infinity",
      "ceramique",
      "céramique",
      "gres cerame",
      "grès cérame",
      "faience",
      "faïence",
      "pierre",
      "pierre naturelle",
      "opus",
      "parement",
      "dallage",
      "revetement",
      "revêtement",
      "plan de travail",
      "carrelage",
      "revetements de sols",
      "revêtements de sols",
      "revetements muraux",
      "revêtements muraux"
    ];

    const departments = ["06", "83"];

    const daysBack = 30;
    const since = 2026-02-01();
    since.setDate(since.getDate() - daysBack);
    const sinceIso = since.toISOString().slice(0, 10);

    const url =
      "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records" +
      `?limit=100` +
      `&where=dateparution >= date'${sinceIso}'` +
      `&order_by=dateparution desc`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Erreur BOAMP: ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const filtered = results.filter((item) => {
      const fullText = JSON.stringify(item).toLowerCase();

      const hasKeyword = keywords.some((k) =>
        fullText.includes(k.toLowerCase())
      );

      const itemDepartments = Array.isArray(item.code_departement)
        ? item.code_departement
        : item.code_departement
        ? [item.code_departement]
        : [];

      const hasDepartment = itemDepartments.some((d) =>
        departments.includes(String(d))
      );

      return hasKeyword && hasDepartment;
    });

    const simplified = filtered.slice(0, 30).map((item) => ({
      idweb: item.idweb,
      dateparution: item.dateparution,
      acheteur: item.nomacheteur,
      objet: item.objet,
      departement: item.code_departement,
      type_marche: item.type_marche,
      descripteurs: item.descripteur_libelle,
      url_avis: item.url_avis
    }));

    return res.status(200).json({
      ok: true,
      zone: ["06", "83"],
      since: sinceIso,
      total: filtered.length,
      results: simplified
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
