import { PrismaClient, Role, ListingStatus, ListingType, PropertyType, PostStatus } from '@prisma/client';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function getBlogs(superAdminId: string) {
  return [
    {
      title: "Comment bien investir dans l'immobilier au Cameroun",
      slug: 'comment-bien-investir-immobilier',
      excerpt: "Le march\u00e9 immobilier camerounais conna\u00eet une croissance fulgurante. D\u00e9couvrez les cl\u00e9s pour r\u00e9aliser un investissement rentable.",
      content: [
        "Le march\u00e9 immobilier camerounais offre de nombreuses opportunit\u00e9s pour les investisseurs avertis. Voici les points essentiels \u00e0 consid\u00e9rer :",
        "",
        "1. Choisir le bon emplacement",
        "Les quartiers en plein d\u00e9veloppement comme Bastos \u00e0 Yaound\u00e9 ou Bonanjo \u00e0 Douala offrent le meilleur potentiel de plus-value. Privil\u00e9giez les zones b\u00e9n\u00e9ficiant de nouvelles infrastructures (routes, \u00e9coles, centres commerciaux).",
        "",
        "2. S\u00e9curiser le foncier",
        "Avant tout achat, v\u00e9rifiez le titre foncier aupr\u00e8s du Conservatoire Foncier. Un titre foncier en r\u00e8gle est la garantie d'un investissement serein. M\u00e9fiez-vous des promesses de vente non authentifi\u00e9es.",
        "",
        "3. Financer son projet",
        "Les banques camerounaises proposent des cr\u00e9dits immobiliers \u00e0 des taux comp\u00e9titifs (autour de 8-10% sur 15-20 ans). La Microfinance peut \u00eatre une alternative pour les petits projets.",
        "",
        "4. Rentabilit\u00e9 locative",
        "Un bien bien situ\u00e9 \u00e0 Yaound\u00e9 ou Douala peut g\u00e9n\u00e9rer un rendement locatif de 6 \u00e0 10% par an. Les studios et les appartements 2 pi\u00e8ces sont les plus demand\u00e9s.",
        "",
        "5. Faire appel \u00e0 un professionnel",
        "Un agent immobilier certifi\u00e9 vous accompagne dans toutes les \u00e9tapes : recherche, visite, n\u00e9gociation et signature. Son expertise vous fait gagner du temps et de l'argent.",
        "",
        "Investir dans l'immobilier au Cameroun est une d\u00e9cision judicieuse \u00e0 condition de bien se pr\u00e9parer. Keyora est l\u00e0 pour vous accompagner \u00e0 chaque \u00e9tape de votre projet.",
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
      category: 'Investissement',
      viewCount: 4521,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-02-20'),
      authorId: superAdminId,
    },
    {
      title: 'Guide complet pour acheter votre premi\u00e8re maison',
      slug: 'guide-complet-acheter-premiere-maison',
      excerpt: 'Vous souhaitez devenir propri\u00e9taire pour la premi\u00e8re fois ? Suivez notre guide pas \u00e0 pas pour r\u00e9ussir votre achat.',
      content: [
        'Devenir propri\u00e9taire est un r\u00eave accessible. Voici un guide complet pour acheter votre premi\u00e8re maison au Cameroun :',
        '',
        '\u00c9tape 1 : D\u00e9finir votre budget',
        "Calculez votre capacit\u00e9 d'emprunt : vos mensualit\u00e9s ne doivent pas d\u00e9passer 35% de vos revenus mensuels. Pr\u00e9voyez un apport personnel d'au moins 20% du prix du bien.",
        '',
        '\u00c9tape 2 : Rechercher le bien id\u00e9al',
        'Utilisez Keyora pour trouver des annonces correspondant \u00e0 vos crit\u00e8res. Filtrez par ville, quartier, type de bien et budget. Consultez les photos et les descriptions d\u00e9taill\u00e9es.',
        '',
        '\u00c9tape 3 : Visiter et inspecter',
        "Ne vous fiez pas uniquement aux photos. Visitez toujours le bien en personne, v\u00e9rifiez l'\u00e9tat g\u00e9n\u00e9ral, la plomberie, l'\u00e9lectricit\u00e9 et l'absence d'humidit\u00e9.",
        '',
        '\u00c9tape 4 : N\u00e9gocier le prix',
        "Le prix affich\u00e9 n'est pas toujours ferme. Pr\u00e9parez vos arguments : \u00e9tat du march\u00e9, travaux n\u00e9cessaires, comparaison avec des biens similaires.",
        '',
        '\u00c9tape 5 : Signer l\u2019acte de vente',
        "Faites appel \u00e0 un notaire pour authentifier la vente. V\u00e9rifiez que le titre foncier est bien au nom du vendeur et qu'il n'y a pas d'hypoth\u00e8que.",
        '',
        "Avec Keyora, trouvez la maison de vos r\u00eaves et r\u00e9alisez votre projet d'achat en toute s\u00e9r\u00e9nit\u00e9.",
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
      category: 'Guide Acheteur',
      viewCount: 6789,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-02-15'),
      authorId: superAdminId,
    },
    {
      title: "Les tendances de l'architecture moderne au Cameroun",
      slug: 'tendances-architecture-moderne',
      excerpt: "L'architecture contemporaine camerounaise \u00e9volue. D\u00e9couvrez les styles et tendances qui fa\u00e7onnent nos villes.",
      content: [
        "L'architecture moderne au Cameroun conna\u00eet une v\u00e9ritable renaissance. Voici les tendances qui transforment nos villes :",
        '',
        'Style contemporain afro-minimaliste',
        'Les nouvelles constructions allient lignes \u00e9pur\u00e9es et mat\u00e9riaux locaux. Le bois, la pierre de taille et le bambou sont utilis\u00e9s pour cr\u00e9er des espaces \u00e0 la fois modernes et ancr\u00e9s dans la tradition.',
        '',
        'Maisons intelligentes (smart homes)',
        "La domotique gagne du terrain : \u00e9clairage automatis\u00e9, climatisation connect\u00e9e, syst\u00e8mes de s\u00e9curit\u00e9 intelligents. Les propri\u00e9taires camerounais adoptent ces technologies pour plus de confort et d'\u00e9conomie d'\u00e9nergie.",
        '',
        'Architecture bioclimatique',
        'Face aux enjeux climatiques, les architectes con\u00e7oivent des b\u00e2timents qui tirent parti du climat : ventilation naturelle, orientation optimale, toitures v\u00e9g\u00e9talis\u00e9es. Ces constructions r\u00e9duisent la consommation \u00e9nerg\u00e9tique de 30 \u00e0 50%.',
        '',
        'Espaces ouverts et modulables',
        "Les cloisons c\u00e8dent la place aux espaces ouverts. Le salon, la salle \u00e0 manger et la cuisine ne forment plus qu'un seul espace de vie, plus convivial et lumineux.",
        '',
        'Mat\u00e9riaux \u00e9co-responsables',
        'Le parpaing traditionnel est progressivement remplac\u00e9 par des mat\u00e9riaux plus durables : briques en terre cuite, b\u00e9ton cellulaire, panneaux solaires int\u00e9gr\u00e9s.',
        '',
        "L'architecture camerounaise moderne refl\u00e8te notre identit\u00e9 tout en s'ouvrant aux innovations mondiales.",
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
      category: 'Architecture',
      viewCount: 3102,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-02-10'),
      authorId: superAdminId,
    },
    {
      title: 'Louer ou acheter au Cameroun : que choisir ?',
      slug: 'louer-ou-acheter-cameroun',
      excerpt: "Face \u00e0 l'\u00e9volution du march\u00e9 immobilier, la question se pose : vaut-il mieux louer ou acheter ? Analyse compl\u00e8te.",
      content: [
        "Une question revient sans cesse : faut-il louer ou acheter ? Voici une analyse d\u00e9taill\u00e9e pour vous aider \u00e0 prendre la bonne d\u00e9cision.",
        '',
        'Avantages de la location',
        '- Flexibilit\u00e9 : vous pouvez d\u00e9m\u00e9nager facilement selon vos besoins professionnels ou familiaux',
        "- Pas d'entretien co\u00fbteux : le propri\u00e9taire prend en charge les r\u00e9parations",
        "- Investissement initial faible : pas d'apport personnel requis",
        "- Id\u00e9al pour les s\u00e9jours de courte dur\u00e9e (moins de 3 ans)",
        '',
        "Avantages de l'achat",
        "- Constitution d'un patrimoine : chaque mensualit\u00e9 rembourse votre cr\u00e9dit",
        '- Libert\u00e9 : vous faites les travaux et am\u00e9nagements que vous souhaitez',
        "- Plus-value potentielle : l'immobilier camerounais prend en moyenne 5 \u00e0 8% par an",
        '- Revenus locatifs : vous pouvez louer votre bien si vous d\u00e9m\u00e9nagez',
        '',
        'Quand acheter ?',
        "- Vous avez un apport d'au moins 20%",
        '- Vous comptez rester dans la m\u00eame ville plus de 5 ans',
        '- Les taux de cr\u00e9dit sont attractifs (actuellement 8-10%)',
        "- Vous voulez vous constituer un patrimoine pour votre retraite",
        '',
        'Quand louer ?',
        '- Vous venez de commencer votre carri\u00e8re',
        '- Vous changez fr\u00e9quemment de ville',
        "- Vous n'avez pas encore d'apport personnel suffisant",
        "- Les prix dans votre quartier cible sont trop \u00e9lev\u00e9s",
        '',
        'Chez Keyora, nous vous accompagnons dans votre r\u00e9flexion pour faire le choix le plus adapt\u00e9 \u00e0 votre situation.',
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      category: 'Conseils',
      viewCount: 5234,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-02-05'),
      authorId: superAdminId,
    },
    {
      title: 'D\u00e9coration int\u00e9rieure : les styles qui subliment votre bien',
      slug: 'decoration-interieure-styles',
      excerpt: 'Une d\u00e9coration soign\u00e9e augmente la valeur per\u00e7ue de votre bien. D\u00e9couvrez les styles tendances au Cameroun.',
      content: [
        'La d\u00e9coration int\u00e9rieure transforme un simple logement en un v\u00e9ritable foyer. Voici les styles qui ont la cote au Cameroun :',
        '',
        'Style afro-chic',
        'Ce style m\u00e9lange mobilier contemporain et pi\u00e8ces artisanales africaines. Tapis traditionnels, sculptures en bois, tissus wax et poteries cr\u00e9ent une atmosph\u00e8re chaleureuse et authentique. Les couleurs chaudes (ocre, terre cuite, vert for\u00eat) dominent.',
        '',
        'Style scandinave tropical',
        'Le minimalisme scandinave revisit\u00e9 aux couleurs des tropiques. Murs blancs, bois clair, plantes vertes abondantes et touches de couleurs vives (jaune, bleu canard). Parfait pour les petits espaces.',
        '',
        'Style industriel doux',
        "Inspir\u00e9 des lofts new-yorkais, ce style utilise le b\u00e9ton cir\u00e9, la brique apparente et le m\u00e9tal noir, adoucis par des textiles naturels (lin, coton) et un \u00e9clairage chaleureux.",
        '',
        'Conseils pour valoriser votre bien',
        "- Misez sur un \u00e9clairage en couches : plafonnier, lampes sur pied, lumi\u00e8res d'accentuation",
        '- Utilisez des miroirs pour agrandir visuellement les pi\u00e8ces',
        '- Choisissez des couleurs neutres pour les murs (beige, blanc cass\u00e9, gris clair)',
        "- Ajoutez des plantes vertes : elles purifient l'air et apportent de la vie",
        '',
        'Un bien bien d\u00e9cor\u00e9 se vend ou se loue plus vite et \u00e0 un meilleur prix. Keyora vous conseille pour valoriser votre propri\u00e9t\u00e9.',
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1565182999555-022f8953b5b6?w=400&h=300&fit=crop',
      category: 'D\u00e9coration',
      viewCount: 2876,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-01-30'),
      authorId: superAdminId,
    },
    {
      title: 'Comprendre le titre foncier au Cameroun',
      slug: 'comprendre-titre-foncier-cameroun',
      excerpt: 'Le titre foncier est le document le plus important pour s\u00e9curiser votre propri\u00e9t\u00e9. Tout ce que vous devez savoir.',
      content: [
        'Le titre foncier est le document juridique qui \u00e9tablit votre droit de propri\u00e9t\u00e9 sur un terrain ou un immeuble au Cameroun. Voici ce qu\u2019il faut absolument savoir :',
        '',
        "Qu'est-ce qu'un titre foncier ?",
        "C'est un document officiel d\u00e9livr\u00e9 par le Conservateur Foncier qui atteste que vous \u00eates le propri\u00e9taire l\u00e9gitime d'un bien. Il contient : le num\u00e9ro de titre, la superficie, la localisation, les limites du terrain et le nom du propri\u00e9taire.",
        '',
        "Comment l'obtenir ?",
        'La proc\u00e9dure comporte plusieurs \u00e9tapes :',
        "1. D\u00e9p\u00f4t d'une demande au Service des Domaines",
        '2. Bornage du terrain par un g\u00e9om\u00e8tre agr\u00e9\u00e9',
        '3. Enqu\u00eate de commodo et incommodo (v\u00e9rification des voisins)',
        '4. Publicit\u00e9 l\u00e9gale (insertion dans un journal)',
        '5. D\u00e9livrance du titre foncier par le Conservateur',
        '',
        'Pourquoi est-ce crucial ?',
        "- Sans titre foncier, vous ne pouvez pas vendre officiellement le bien",
        '- Les banques exigent un titre foncier pour accorder un cr\u00e9dit hypoth\u00e9caire',
        "- En cas de litige, seul le titulaire du titre foncier est prot\u00e9g\u00e9",
        "- Le titre foncier vous prot\u00e8ge contre les expropriations abusives",
        '',
        "Pi\u00e8ges \u00e0 \u00e9viter",
        '- M\u00e9fiez-vous des "papiers maison" qui ne sont pas des titres fonciers',
        "- V\u00e9rifiez toujours l'authenticit\u00e9 du titre aupr\u00e8s du Conservatoire",
        "- Ne signez jamais d'acte sans avoir vu le titre foncier original",
        '- Faites appel \u00e0 un notaire pour toutes les transactions',
        '',
        "La s\u00e9curisation fonci\u00e8re est la cl\u00e9 d'un investissement immobilier r\u00e9ussi. Keyora vous met en relation avec des professionnels de confiance.",
      ].join('\n'),
      coverUrl: 'https://images.unsplash.com/photo-1560870861-8c5348e8aa12?w=400&h=300&fit=crop',
      category: 'Juridique',
      viewCount: 7891,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-01-25'),
      authorId: superAdminId,
    },
  ];
}

async function main() {
  console.log('🌱 Démarrage du seed Keyora...');

  // 1. Nettoyage de la base de données
  await prisma.listing.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.user.deleteMany();

  // 2. Préparation des mots de passe hachés
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const modoPassword = await bcrypt.hash('Modo123!', 10);
  const ownerPassword = await bcrypt.hash('Owner123!', 10);
  const buyerPassword = await bcrypt.hash('Buyer123!', 10);

  // 3. Création des comptes de test
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@keyora.com',
      passwordHash: superAdminPassword,
      fullName: 'Sandrine Biya',
      role: Role.SUPERADMIN,
      phone: '+237671234567',
      isVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderateur@keyora.com',
      passwordHash: modoPassword,
      fullName: 'Modérateur Keyora',
      role: Role.MODERATOR,
      phone: '+237672345678',
      isVerified: true,
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: 'proprietaire@keyora.com',
      passwordHash: ownerPassword,
      fullName: 'Propriétaire Vendeur',
      role: Role.SELLER,
      phone: '+237673456789',
      isVerified: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'acheteur@keyora.com',
      passwordHash: buyerPassword,
      fullName: 'Client Acheteur',
      role: Role.BUYER,
      phone: '+237674567890',
      isVerified: true,
    },
  });

  console.log('✅ Utilisateurs créés (4)');

  // 4. Création des articles de blog
  await prisma.blogPost.createMany({ data: getBlogs(superAdmin.id) });
  console.log('✅ Articles de blog créés (6)');

  // 5. Création des annonces
  await prisma.listing.createMany({
    data: [
      {
        title: 'Villa moderne avec piscine — Bastos',
        description: 'Superbe villa de standing dans le quartier diplomatique de Bastos. Piscine privée, jardin paysager, salon de réception, cuisine américaine équipée, 4 chambres avec dressing, 3 salles de bain. Gardiennage 24h/24.',
        type: ListingType.SALE,
        propertyType: PropertyType.HOUSE,
        price: 180000000,
        area: 320,
        rooms: 4,
        bathrooms: 3,
        address: 'Avenue Bastos',
        city: 'Yaoundé',
        latitude: 3.8854,
        longitude: 11.5165,
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
        ownerId: seller.id,
      },
      {
        title: 'Appartement de luxe meublé — Golf',
        description: 'Bel appartement très bien situé près du club de Golf. Proche de toutes commodités. Idéal pour des longs séjours.',
        type: ListingType.RENT,
        propertyType: PropertyType.APARTMENT,
        price: 350000,
        area: 120,
        rooms: 3,
        bathrooms: 2,
        address: 'Quartier Golf',
        city: 'Yaoundé',
        latitude: 3.8900,
        longitude: 11.5200,
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
        ownerId: seller.id,
      },
      {
        title: 'Terrain titré constructible — Odza',
        description: 'Grand terrain plat et titré dans un quartier résidentiel. Excellent pour un projet immobilier à forte valeur locative.',
        type: ListingType.SALE,
        propertyType: PropertyType.LAND,
        price: 45000000,
        area: 1000,
        rooms: 0,
        bathrooms: 0,
        address: 'Odza Borne 10',
        city: 'Yaoundé',
        latitude: 3.8200,
        longitude: 11.5300,
        status: ListingStatus.PENDING,
        ownerId: seller.id,
      },
    ],
  });

  console.log('✅ Annonces créées (3)');
  console.log('🎉 Seed terminé avec succès ! La base de données est prête.');
  
  // Affichage des identifiants de connexion
  console.log('\n📝 IDENTIFIANTS DE CONNEXION:\n');
  console.log('🔐 SUPER ADMIN:');
  console.log('   Email: superadmin@keyora.com');
  console.log('   Mot de passe: SuperAdmin123!\n');
  console.log('🔐 MODÉRATEUR:');
  console.log('   Email: moderateur@keyora.com');
  console.log('   Mot de passe: Modo123!\n');
  console.log('🔐 VENDEUR:');
  console.log('   Email: proprietaire@keyora.com');
  console.log('   Mot de passe: Owner123!\n');
  console.log('🔐 ACHETEUR:');
  console.log('   Email: acheteur@keyora.com');
  console.log('   Mot de passe: Buyer123!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
