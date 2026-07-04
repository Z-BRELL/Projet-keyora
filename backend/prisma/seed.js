// Compiled version of seed.ts for Docker production environment
// Run with: node prisma/seed.js
import { PrismaClient, Role, ListingStatus, ListingType, PropertyType, PostStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getBlogs(superAdminId: string) {
  return [
    {
      title: "Comment bien investir dans l'immobilier au Cameroun",
      slug: 'comment-bien-investir-immobilier',
      excerpt: 'Le march\u00e9 immobilier camerounais conna\u00eet une croissance fulgurante. D\u00e9couvrez les cl\u00e9s pour r\u00e9aliser un investissement rentable.',
      content: 'Le march\u00e9 immobilier camerounais offre de nombreuses opportunit\u00e9s pour les investisseurs avertis.\n\n1. Choisir le bon emplacement\nLes quartiers en plein d\u00e9veloppement comme Bastos \u00e0 Yaound\u00e9 ou Bonanjo \u00e0 Douala offrent le meilleur potentiel de plus-value.\n\n2. S\u00e9curiser le foncier\nAvant tout achat, v\u00e9rifiez le titre foncier aupr\u00e8s du Conservatoire Foncier.\n\n3. Financer son projet\nLes banques camerounaises proposent des cr\u00e9dits immobiliers \u00e0 des taux comp\u00e9titifs (8-10% sur 15-20 ans).\n\n4. Rentabilit\u00e9 locative\nUn bien bien situ\u00e9 peut g\u00e9n\u00e9rer un rendement locatif de 6 \u00e0 10% par an.\n\n5. Faire appel \u00e0 un professionnel\nKeyora est l\u00e0 pour vous accompagner \u00e0 chaque \u00e9tape de votre projet.',
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
      excerpt: 'Vous souhaitez devenir propri\u00e9taire pour la premi\u00e8re fois ? Suivez notre guide pas \u00e0 pas.',
      content: 'Devenir propri\u00e9taire est un r\u00eave accessible.\n\n\u00c9tape 1 : D\u00e9finir votre budget\nCalculez votre capacit\u00e9 d\'emprunt : vos mensualit\u00e9s ne doivent pas d\u00e9passer 35% de vos revenus.\n\n\u00c9tape 2 : Rechercher le bien id\u00e9al\nUtilisez Keyora pour trouver des annonces correspondant \u00e0 vos crit\u00e8res.\n\n\u00c9tape 3 : Visiter et inspecter\nVisitez toujours le bien en personne.\n\n\u00c9tape 4 : N\u00e9gocier le prix\nLe prix affich\u00e9 n\'est pas toujours ferme.\n\n\u00c9tape 5 : Signer l\'acte de vente\nFaites appel \u00e0 un notaire pour authentifier la vente.',
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
      excerpt: "L'architecture contemporaine camerounaise \u00e9volue. D\u00e9couvrez les tendances.",
      content: "Style contemporain afro-minimaliste\nLes nouvelles constructions allient lignes \u00e9pur\u00e9es et mat\u00e9riaux locaux.\n\nMaisons intelligentes (smart homes)\nLa domotique gagne du terrain.\n\nArchitecture bioclimatique\nDes b\u00e2timents qui tirent parti du climat.\n\nEspaces ouverts et modulables\nLes cloisons c\u00e8dent la place aux espaces ouverts.\n\nMat\u00e9riaux \u00e9co-responsables\nBriques en terre cuite, b\u00e9ton cellulaire, panneaux solaires.",
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
      excerpt: 'Vaut-il mieux louer ou acheter ? Analyse compl\u00e8te pour vous aider.',
      content: 'Avantages de la location\n- Flexibilit\u00e9 : vous pouvez d\u00e9m\u00e9nager facilement\n- Pas d\'entretien co\u00fbteux\n- Investissement initial faible\n\nAvantages de l\'achat\n- Constitution d\'un patrimoine\n- Libert\u00e9 : faites les travaux que vous souhaitez\n- Plus-value potentielle (5 \u00e0 8% par an)\n\nChez Keyora, nous vous accompagnons dans votre r\u00e9flexion.',
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
      excerpt: 'Une d\u00e9coration soign\u00e9e augmente la valeur per\u00e7ue de votre bien.',
      content: 'Style afro-chic\nM\u00e9lange mobilier contemporain et pi\u00e8ces artisanales africaines.\n\nStyle scandinave tropical\nMinimalisme revisit\u00e9 aux couleurs des tropiques.\n\nStyle industriel doux\nB\u00e9ton cir\u00e9, brique apparente et m\u00e9tal noir adoucis.\n\nConseils\nMisez sur un \u00e9clairage en couches, des miroirs et des plantes.',
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
      excerpt: 'Le titre foncier est le document le plus important pour s\u00e9curiser votre propri\u00e9t\u00e9.',
      content: "Qu'est-ce qu'un titre foncier ?\nDocument officiel attestant votre droit de propri\u00e9t\u00e9.\n\nComment l'obtenir ?\n1. D\u00e9p\u00f4t d'une demande\n2. Bornage par un g\u00e9om\u00e8tre\n3. Enqu\u00eate de commodo\n4. Publicit\u00e9 l\u00e9gale\n5. D\u00e9livrance du titre\n\nPourquoi est-ce crucial ?\n- Vente officielle impossible sans titre\n- Les banques exigent un titre pour un cr\u00e9dit\n- Protection contre les expropriations\n\nPi\u00e8ges \u00e0 \u00e9viter\nM\u00e9fiez-vous des \"papiers maison\" qui ne sont pas des titres fonciers.",
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
  console.log('Seeding...');

  await prisma.listing.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.user.deleteMany();

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@keyora.com',
      passwordHash: await bcrypt.hash('SuperAdmin123!', 10),
      fullName: 'Sandrine Biya',
      role: Role.SUPERADMIN,
      phone: '+237671234567',
      isVerified: true,
    },
  });

  await prisma.user.createMany({
    data: [
      { email: 'moderateur@keyora.com', passwordHash: await bcrypt.hash('Modo123!', 10), fullName: 'Mod\u00e9rateur Keyora', role: Role.MODERATOR, phone: '+237672345678', isVerified: true },
      { email: 'proprietaire@keyora.com', passwordHash: await bcrypt.hash('Owner123!', 10), fullName: 'Propri\u00e9taire Vendeur', role: Role.SELLER, phone: '+237673456789', isVerified: true },
      { email: 'acheteur@keyora.com', passwordHash: await bcrypt.hash('Buyer123!', 10), fullName: 'Client Acheteur', role: Role.BUYER, phone: '+237674567890', isVerified: true },
    ],
  });

  await prisma.blogPost.createMany({ data: getBlogs(superAdmin.id) });

  await prisma.listing.createMany({
    data: [
      { title: 'Villa moderne avec piscine - Bastos', description: 'Superbe villa de standing.', type: ListingType.SALE, propertyType: PropertyType.HOUSE, price: 180000000, area: 320, rooms: 4, bathrooms: 3, city: 'Yaound\u00e9', latitude: 3.8854, longitude: 11.5165, status: ListingStatus.PUBLISHED, publishedAt: new Date(), ownerId: superAdmin.id },
      { title: 'Appartement de luxe meubl\u00e9 - Golf', description: 'Bel appartement pr\u00e8s du club de Golf.', type: ListingType.RENT, propertyType: PropertyType.APARTMENT, price: 350000, area: 120, rooms: 3, bathrooms: 2, city: 'Yaound\u00e9', latitude: 3.8900, longitude: 11.5200, status: ListingStatus.PUBLISHED, publishedAt: new Date(), ownerId: superAdmin.id },
      { title: 'Terrain titr\u00e9 constructible - Odza', description: 'Grand terrain plat et titr\u00e9.', type: ListingType.SALE, propertyType: PropertyType.LAND, price: 45000000, area: 1000, city: 'Yaound\u00e9', latitude: 3.8200, longitude: 11.5300, status: ListingStatus.PENDING, ownerId: superAdmin.id },
    ],
  });

  console.log('Seed completed!');
  console.log('Super Admin: superadmin@keyora.com / SuperAdmin123!');
  console.log('Seller: proprietaire@keyora.com / Owner123!');
  console.log('Buyer: acheteur@keyora.com / Buyer123!');
  console.log('Moderator: moderateur@keyora.com / Modo123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());