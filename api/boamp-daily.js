export default async function handler(req, res) {
  try {

    const keywords = [

      // Pierre naturelle
      "pierre",
      "pierre naturelle",
      "marbre",
      "marfil",
      "travertin",
      "granit",
      "granite",
      "quartzite",
      "ardoise",
      "calcaire",
      "onyx",

      // Céramique / surfaces
      "céramique",
      "ceramique",
      "grès cérame",
      "gres cerame",
      "carrelage",
      "faïence",
      "faience",
      "dallage",
      "parement",
      "revêtement",
      "revetement",
      "revêtements",
      "revetements",
      "revêtements de sols",
      "revêtements muraux",
      "revêtements sol",
      "revêtements mur",

      // Marques premium
      "dekton",
      "porcelanosa",
      "infinity",
      "neolith",
      "laminam",
      "sapienstone",
      "caesarstone",
      "silestone",
      "compac",
      "lapitec",

      // Résines / composites
      "corian",
      "solid surface",
      "quartz",
      "surface minérale",
      "surface minerale",

      // Construction / rénovation
      "construction",
      "réhabilitation",
      "rehabilitation",
      "rénovation",
      "renovation",
      "extension",
      "aménagement",
      "amenagement",
      "réaménagement",
      "reamenagement",

      // Lots techniques
      "lot carrelage",
      "lot pierre",
      "lot finition",
      "lot finitions",
      "lot revêtement",
      "lot revetement",
      "second oeuvre",
      "second œuvre",
      "finition",

      // Bâtiments ciblés
      "hôtel",
      "hotel",
      "résidence",
      "residence",
      "villa",
      "immeuble",
      "programme immobilier",
      "promotion immobilière",
      "promotion immobiliere",
      "logements",
      "bureaux",
      "commerce",
      "restaurant",
      "centre commercial",

      // Espaces spécifiques
      "hall",
      "accueil",
      "réception",
      "reception",
      "lobby",
      "sanitaires",
      "salle de bain",
      "salles de bain",
      "cuisine",
      "plan de travail",
      "comptoir",
      "banque d'accueil",
      "banque accueil"

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
      keywords_count: keywords.length,
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
