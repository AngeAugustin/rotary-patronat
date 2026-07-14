import { PrismaClient, PublishStatus, ProjectStatus, ProjectTaskStatus, RoleCode, PostKind, ConversationType, NotificationType, VolunteeringStatus, CalendarEventType, AttendanceStatus, DocumentVisibility, DocumentFileType, MembershipApplicationStatus, MemberStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { ROLE_LABELS } from '@rotary/shared-types';

const prisma = new PrismaClient();

const IMG = {
  hero: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  action1: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
  action2: 'https://images.unsplash.com/photo-1532629345422-7515f3d4bb68?w=800&q=80',
  action3: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
  news1: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
  news2: 'https://images.unsplash.com/photo-1509099836639-18d0d8561f2e?w=800&q=80',
  news3: 'https://images.unsplash.com/photo-1521737711862-e3b97375f902?w=800&q=80',
  president: 'https://i.postimg.cc/hPSfLRjw/PHOTO-2026-07-06-09-01-17.jpg',
  protocoleAdjoint: 'https://i.postimg.cc/jS6pbBKN/PHOTO-2026-07-06-09-02-04-%282%29.jpg',
  communication: 'https://i.postimg.cc/V6HyhMwV/PHOTO-2026-07-06-09-02-04-Copie.jpg',
  pastPresident: 'https://i.postimg.cc/QtzPm3kL/PHOTO-2026-07-06-09-13-27.jpg',
  intermediatePastPresident: 'https://i.postimg.cc/CL8yvzQf/PHOTO-2026-07-06-09-02-04-%282%29-Copie.jpg',
  imane: 'https://i.postimg.cc/Y2g2NzT4/Capture-d-ecran-2026-07-14-094337.png',
  marlene: 'https://i.postimg.cc/fTfwpTwx/Capture-d-ecran-2026-07-14-094326.png',
  cherifath: 'https://i.postimg.cc/SRWyymcm/Capture-d-ecran-2026-07-14-094352.png',
  gallery1: 'https://i.postimg.cc/gjnY11Dd/Aude-Ken-Prod-Studio-189.jpg',
  gallery2: 'https://i.postimg.cc/FHt9nWkZ/Aude-Ken-Prod-Studio-148.jpg',
  gallery3: 'https://i.postimg.cc/xdn99XRP/Aude-Ken-Prod-Studio-143.jpg',
  gallery4: 'https://i.postimg.cc/hj3n8pq1/Aude-Ken-Prod-Studio-132.jpg',
  gallery5: 'https://i.postimg.cc/T3X6cKZR/Aude-Ken-Prod-Studio-111.jpg',
  gallery6: 'https://i.postimg.cc/k4D35KtD/Aude-Ken-Prod-Studio-73.jpg',
};

async function seedRolesAndAdmin() {
  for (const code of Object.values(RoleCode)) {
    await prisma.role.upsert({
      where: { code },
      update: { label: ROLE_LABELS[code] },
      create: { code, label: ROLE_LABELS[code] },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@rotary-nautile.bj';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!ChangeMe';
  const passwordHash = await argon2.hash(adminPassword);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.ADMIN },
  });

  return prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Rotary',
      roles: { create: [{ roleId: adminRole.id }] },
    },
  });
}

async function ensureMemberForUser(
  user: { id: string; email: string; firstName: string; lastName: string },
  profile: {
    phone: string;
    profession: string;
    sponsorFirstName?: string | null;
    sponsorLastName?: string | null;
    motivation: string;
    joinedAt?: Date;
  },
  reviewedById: string,
) {
  const email = user.email.toLowerCase();

  let application = await prisma.membershipApplication.findFirst({
    where: { email, status: MembershipApplicationStatus.ACCEPTED },
    orderBy: { createdAt: 'asc' },
  });

  if (!application) {
    application = await prisma.membershipApplication.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email,
        phone: profile.phone,
        profession: profile.profession,
        sponsorFirstName: profile.sponsorFirstName ?? null,
        sponsorLastName: profile.sponsorLastName ?? null,
        motivation: profile.motivation,
        status: MembershipApplicationStatus.ACCEPTED,
        reviewedById,
        reviewedAt: profile.joinedAt ?? new Date(),
        createdAt: profile.joinedAt ?? undefined,
      },
    });
  }

  const existingMember = await prisma.member.findUnique({ where: { email } });

  if (existingMember) {
    return prisma.member.update({
      where: { id: existingMember.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: profile.phone,
        profession: profile.profession,
        sponsorFirstName: profile.sponsorFirstName ?? null,
        sponsorLastName: profile.sponsorLastName ?? null,
        motivation: profile.motivation,
        status: MemberStatus.ACTIVE,
        membershipApplicationId:
          existingMember.membershipApplicationId ?? application.id,
        userId: existingMember.userId ?? user.id,
        joinedAt: profile.joinedAt ?? existingMember.joinedAt,
      },
    });
  }

  return prisma.member.create({
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      phone: profile.phone,
      profession: profile.profession,
      sponsorFirstName: profile.sponsorFirstName ?? null,
      sponsorLastName: profile.sponsorLastName ?? null,
      motivation: profile.motivation,
      status: MemberStatus.ACTIVE,
      membershipApplicationId: application.id,
      userId: user.id,
      joinedAt: profile.joinedAt ?? new Date(),
    },
  });
}

async function seedPhase3Members() {
  const memberRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.MEMBER },
  });
  const leadRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.COMMISSION_LEAD },
  });

  const commissions = await prisma.commission.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  if (commissions.length === 0) return;

  const passwordHash = await argon2.hash('Membre123!Demo');
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@rotary-nautile.bj').toLowerCase();

  const samples = [
    {
      email: 'marie.dossou@rotary-nautile.bj',
      firstName: 'Marie-Claire',
      lastName: 'Dossou',
      roles: [memberRole.id],
      commissionId: commissions[0].id,
      post: 'Secrétaire',
      phone: '+229 01 40 12 34 56',
      profession: 'Juriste d’entreprise',
      sponsorFirstName: 'Jean-Baptiste',
      sponsorLastName: 'Adjanohoun',
      motivation:
        'Je souhaite mettre mon expertise juridique au service des actions sociales du club et renforcer la gouvernance associative.',
      joinedAt: new Date('2024-09-15T10:00:00.000Z'),
    },
    {
      email: 'koffi.mensah@rotary-nautile.bj',
      firstName: 'Koffi',
      lastName: 'Mensah',
      roles: [memberRole.id],
      commissionId: commissions[1]?.id ?? commissions[0].id,
      post: 'Membre',
      phone: '+229 01 55 67 89 01',
      profession: 'Expert-comptable',
      sponsorFirstName: 'Marie-Claire',
      sponsorLastName: 'Dossou',
      motivation:
        'Engagé pour le développement durable, je veux contribuer aux projets environnementaux et à la transparence financière du club.',
      joinedAt: new Date('2024-11-02T10:00:00.000Z'),
    },
    {
      email: 'aicha.bello@rotary-nautile.bj',
      firstName: 'Aïcha',
      lastName: 'Bello',
      roles: [memberRole.id, leadRole.id],
      commissionId: commissions[2]?.id ?? commissions[0].id,
      post: 'Président de commission',
      isLead: true,
      phone: '+229 01 62 34 56 78',
      profession: 'Responsable RH',
      sponsorFirstName: 'Jean-Baptiste',
      sponsorLastName: 'Adjanohoun',
      motivation:
        'La jeunesse et l’éducation sont au cœur de mon engagement. Je souhaite animer la commission et développer des programmes de mentorat.',
      joinedAt: new Date('2025-01-20T10:00:00.000Z'),
    },
  ];

  for (const sample of samples) {
    const user = await prisma.user.upsert({
      where: { email: sample.email },
      update: {
        firstName: sample.firstName,
        lastName: sample.lastName,
      },
      create: {
        email: sample.email,
        passwordHash,
        firstName: sample.firstName,
        lastName: sample.lastName,
        roles: { create: sample.roles.map((roleId) => ({ roleId })) },
        commissions: {
          create: [{ commissionId: sample.commissionId, role: sample.post }],
        },
      },
    });

    // Ensure commission membership even if user already existed
    await prisma.commissionMember.upsert({
      where: {
        userId_commissionId: {
          userId: user.id,
          commissionId: sample.commissionId,
        },
      },
      update: { role: sample.post },
      create: {
        userId: user.id,
        commissionId: sample.commissionId,
        role: sample.post,
      },
    });

    if (sample.isLead) {
      await prisma.commission.update({
        where: { id: sample.commissionId },
        data: { leadUserId: user.id },
      });
    }
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (admin && commissions[0]) {
    await prisma.commissionMember.upsert({
      where: {
        userId_commissionId: { userId: admin.id, commissionId: commissions[0].id },
      },
      update: {},
      create: {
        userId: admin.id,
        commissionId: commissions[0].id,
        role: 'Membre',
      },
    });
  }

  const reviewerId = admin?.id;
  if (!reviewerId) return;

  // Fiches membres + candidatures acceptées (parcours normal)
  const memberProfiles = [
    {
      email: adminEmail,
      phone: '+229 01 90 00 00 01',
      profession: 'Administrateur du club',
      sponsorFirstName: null,
      sponsorLastName: null,
      motivation:
        'Compte administrateur du Rotary Club Cotonou Le Nautile Patronat, chargé de la gouvernance digitale et de la coordination des commissions.',
      joinedAt: new Date('2024-01-10T10:00:00.000Z'),
    },
    ...samples.map((s) => ({
      email: s.email,
      phone: s.phone,
      profession: s.profession,
      sponsorFirstName: s.sponsorFirstName,
      sponsorLastName: s.sponsorLastName,
      motivation: s.motivation,
      joinedAt: s.joinedAt,
    })),
  ];

  for (const profile of memberProfiles) {
    const user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
    if (!user) continue;

    await ensureMemberForUser(user, profile, reviewerId);
  }
}

async function seedClubContent() {
  const clubHistory =
    "C'est le 2 juin 2025 qu'est née une nouvelle force rotarienne à Cotonou. Sous l'impulsion du Rotary Club de Cotonou le Nautile et la supervision bienveillante de l'IPP Moutawakilou ADEBO, le Rotary Club Satellite de Cotonou le Nautile PATRONAT a vu le jour au sein du District 9103, sous la gouvernance de Spéro HOUNKPE. Baptisé dans l'esprit du thème « La Magie du Rotary », le club a confié ses premiers pas à sa Présidente Fondatrice, Christiane HOUNSOU, qui a structuré les commissions et jeté les fondations du Plan Stratégique 2025-2030.";

  const clubVision =
    "Être un club dynamique et inspirant, où les membres s'épanouissent personnellement et professionnellement grâce à un réseau solide de soutien et d'opportunités, tout en contribuant positivement à leur communauté et au monde.";

  const riPresident = {
    riPresidentName: 'Olayinka Hakeem BABALOLA',
    riPresidentTitle: 'Président du Rotary International',
    riPresidentBio:
      "Membre du Rotary depuis 1994, après un parcours débuté au Rotaract en 1984, Olayinka Hakeem BABALOLA a occupé de nombreuses responsabilités au sein du Rotary International, dont celles de Gouverneur de District, Administrateur et Vice-Président. Ingénieur et entrepreneur, ancien dirigeant de Shell PLC, il a fondé Riviera Technical Services Ltd. ainsi que Lead and Change Consulting. Avec son épouse Preba Babalola, ils sont Major Donors de la Fondation Rotary et membres de l'Arch Klumph Society.",
    riPresidentMessage:
      "« Le Rotary est une force unique capable de transformer des vies en réunissant des femmes et des hommes déterminés à servir leurs communautés et le monde. Ensemble, nous pouvons renforcer notre impact, promouvoir la paix, soutenir le développement humain et poursuivre notre engagement envers un avenir meilleur pour tous », déclare M. Babalola. « Je suis honoré de servir en tant que président du Rotary International et de poursuivre cette mission qui unit les peuples au-delà des frontières, des cultures et des générations. »",
    riPresidentPhoto: 'https://www.adiac-congo.com/sites/default/files/img-20260701-wa0021_1.jpg',
  };

  const clubPresidentTeaser =
    "C'est avec une profonde humilité et une immense fierté que je prends la tête de notre Rotary Club Satellite Passeport de Cotonou Le Nautile PATRONAT pour le mandat 2026-2027.";

  await prisma.clubProfile.upsert({
    where: { id: 'club-profile' },
    update: {
      history: clubHistory,
      vision: clubVision,
      ...riPresident,
      presidentName: 'Régis SEDAGBANDE',
      presidentTitle: 'Président du club',
      presidentPhoto: IMG.president,
      presidentMessage: clubPresidentTeaser,
    },
    create: {
      id: 'club-profile',
      history: clubHistory,
      vision: clubVision,
      mission:
        'Servir les communautés locales par des actions durables, développer l\'amitié professionnelle et promouvoir les idéaux du Rotary.',
      values: ['Intégrité', 'Service', 'Leadership', 'Diversité', 'Excellence'],
      organization:
        'Le club est structuré autour d\'un bureau exécutif et de commissions thématiques. Chaque membre contribue activement aux projets selon ses compétences et sa commission d\'appartenance.',
      presidentMessage: clubPresidentTeaser,
      presidentName: 'Régis SEDAGBANDE',
      presidentTitle: 'Président du club',
      presidentPhoto: IMG.president,
      ...riPresident,
    },
  });

  const executives = [
    { name: 'Régis SEDAGBANDE', role: 'Président', photo: IMG.president, sortOrder: 1 },
    {
      name: 'Imane SAGBOHAN',
      role: 'Secrétaire Général & Président Élu',
      photo: IMG.imane,
      sortOrder: 2,
    },
    {
      name: 'Marlène CAKPO-CHICHI',
      role: 'Trésorière Générale & Présidente Nommée',
      photo: IMG.marlene,
      sortOrder: 3,
    },
    {
      name: 'Chérifath KOTCHOFFA',
      role: 'Protocole',
      photo: IMG.cherifath,
      sortOrder: 4,
    },
    {
      name: 'Ramby Singh',
      role: 'Protocole Adjoint',
      photo: IMG.protocoleAdjoint,
      sortOrder: 5,
    },
    {
      name: 'Augustin FACHEHOUN',
      role: 'Secrétaire Adjoint',
      photo: IMG.communication,
      sortOrder: 6,
    },
    {
      name: 'Moutawakilou ADEBO',
      role: 'Past President',
      photo: IMG.pastPresident,
      sortOrder: 7,
    },
    {
      name: 'Christiane HOUNSOU',
      role: 'Intermediate Past President',
      photo: IMG.intermediatePastPresident,
      sortOrder: 8,
    },
  ];

  await prisma.executiveMember.deleteMany();
  await prisma.executiveMember.createMany({ data: executives });

  const commissions = [
    {
      name: 'Commission Action sociale',
      slug: 'action-sociale',
      description: 'Projets humanitaires, aide aux populations vulnérables et actions de solidarité.',
      sortOrder: 1,
    },
    {
      name: 'Commission Environnement',
      slug: 'environnement',
      description: 'Initiatives écologiques, reboisement et sensibilisation au développement durable.',
      sortOrder: 2,
    },
    {
      name: 'Commission Jeunesse & Éducation',
      slug: 'jeunesse-education',
      description: 'Programmes de mentorat, bourses et soutien scolaire pour les jeunes.',
      sortOrder: 3,
    },
  ];

  await prisma.commission.deleteMany();
  await prisma.commission.createMany({ data: commissions });

  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: [
      { url: IMG.gallery1, caption: null, sortOrder: 1 },
      { url: IMG.gallery2, caption: null, sortOrder: 2 },
      { url: IMG.gallery3, caption: null, sortOrder: 3 },
      { url: IMG.gallery4, caption: null, sortOrder: 4 },
      { url: IMG.gallery5, caption: null, sortOrder: 5 },
      { url: IMG.gallery6, caption: null, sortOrder: 6 },
    ],
  });

  await prisma.clubTimelineEvent.deleteMany();
  await prisma.clubTimelineEvent.createMany({
    data: [
      {
        year: 2025,
        title: 'Naissance du club',
        description:
          "Le 2 juin 2025, sous l'impulsion du Rotary Club de Cotonou le Nautile et la supervision de l'IPP Moutawakilou ADEBO, le Rotary Club Satellite de Cotonou le Nautile PATRONAT voit le jour au sein du District 9103, sous la gouvernance de Spéro HOUNKPE.",
        imageUrl: IMG.hero,
        highlight: true,
        sortOrder: 1,
      },
      {
        year: 2025,
        title: 'Fondations & commissions',
        description:
          "Sous la Présidente Fondatrice Christiane HOUNSOU et dans l'esprit du thème « La Magie du Rotary », le club structure ses commissions et pose les bases du Plan Stratégique 2025-2030.",
        imageUrl: IMG.gallery2,
        sortOrder: 2,
      },
      {
        year: 2025,
        title: 'Cap sur le numérique',
        description:
          'Lancement de la plateforme digitale du club pour centraliser la vie associative, valoriser nos actions et faciliter le recrutement de nouveaux membres.',
        imageUrl: IMG.gallery3,
        highlight: true,
        sortOrder: 3,
      },
    ],
  });

  await prisma.socialLink.deleteMany();
  await prisma.socialLink.createMany({
    data: [
      { platform: 'Facebook', url: 'https://facebook.com', sortOrder: 1 },
      { platform: 'LinkedIn', url: 'https://linkedin.com', sortOrder: 2 },
      { platform: 'Instagram', url: 'https://instagram.com', sortOrder: 3 },
    ],
  });
}

async function seedNews() {
  const categories = [
    { name: 'Vie du club', slug: 'vie-du-club' },
    { name: 'Projets', slug: 'projets' },
    { name: 'Partenariats', slug: 'partenariats' },
  ];

  for (const cat of categories) {
    await prisma.newsCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  const vieDuClub = await prisma.newsCategory.findUniqueOrThrow({
    where: { slug: 'vie-du-club' },
  });
  const projets = await prisma.newsCategory.findUniqueOrThrow({
    where: { slug: 'projets' },
  });
  const partenariats = await prisma.newsCategory.findUniqueOrThrow({
    where: { slug: 'partenariats' },
  });

  const articles = [
    {
      title: 'Lancement de la plateforme digitale du club',
      slug: 'lancement-plateforme-digitale',
      excerpt: 'Le Rotary Club Cotonou Le Nautile Patronat inaugure sa nouvelle vitrine en ligne.',
      content:
        '<p>Nous sommes fiers de présenter notre nouvelle plateforme web, conçue pour renforcer notre visibilité et faciliter la collaboration entre membres.</p><p>Cette initiative s\'inscrit dans notre volonté de moderniser les outils de gouvernance du club.</p>',
      coverImage: IMG.news1,
      categoryId: vieDuClub.id,
      publishedAt: new Date('2025-06-15'),
    },
    {
      title: 'Distribution de kits scolaires à Akpakpa',
      slug: 'kits-scolaires-akpakpa',
      excerpt: 'Plus de 200 élèves ont bénéficié de fournitures scolaires complètes.',
      content:
        '<p>La commission Jeunesse & Éducation a organisé une distribution de kits scolaires dans le quartier d\'Akpakpa.</p><p>Cette action a été rendue possible grâce au soutien de nos partenaires locaux.</p>',
      coverImage: IMG.news2,
      categoryId: projets.id,
      publishedAt: new Date('2025-05-20'),
    },
    {
      title: 'Partenariat avec la Fondation Espoir Bénin',
      slug: 'partenariat-fondation-espoir',
      excerpt: 'Un accord de coopération signé pour trois ans d\'actions conjointes.',
      content:
        '<p>Le club a signé un partenariat stratégique avec la Fondation Espoir Bénin pour amplifier l\'impact de nos projets sociaux.</p>',
      coverImage: IMG.news3,
      categoryId: partenariats.id,
      publishedAt: new Date('2025-04-10'),
    },
  ];

  for (const article of articles) {
    await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      update: { ...article, status: PublishStatus.PUBLISHED },
      create: { ...article, status: PublishStatus.PUBLISHED },
    });
  }
}

async function seedActions() {
  const actions = [
    {
      title: 'Campagne de vaccination mobile',
      slug: 'campagne-vaccination-mobile',
      summary: 'Vaccination gratuite dans les quartiers périphériques de Cotonou.',
      description:
        'En partenariat avec le ministère de la Santé, le club a déployé une unité mobile de vaccination touchant plus de 1 500 personnes dans les communes de Cotonou et Abomey-Calavi.',
      date: new Date('2025-03-12'),
      location: 'Cotonou, Bénin',
      coverImage: IMG.action1,
      gallery: [IMG.action1, IMG.gallery2],
      partners: ['Ministère de la Santé', 'OMS Bénin'],
      results: '1 547 personnes vaccinées, 12 quartiers couverts.',
      featured: true,
      publishedAt: new Date('2025-03-15'),
    },
    {
      title: 'Reboisement du littoral',
      slug: 'reboisement-littoral',
      summary: 'Plantation de 500 mangroves pour protéger la côte.',
      description:
        'La commission Environnement a mobilisé 80 membres et bénévoles pour une journée de reboisement sur le littoral atlantique.',
      date: new Date('2025-02-08'),
      location: 'Ouidah, Bénin',
      coverImage: IMG.action2,
      gallery: [IMG.action2, IMG.gallery3],
      partners: ['ONG Vert Afrique'],
      results: '500 plants de mangrove mis en terre.',
      featured: true,
      publishedAt: new Date('2025-02-10'),
    },
    {
      title: 'Ateliers d\'entrepreneuriat pour jeunes',
      slug: 'ateliers-entrepreneuriat-jeunes',
      summary: 'Formation de 40 jeunes aux bases de la création d\'entreprise.',
      description:
        'Trois jours d\'ateliers pratiques animés par des membres du club et des mentors du réseau Rotary.',
      date: new Date('2025-01-18'),
      location: 'Porto-Novo, Bénin',
      coverImage: IMG.action3,
      gallery: [IMG.action3],
      partners: ['Chambre de Commerce du Bénin'],
      results: '40 jeunes formés, 8 projets pilotes accompagnés.',
      featured: true,
      publishedAt: new Date('2025-01-20'),
    },
  ];

  for (const action of actions) {
    await prisma.action.upsert({
      where: { slug: action.slug },
      update: { ...action, status: PublishStatus.PUBLISHED },
      create: { ...action, status: PublishStatus.PUBLISHED },
    });
  }
}

async function seedMeetings() {
  const meetings = [
    {
      title: 'Assemblée statutaire mensuelle',
      slug: 'assemblee-statutaire-juillet',
      description: 'Réunion mensuelle du club avec ordre du jour et points de gouvernance.',
      date: new Date('2025-07-25T18:30:00'),
      startTime: '18:30',
      location: 'Hôtel Azalaï, Cotonou',
      agenda: 'Approbation du PV, projets en cours, préparation du gala annuel.',
      speakers: ['Jean-Baptiste Adjanohoun', 'Marie-Claire Dossou'],
      publishedAt: new Date(),
    },
    {
      title: 'Conférence : Leadership au service de la communauté',
      slug: 'conference-leadership-communaute',
      description: 'Intervention publique ouverte aux partenaires et invités.',
      date: new Date('2025-08-15T09:00:00'),
      startTime: '09:00',
      location: 'Palais des Congrès, Cotonou',
      speakers: ['Dr. Emmanuel Koudjo'],
      publishedAt: new Date(),
    },
  ];

  for (const meeting of meetings) {
    await prisma.meeting.upsert({
      where: { slug: meeting.slug },
      update: { ...meeting, status: PublishStatus.PUBLISHED },
      create: { ...meeting, status: PublishStatus.PUBLISHED },
    });
  }
}

async function seedProjects() {
  const commission = await prisma.commission.findFirst({
    where: { slug: 'action-sociale' },
  });
  const lead = await prisma.user.findUnique({
    where: { email: 'aicha.bello@rotary-nautile.bj' },
  });
  const member = await prisma.user.findUnique({
    where: { email: 'marie.dossou@rotary-nautile.bj' },
  });

  if (!commission || !lead) return;

  const project = await prisma.project.upsert({
    where: { slug: 'kits-scolaires-2025' },
    update: {},
    create: {
      title: 'Distribution de kits scolaires 2025',
      slug: 'kits-scolaires-2025',
      description:
        'Projet de distribution de fournitures scolaires dans les quartiers défavorisés de Cotonou.',
      objectives: 'Équiper 250 élèves avant la rentrée scolaire.',
      commissionId: commission.id,
      leadUserId: lead.id,
      status: ProjectStatus.IN_PROGRESS,
      progressPercent: 45,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-09-30'),
      budgetPlanned: 5000000,
      budgetSpent: 2250000,
      partners: ['Fondation Espoir Bénin', 'Mairie de Cotonou'],
      beneficiaries: ['Élèves primaires d\'Akpakpa'],
      members: {
        create: [
          { userId: lead.id, role: 'Responsable du projet' },
          ...(member ? [{ userId: member.id, role: 'Membre' }] : []),
        ],
      },
      tasks: {
        create: [
          {
            title: 'Identifier les écoles bénéficiaires',
            status: ProjectTaskStatus.DONE,
            sortOrder: 0,
          },
          {
            title: 'Commander les fournitures',
            status: ProjectTaskStatus.DONE,
            sortOrder: 1,
          },
          {
            title: 'Organiser la distribution',
            status: ProjectTaskStatus.IN_PROGRESS,
            assigneeId: member?.id,
            sortOrder: 2,
          },
          {
            title: 'Rédiger le rapport final',
            status: ProjectTaskStatus.TODO,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.projectHistory.create({
    data: {
      projectId: project.id,
      userId: lead.id,
      action: 'PROJECT_CREATE',
      changes: { title: project.title },
    },
  });
}

async function seedPhase5Social() {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@rotary-nautile.bj' },
  });
  const marie = await prisma.user.findUnique({
    where: { email: 'marie.dossou@rotary-nautile.bj' },
  });
  const koffi = await prisma.user.findUnique({
    where: { email: 'koffi.mensah@rotary-nautile.bj' },
  });

  if (!admin) return;

  await prisma.post.createMany({
    data: [
      {
        authorId: admin.id,
        kind: PostKind.ANNOUNCEMENT,
        content:
          'Chers Rotariens, la prochaine réunion statutaire aura lieu le 15 du mois. Merci de confirmer votre présence auprès du secrétariat.',
        visibility: 'ALL_MEMBERS',
      },
      {
        authorId: admin.id,
        kind: PostKind.EVENT,
        content:
          'Conférence sur le leadership communautaire — intervenant invité : Dr. Agbessi. Inscriptions ouvertes.',
        visibility: 'ALL_MEMBERS',
        linkUrl: 'https://rotary-nautile.bj',
      },
      ...(marie
        ? [
            {
              authorId: marie.id,
              kind: PostKind.MEMBER_POST,
              content:
                'Fier d\'avoir participé à la distribution des kits scolaires ce week-end. Bravo à toute l\'équipe !',
              visibility: 'ALL_MEMBERS' as const,
            },
          ]
        : []),
      ...(koffi
        ? [
            {
              authorId: koffi.id,
              kind: PostKind.MEMBER_POST,
              content:
                'Recherche des bénévoles pour l\'action santé de la commission Services à la communauté.',
              visibility: 'ALL_MEMBERS' as const,
            },
          ]
        : []),
    ],
    skipDuplicates: true,
  });

  if (marie) {
    const existingConv = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        members: { every: { userId: { in: [admin.id, marie.id] } } },
      },
    });

    const conversation =
      existingConv ??
      (await prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          createdById: admin.id,
          members: {
            create: [{ userId: admin.id }, { userId: marie.id }],
          },
        },
      }));

    const messageCount = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    if (messageCount === 0) {
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            senderId: admin.id,
            content: 'Bonjour Marie-Claire, merci pour votre engagement sur le projet kits scolaires.',
          },
          {
            conversationId: conversation.id,
            senderId: marie.id,
            content: 'Merci ! Je prépare le rapport de distribution pour la semaine prochaine.',
          },
        ],
      });
    }

    await prisma.notification.createMany({
      data: [
        {
          userId: marie.id,
          type: NotificationType.NEW_MESSAGE,
          title: 'Nouveau message de Admin Rotary',
          body: 'Bonjour Marie-Claire, merci pour votre engagement…',
          resource: 'conversations',
          resourceId: conversation.id,
        },
        {
          userId: marie.id,
          type: NotificationType.NEW_POST,
          title: 'Nouvelle annonce du club',
          body: 'Chers Rotariens, la prochaine réunion statutaire…',
          resource: 'posts',
        },
      ],
      skipDuplicates: true,
    });
  }
}

async function seedPhase6VolunteeringAndCalendar() {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@rotary-nautile.bj' },
  });
  const marie = await prisma.user.findUnique({
    where: { email: 'marie.dossou@rotary-nautile.bj' },
  });
  const koffi = await prisma.user.findUnique({
    where: { email: 'koffi.mensah@rotary-nautile.bj' },
  });
  const commissions = await prisma.commission.findMany({ take: 1 });

  if (!admin || !marie) return;

  const existingVolunteering = await prisma.volunteeringDeclaration.count();
  if (existingVolunteering === 0) {
    await prisma.volunteeringDeclaration.createMany({
      data: [
        {
          userId: marie.id,
          visitedClub: 'Rotary Club de Porto-Novo',
          city: 'Porto-Novo',
          country: 'Bénin',
          activity: 'Visite de club',
          description: 'Participation à la réunion hebdomadaire et échange sur les projets éducatifs.',
          date: new Date('2025-11-15'),
          startTime: '18:30',
          durationMinutes: 120,
          hours: 2,
          status: VolunteeringStatus.VALIDATED,
          validatedById: admin.id,
          validatedAt: new Date('2025-11-16'),
        },
        {
          userId: marie.id,
          visitedClub: 'Rotary Club de Lomé',
          city: 'Lomé',
          country: 'Togo',
          activity: 'Action humanitaire',
          description: 'Distribution de kits scolaires en collaboration avec le club hôte.',
          date: new Date('2026-01-20'),
          startTime: '09:00',
          durationMinutes: 240,
          hours: 4,
          status: VolunteeringStatus.PENDING,
        },
        ...(koffi
          ? [
              {
                userId: koffi.id,
                visitedClub: 'Rotary Club de Cotonou Dantokpa',
                city: 'Cotonou',
                country: 'Bénin',
                activity: 'Conférence',
                description: 'Intervention sur la santé maternelle.',
                date: new Date('2026-02-10'),
                startTime: '19:00',
                durationMinutes: 90,
                hours: 1.5,
                status: VolunteeringStatus.PENDING,
              },
            ]
          : []),
      ],
    });
  }

  const existingEvents = await prisma.calendarEvent.count();
  if (existingEvents === 0 && commissions[0]) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(18, 0, 0, 0);
    const end = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000);

    const event = await prisma.calendarEvent.create({
      data: {
        title: 'Réunion de commission — Actions communautaires',
        description: 'Point d\'avancement sur les projets en cours et planification Q3.',
        type: CalendarEventType.COMMISSION,
        startAt: nextWeek,
        endAt: end,
        location: 'Siège du club, Cotonou',
        commissionId: commissions[0].id,
        createdById: admin.id,
        attendees: {
          create: [
            { userId: admin.id, status: AttendanceStatus.ACCEPTED },
            { userId: marie.id, status: AttendanceStatus.INVITED },
            ...(koffi ? [{ userId: koffi.id, status: AttendanceStatus.INVITED }] : []),
          ],
        },
      },
    });

    if (koffi) {
      await prisma.notification.create({
        data: {
          userId: marie.id,
          type: NotificationType.CALENDAR_INVITE,
          title: `Invitation : ${event.title}`,
          body: event.location ?? undefined,
          resource: 'calendar',
          resourceId: event.id,
        },
      });
    }
  }
}

async function seedPhase7Library() {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@rotary-nautile.bj' },
  });
  if (!admin) return;

  const categories = [
    { name: 'Comptes rendus', slug: 'comptes-rendus', visibility: DocumentVisibility.PRIVATE, sortOrder: 0 },
    { name: 'Procès-verbaux', slug: 'proces-verbaux', visibility: DocumentVisibility.PRIVATE, sortOrder: 1 },
    { name: 'Guides Rotary', slug: 'guides-rotary', visibility: DocumentVisibility.PRIVATE, sortOrder: 2 },
    { name: 'Formulaires', slug: 'formulaires', visibility: DocumentVisibility.PRIVATE, sortOrder: 3 },
    { name: 'Documents publics', slug: 'documents-publics', visibility: DocumentVisibility.PUBLIC, sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.documentCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  const cr = await prisma.documentCategory.findUnique({ where: { slug: 'comptes-rendus' } });
  const guides = await prisma.documentCategory.findUnique({ where: { slug: 'guides-rotary' } });
  const publicCat = await prisma.documentCategory.findUnique({ where: { slug: 'documents-publics' } });

  if (!cr || !guides || !publicCat) return;

  const existing = await prisma.document.count();
  if (existing > 0) return;

  await prisma.document.createMany({
    data: [
      {
        title: 'Compte rendu — Assemblée générale 2025',
        slug: 'cr-ag-2025',
        description: 'Synthèse des décisions et orientations adoptées en AG.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: DocumentFileType.PDF,
        mimeType: 'application/pdf',
        fileSize: 13264,
        visibility: DocumentVisibility.PRIVATE,
        categoryId: cr.id,
        uploadedById: admin.id,
      },
      {
        title: 'Guide du membre Rotary',
        slug: 'guide-membre-rotary',
        description: 'Document de référence pour les nouveaux membres du club.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: DocumentFileType.PDF,
        mimeType: 'application/pdf',
        fileSize: 13264,
        visibility: DocumentVisibility.PRIVATE,
        categoryId: guides.id,
        uploadedById: admin.id,
      },
      {
        title: 'Charte du club — version publique',
        slug: 'charte-club-publique',
        description: 'Présentation institutionnelle du club accessible aux visiteurs.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: DocumentFileType.PDF,
        mimeType: 'application/pdf',
        fileSize: 13264,
        visibility: DocumentVisibility.PUBLIC,
        categoryId: publicCat.id,
        uploadedById: admin.id,
      },
    ],
  });
}

async function main() {
  await seedRolesAndAdmin();
  await seedClubContent();
  await seedPhase3Members();
  await seedNews();
  await seedActions();
  await seedMeetings();
  await seedProjects();
  await seedPhase5Social();
  await seedPhase6VolunteeringAndCalendar();
  await seedPhase7Library();
  console.log('Seed OK — Phases 2 à 7 chargées');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
