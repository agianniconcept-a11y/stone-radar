export default async function handler(req, res) {
  try {
    const includeKeywords = [
      "pierre",
      "pierre naturelle",
      "marbre",
      "marfil",
      "travertin",
      "granit",
      "granite",
      "quartz",
      "quartzite",
      "onyx",
      "ardoise",
      "calcaire",
      "opus",
      "opus incertum",
      "parement",
      "dallage",
      "carrelage",
      "faience",
      "faïence",
      "ceramique",
      "céramique",
      "gres cerame",
      "grès cérame",
      "revetement",
      "revêtement",
      "revetements",
      "revêtements",
      "revetements de sols",
      "revêtements de sols",
      "revetements muraux",
      "revêtements muraux",
      "plan de travail",
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
      "corian",
      "solid surface",
      "surface minerale",
      "surface minérale",
      "lot carrelage",
      "lot pierre",
      "lot revetement",
      "lot revêtement",
      "lot finition",
      "lot finitions",
      "finitions",
      "hall",
      "lobby",
      "reception",
      "réception",
      "banque d'accueil",
      "banque accueil",
      "sanitaires",
      "salle de bain",
      "salles de bain",
      "cuisine",
      "hotel",
      "hôtel",
      "residence",
      "résidence",
      "villa",
      "immeuble",
      "programme immobilier",
      "promotion immobiliere",
      "promotion immobilière",
      "restaurant",
      "commerce",
      "bureaux",
      "construction",
      "rehabilitation",
      "réhabilitation",
      "renovation",
      "rénovation",
      "amenagement",
      "aménagement",
      "reamenagement",
      "réaménagement",
      "extension"
    ];

    const excludeKeywords = [
      "gardiennage",
      "surveillance",
      "securite",
      "sécurité",
      "securite incendie",
      "sécurité incendie",
      "eclairage",
      "éclairage",
      "materiel electrique",
      "matériel électrique",
      "electricite",
      "électricité",
      "quincaillerie",
      "assainissement",
      "voirie",
      "vrd",
      "enrobe",
      "enrobé",
      "terrassement",
      "dechets",
      "déchets",
      "dechetterie",
      "déchetterie",
      "signalisation",
      "gardien",
      "lixiviats",
      "reseaux",
      "réseaux"
    ];

    const departments = ["06", "83"];
    const sinceIso = "2026-02-01";

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

    function toArray(value) {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined || value === "") return [];
      return [value];
    }

    function normalize(text) {
      return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    }

    function detectHits(text, words) {
      return words.filter((word) => text.includes(normalize(word)));
    }

    function getRelevance(item) {
      const text = normalize(JSON.stringify(item));
      const includeHits = detectHits(text, includeKeywords);
      const excludeHits = detectHits(text, excludeKeywords);

      const nature = normalize(item.nature_libelle || "");
      const typeMarche = normalize(toArray(item.type_marche).join(" "));
      const objet = normalize(item.objet || "");

      let score = 0;

      score += includeHits.length * 3;
      score -= excludeHits.length * 4;

      if (objet.includes("marbre")) score += 8;
      if (objet.includes("travertin")) score += 8;
      if (objet.includes("quartzite")) score += 8;
      if (objet.includes("carrelage")) score += 5;
      if (objet.includes("parement")) score += 5;
      if (objet.includes("revetement")) score += 5;
      if (objet.includes("revetement")) score += 5;

      if (typeMarche.includes("travaux")) score += 3;
      if (nature.includes("avis de marche")) score += 3;
      if (nature.includes("resultat de marche")) score -= 2;

      return {
        score,
        includeHits,
        excludeHits
      };
    }

    const zoneFiltered = results.filter((item) => {
      const deps = toArray(item.code_departement).map((d) =>
        String(d).padStart(2, "0")
      );
      return deps.some((d) => departments.includes(d));
    });

    const analyzed = zoneFiltered.map((item) => {
      const deps = toArray(item.code_departement).map((d) =>
        String(d).padStart(2, "0")
      );
      const descripteurs = toArray(item.descripteur_libelle);
      const typeMarche = toArray(item.type_marche);
      const relevance = getRelevance(item);

      let verdict = "À vérifier";
      let raison = "Correspondance partielle sur la zone surveillée";

      if (relevance.excludeHits.length > 0 && relevance.score < 4) {
        verdict = "Non pertinent";
        raison = `Hors cible : ${relevance.excludeHits.slice(0, 3).join(", ")}`;
      } else if (relevance.includeHits.length > 0 && relevance.score >= 8) {
        verdict = "Pertinent";
        raison = `Mots-clés détectés : ${relevance.includeHits.slice(0, 5).join(", ")}`;
      }

      return {
        date: item.dateparution || null,
        acheteur: item.nomacheteur || null,
        objet: item.objet || null,
        departements: deps,
        type_marche: typeMarche.join(", ") || null,
        nature_avis: item.nature_libelle || null,
        descripteurs,
        date_limite: item.datelimitereponse || null,
        url: item.url_avis || null,
        score: relevance.score,
        mots_cles_detectes: relevance.includeHits.slice(0, 10),
        mots_cles_exclus: relevance.excludeHits.slice(0, 10),
        verdict,
        raison
      };
    });

    const pertinents = analyzed
      .filter((item) => item.verdict === "Pertinent")
      .sort((a, b) => b.score - a.score);

    const aVerifier = analyzed
      .filter((item) => item.verdict === "À vérifier")
      .sort((a, b) => b.score - a.score);

    const horsCible = analyzed
      .filter((item) => item.verdict === "Non pertinent")
      .sort((a, b) => a.score - b.score);

    const synthese =
      pertinents.length > 0
        ? `${pertinents.length} opportunité(s) pertinente(s), ${aVerifier.length} à vérifier, ${horsCible.length} hors cible`
        : aVerifier.length > 0
        ? `0 opportunité clairement pertinente, ${aVerifier.length} résultat(s) à vérifier, ${horsCible.length} hors cible`
        : `0 opportunité pertinente, ${horsCible.length} résultat(s) hors cible`;

    return res.status(200).json({
      ok: true,
      synthese,
      resume: {
        zone: departments,
        since: sinceIso,
        total_analyse: analyzed.length,
        pertinents: pertinents.length,
        a_verifier: aVerifier.length,
        hors_cible: horsCible.length
      },
      opportunites: pertinents,
      a_verifier: aVerifier,
      hors_cible: horsCible.slice(0, 20)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
