export default async function handler(req, res) {
  try {
    const keywords = [
      "marbre",
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
      "carrelage"
    ];

    const departments = ["06", "83"];

    const sinceIso = "2026-02-01";

    const url =
      "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records" +
      `?limit=100` +
      `&where=dateparution >= date'${sinceIso}'` +
      `&order_by=dateparution desc`;

    const response = await fetch(url);

    const data = await response.json();

    const filtered = data.results.filter(item => {
      const text = JSON.stringify(item).toLowerCase();

      const hasKeyword = keywords.some(k => text.includes(k));

      const dept = JSON.stringify(item.code_departement || "");

      const hasDept = departments.some(d => dept.includes(d));

      return hasKeyword && hasDept;
    });

    return res.status(200).json({
      ok:true,
      zone:["06","83"],
      since: sinceIso,
      total: filtered.length,
      results: filtered.slice(0,20)
    });

  } catch(error){

    return res.status(500).json({
      ok:false,
      error:error.message
    })

  }
}
