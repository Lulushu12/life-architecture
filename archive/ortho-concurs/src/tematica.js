// The Foișor 2026 specialist post exam tematica for the two clinical probes
// and the practical probe. Every entry maps to a Markdown file at
// src/content/concurs/<id>.md (id = "<probe prefix>-<nn>-<slug>").
//
// experience (practica only): "performed" | "assisted" | "never"

export const PROBES = [
  {
    key: "co",
    label: "Clinică ortopedie",
    short: "Ortopedie",
    date: "2026-09-24",
    format: "Examinare pacient + prezentare de caz + întrebări",
  },
  {
    key: "ct",
    label: "Clinică traumatologie",
    short: "Traumatologie",
    date: "2026-09-28",
    format: "Examinare pacient + prezentare de caz + întrebări",
  },
  {
    key: "p",
    label: "Practică operatorie",
    short: "Practică",
    date: "2026-09-30",
    format: "Descrierea sau efectuarea unei intervenții",
  },
];

const CO = [
  "osteosarcom-fibrosarcom-condrosarcom|Osteosarcomul, fibrosarcomul și condrosarcomul membrelor",
  "tumori-benigne-osteom-osteoid-osteocondrom-encondrom-fibrom|Osteomul osteoid, osteomul, osteocondromul, encondromul, fibromul neosifiant",
  "tumora-cu-celule-gigante|Tumoarea cu celule gigante",
  "osteonecroze-aseptice|Osteonecrozele aseptice",
  "scolioze|Scoliozele",
  "cifoze|Cifozele",
  "spondilolistezis|Spondilolistezis",
  "coxartroza|Coxartroza",
  "boala-dupuytren|Boala Dupuytren",
  "sindrom-canal-carpian-guyon-tarsian|Sindromul de canal carpian, canal Guyon, canal tarsian",
  "tuberculoza-vertebrala|Tuberculoza vertebrală",
  "tuberculoza-soldului|Tuberculoza șoldului",
  "tuberculoza-genunchiului|Tuberculoza genunchiului",
  "deviatiile-genunchiului|Deviațiile genunchiului",
  "gonartroza|Gonartroza",
];

const CT = [
  "luxatia-scapulo-humerala-recenta|Luxația scapulo-humerală recentă",
  "luxatia-scapulo-humerala-recidivanta|Luxația scapulo-humerală recidivantă",
  "luxatiile-acromio-claviculare|Luxațiile acromio-claviculare",
  "fracturile-extremitatii-superioare-a-humerusului|Fracturile extremității superioare a humerusului",
  "fracturile-diafizei-humerale|Fracturile diafizei humerale",
  "pseudartrozele-si-calusul-vicios-membru-superior|Pseudartrozele și calusul vicios după fracturile membrului superior",
  "fracturile-cotului|Fracturile cotului",
  "fractura-diafizara-a-oaselor-antebratului|Fractura diafizară a oaselor antebrațului",
  "ruptura-tendonului-bicepsului-brahial|Ruptura tendonului bicepsului brahial",
  "fracturile-extremitatii-distale-a-antebratului|Fracturile extremității distale a antebrațului",
  "fracturile-oaselor-mainii|Fracturile oaselor mâinii",
  "luxatiile-semilunarului|Luxațiile semilunarului",
  "luxatiile-cotului|Luxațiile cotului",
  "fracturile-coloanei-vertebrale|Fracturile coloanei vertebrale",
  "fracturile-bazinului|Fracturile bazinului",
  "fracturile-colului-femural|Fracturile colului femural",
  "pseudartroza-colului-femural-si-necroza-capului-femural|Pseudartroza colului femural și necroza posttraumatică a capului femural",
  "fracturile-masivului-trohanterian|Fracturile masivului trohanterian",
  "fracturile-diafizei-femurale|Fracturile diafizei femurale",
  "pseudartroza-septica-si-aseptica-femur|Pseudartroza septică și aseptică după fracturile femurului",
  "fracturile-extremitatii-distale-a-femurului|Fracturile extremității distale ale femurului",
  "calusurile-vicioase-post-fracturare|Calusurile vicioase post-fracturare",
  "fracturile-deschise-ale-femurului|Fracturile deschise ale femurului",
  "leziunile-meniscului|Leziunile meniscului genunchiului",
  "leziunile-ligamentare-ale-genunchiului|Leziunile ligamentare ale genunchiului",
  "leziunile-aparatului-extensor-al-genunchiului|Leziunile aparatului extensor al genunchiului",
  "fracturile-platoului-tibial|Fracturile platoului tibial",
  "fracturile-inchise-ale-gambei|Fracturile închise ale gambei",
  "fracturile-deschise-ale-gambei|Fracturile deschise ale gambei",
  "calusurile-vicioase-membru-inferior|Calusurile vicioase post-fracturare ale membrului inferior",
  "pseudartrozele-gambei|Pseudartrozele gambei",
  "osteitele-post-traumatice|Osteitele post-traumatice ale membrelor",
  "fracturile-gleznei|Fracturile gleznei",
  "fracturile-maleolare-si-pilon-tibial|Fracturile maleolare și ale pilonului tibial",
  "fracturile-calcaneului|Fracturile calcaneului",
  "fracturile-oaselor-piciorului|Fracturile oaselor piciorului",
  "redorile-si-anchilozele-genunchiului|Redorile și anchilozele genunchiului",
  "rupturile-tendonului-ahilian|Rupturile tendonului ahilian",
];

const P = [
  "osteosinteza-humerus-proximal-placa|Osteosinteza fracturilor humerusului proximal cu placă și șuruburi|assisted",
  "osteosinteza-diafiza-humerala|Osteosinteza fracturilor diafizei humerale|assisted",
  "osteosinteza-paleta-humerala|Osteosinteza fracturilor de paletă humerală|assisted",
  "osteosinteza-diafize-antebrat|Osteosinteza fracturilor diafizare ale oaselor antebrațului|assisted",
  "osteosinteza-radius-distal-placa|Osteosinteza fracturilor de epifiză distală radială cu placă și șuruburi|performed",
  "osteosinteza-masiv-trohanterian|Osteosinteza fracturilor de masiv trohanterian|never",
  "osteosinteza-diafizara-femur-gamba|Osteosinteza fracturilor diafizare ale femurului și gambei|performed",
  "osteosinteza-platou-tibial|Osteosinteza fracturilor de platou tibial|assisted",
  "osteosinteza-pilon-tibial|Osteosinteza fracturilor de pilon tibial|performed",
  "osteosinteza-maleolara|Osteosinteza fracturilor maleolare|performed",
  "calcaneu-osteosinteza-artrodeza|Osteosinteza sau artrodeza în fracturile calcaneului|assisted",
  "sutura-coafei-rotatorilor|Sutura coafei rotatorilor|assisted",
  "luxatia-recidivanta-umar-chirurgie|Intervenții chirurgicale pentru luxația recidivantă a umărului|never",
  "disjunctia-acromio-claviculara-chirurgie|Intervenții chirurgicale pentru disjuncția acromio-claviculară|assisted",
  "artrodeza-radiocarpiana|Artrodeza radiocarpiană|never",
  "artroplastia-soldului|Artroplastia șoldului|performed",
  "artroplastia-genunchiului|Artroplastia genunchiului|performed",
  "osteotomiile-gonartroza|Osteotomiile în tratamentul gonartrozei|assisted",
  "artrodeza-tibio-astragaliana|Artrodeza tibio-astragaliană|assisted",
  "dubla-artrodeza|Dubla artrodeză mediotarsiană și subastragaliană|assisted",
  "hallux-valgus|Hallux valgus|assisted",
  "meniscectomia-artroscopica|Meniscectomia artroscopică|performed",
  "artroscopia-genunchiului-portaluri|Artroscopia genunchiului: portaluri, tehnici, indicații|performed",
  "sutura-de-menisc|Sutura de menisc: tehnici, indicații|never",
  "instabilitatea-patelo-femurala|Instabilitatea patelo-femurală: tehnici chirurgicale|assisted",
  "ligamentoplastia-lia-artroscopica|Ligamentoplastia intraarticulară a LIA: tehnica artroscopică|performed",
  "amputatii|Amputații: osteomioplastică a coapsei și gambei, amputațiile piciorului|assisted",
  "capsulotomia-posterioara-genunchi|Capsulotomia posterioară a genunchiului|never",
  "mobilizarea-sangeranda-genunchi|Mobilizarea sângerândă a genunchiului cu redoare în extensie|assisted",
  "fixator-extern|Aplicarea unui fixator extern: clasic, Ilizarov etc.|never",
];

function expand(probe, rows) {
  return rows.map((row, i) => {
    const [slug, title, experience] = row.split("|");
    const nn = String(i + 1).padStart(2, "0");
    return {
      id: `${probe}-${nn}-${slug}`,
      probe,
      number: i + 1,
      slug,
      title,
      experience: experience || null,
    };
  });
}

export const TOPICS = [...expand("co", CO), ...expand("ct", CT), ...expand("p", P)];

export function topicsForProbe(key) {
  return TOPICS.filter((t) => t.probe === key);
}

export function getTopic(id) {
  return TOPICS.find((t) => t.id === id);
}
