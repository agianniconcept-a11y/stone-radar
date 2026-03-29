export default async function handler(req, res) {
  try {
    const url = process.env.URBANISME_API_URL;

    if (!url) {
      return res.status(200).json({
        ok: true,
        source: "URBANISME",
        configured: false,
        total: 0,
        results: []
      });
    }

    const includeKeywords = [
      "hotel",
      "hôtel",
      "palace",
      "resort",
      "villa",
      "maison individuelle",
      "residence",
      "résidence",
      "residence de tourisme",
      "résidence de tourisme",
      "immeuble",
      "programme immobilier",
      "promotion immobiliere",
      "promotion immobilière",
      "construction",
      "extension",
      "renovation",
      "rénovation",
      "rehabilitation",
      "réhabilitation",
      "restructuration",
      "restaurant",
      "commerce",
      "boutique",
      "bureaux",
      "hall",
      "lobby",
      "facade",
      "façade",
      "salle de bain",
      "cuisine",
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
      "surface minérale",
      "surface minerale",
      "parement",
      "dallage",
      "carrelage",
      "revêtement",
      "revetement",
      "pierre",
      "pierre naturelle",
      "plan de travail"
    ];

    const targetCommunes = [
      "nice",
      "cannes",
      "antibes",
      "vallauris",
      "golfe-juan",
      "juan-les-pins",
      "grasse",
      "mougins",
      "menton",
      "beausoleil",
      "villefranche-sur-mer",
      "saint-jean-cap-ferrat",
      "cap-d'ail",
      "roquebrune-cap-martin",
      "biot",
      "valbonne",
      "theoule-sur-mer",
      "théoule-sur-mer",
      "saint-tropez",
      "ramatuelle",
      "grimaud",
      "gassin",
      "sainte-maxime",
      "frejus",
      "fréjus",
      "saint-raphael",
      "saint-raphaël",
      "cavalaire-sur-mer",
      "la croix-valmer",
      "hyeres",
      "hyères",
      "bandol",
      "sanary-sur-mer",
      "toulon",
      "le lavandou",
      "bormes-les-mimosas"
    ];

    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Erreur urbanisme: ${response.status}`);
    }

    const data = await response.json();
    const rows = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.records)
      ? data.records
      : Array.isArray(data)
      ? data
      : [];

    function normalize(text) {
      return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    }

    function detectHits(text, words) {
      return words.filter((word) => text.includes(normalize(word)));
    }

    function computeSegment(text) {
      if (text.includes("hotel") || text.includes("hôtel") || text.includes("palace") || text.includes("resort")) {
        return "Hôtellerie";
      }
      if (text.includes("villa")) {
        return "Villa de luxe";
      }
      if (
        text.includes("programme immobilier") ||
        text.includes("promotion immobiliere") ||
        text.includes("promotion immobilière") ||
        text.includes("residence") ||
        text.includes("résidence") ||
        text.includes("immeuble")
      ) {
        return "Promoteur / Résidentiel";
      }
      return "Urbanisme / Projet privé";
    }

    const filtered = rows
      .map((item) => {
        const text = normalize(JSON.stringify(item));
        const communeText = normalize(
          item.commune || item.libcom || item.nom_commune || item.ville || ""
        );

        const hasCommune = targetCommunes.some((c) => communeText.includes(c));
        const includeHits = detectHits(text, includeKeywords);

        let score = includeHits.length * 3;

        if (text.includes("villa")) score += 8;
        if (text.includes("hotel") || text.includes("hôtel")) score += 8;
        if (text.includes("programme immobilier")) score += 7;
        if (text.includes("promotion immobiliere") || text.includes("promotion immobilière")) score += 7;
        if (text.includes("marbre")) score += 10;
        if (text.includes("travertin")) score += 10;
        if (text.includes("onyx")) score += 10;
        if (text.includes("corian")) score += 8;
        if (text.includes("dekton")) score += 8;
        if (text.includes("xtone")) score += 8;
        if (text.includes("porcelanosa")) score += 8;
        if (text.includes("infinity")) score += 8;
        if (text.includes("quartzite")) score += 8;

        const verdict = hasCommune && score >= 6 ? "Pertinent" : "À vérifier";

        return {
          source: "URBANISME",
          type_source: "Permis / Déclaration préalable",
          date:
            item.date_autorisation ||
            item.date_decision ||
            item.date_depot ||
            null,
          ville:
            item.commune || item.libcom || item.nom_commune || item.ville || null,
          acheteur: null,
          porteur: item.demandeur || item.petitionnaire || item.promoteur || null,
          objet: item.objet || item.description || item.libelle || null,
          departements: [item.departement || item.code_departement || ""].filter(Boolean),
          type_marche: item.type_dossier || item.nature_dossier || item.autorisation || null,
          nature_avis: item.type_dossier || item.nature_dossier || "Urbanisme",
          descripteurs: includeHits.slice(0, 10),
          date_limite: null,
          url: item.url || item.lien || item.link || null,
          score,
          segment: computeSegment(text),
          mots_cles_detectes: includeHits.slice(0, 10),
          mots_cles_exclus: [],
          verdict,
          raison: includeHits.length
            ? `Mots-clés détectés : ${includeHits.slice(0, 5).join(", ")}`
            : "Projet situé dans la zone surveillée"
        };
      })
      .filter((item) => item.ville);

    return res.status(200).json({
      ok: true,
      source: "URBANISME",
      configured: true,
      total: filtered.length,
      results: filtered
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
