export interface PublicCommissionContact {
  name: string;
  role: string;
  photo?: string;
  email?: string;
  phone?: string;
}

export interface PublicCommissionGoal {
  title: string;
  actions: string[];
}

export interface PublicCommissionSection {
  title: string;
  items: { label: string; description: string }[];
}

export interface PublicCommission {
  slug: string;
  name: string;
  shortDescription: string;
  intro: string;
  contact: PublicCommissionContact;
  /** Mission / fonctionnement (listes ou textes). */
  missionBlocks?: PublicCommissionSection[];
  /** Points listes libres (ex. critères communiqué). */
  bulletGroups?: { title: string; items: string[] }[];
  closingNote?: string;
  objectivesPeriod: string;
  goals: PublicCommissionGoal[];
}

export const publicCommissions: PublicCommission[] = [
  {
    slug: 'administration-et-effectif',
    name: 'Commission Administration et Effectif',
    shortDescription:
      'Gouverner le quotidien du club et développer un effectif engagé, diversifié et durable.',
    intro:
      'La commission Administration et Effectif assure la gestion administrative du club et accompagne le recrutement, la fidélisation et l’animation de la communauté rotarienne.',
    contact: {
      name: 'Imane SAGBOHAN',
      role: 'Secrétaire / Présidente de la commission Administration et Effectif',
      photo: 'https://i.postimg.cc/Y2g2NzT4/Capture-d-ecran-2026-07-14-094337.png',
    },
    missionBlocks: [
      {
        title: 'Administration',
        items: [
          {
            label: 'Gérer les affaires courantes',
            description:
              'Gestion administrative du club : cotisations, formalités, archives et ressources.',
          },
          {
            label: 'Élaborer les règles',
            description:
              'Rédaction et mise à jour des statuts et du règlement intérieur.',
          },
          {
            label: 'Assurer la conformité juridique',
            description:
              'Veiller au respect des lois et réglementations en vigueur.',
          },
          {
            label: 'Gérer les relations avec les tiers',
            description:
              'Relations avec les autorités, sponsors, partenaires et autres organisations.',
          },
        ],
      },
      {
        title: 'Effectif',
        items: [
          {
            label: 'Recruter de nouveaux membres',
            description:
              'Mettre en place des stratégies pour attirer de nouveaux talents.',
          },
          {
            label: 'Fidéliser les membres existants',
            description:
              'Organiser des activités et événements pour maintenir l’engagement.',
          },
          {
            label: 'Animer le club',
            description:
              'Contribuer à une ambiance conviviale et positive au sein du club.',
          },
          {
            label: 'Développer le club',
            description:
              'Soutenir la croissance du club par le recrutement et la rétention.',
          },
        ],
      },
    ],
    objectivesPeriod: '2025 - 2030',
    goals: [
      {
        title:
          'Augmenter le nombre de membres actifs du club de 40 % d’ici juin 2030, avec un taux de rétention annuel d’au moins 85 %.',
        actions: [
          'Élaboration d’un plan de recrutement et de rétention (année 1).',
          'Se donner, chacun, comme objectif personnel de présenter au moins 2 invités par an.',
          'Création d’1 nouveau club satellite et 1 club Rotaract et Interact d’ici 5 ans.',
          'Mise en place d’un programme d’intégration et de parrainage pour chaque nouveau membre.',
          'Amplifier les contacts avec les clubs Rotaract.',
        ],
      },
      {
        title:
          'Accroître la diversité de genre et d’âge : atteindre une représentation féminine de 50 % et des membres de moins de 40 ans à hauteur de 30 % d’ici 2030.',
        actions: [
          'Campagne annuelle de sensibilisation ciblée (jeunes pro, femmes leaders, etc.).',
          'Coopération avec les universités pour des partenariats jeunes diplômés.',
        ],
      },
    ],
  },
  {
    slug: 'finance-et-fondation',
    name: 'Commission Finance et Fondation',
    shortDescription:
      'Piloter la santé financière du club et mobiliser les ressources de la Fondation Rotary.',
    intro:
      'La commission Finance et Fondation supervise le budget, le suivi des comptes et l’engagement du club envers les projets et programmes de la Fondation Rotary.',
    contact: {
      name: 'Marlène CAPO-CHICHI',
      role: 'Trésorière / Présidente de la Commission Finance et Fondation',
      photo: 'https://i.postimg.cc/fTfwpTwx/Capture-d-ecran-2026-07-14-094326.png',
      email: 'elanamarlene@gmail.com',
      phone: '+229 01 96 34 34 73',
    },
    missionBlocks: [
      {
        title: 'Finance',
        items: [
          {
            label: 'Contrôle des dépenses et suivi des comptes',
            description:
              'Vérifier les dépenses et suivre les comptes du club, souvent en lien avec la comptabilité.',
          },
          {
            label: 'Gestion du budget',
            description:
              'Préparer et suivre le budget, et valider les projets selon la situation financière.',
          },
          {
            label: 'Informations aux membres',
            description:
              'Informer sur la situation financière et les projets lors des réunions de bureau et assemblées générales.',
          },
        ],
      },
      {
        title: 'Fondation',
        items: [
          {
            label: 'Soutien financier à des projets',
            description:
              'Identifier et soutenir des projets ou organisations alignés sur les objectifs du club.',
          },
          {
            label: 'Levée de fonds et sensibilisation',
            description:
              'Organiser des événements de collecte et sensibiliser à l’importance des dons.',
          },
          {
            label: 'Gestion des dons',
            description:
              'Gérer les dons reçus et les orienter vers les projets de la Fondation.',
          },
        ],
      },
    ],
    objectivesPeriod: '2025 - 2030',
    goals: [
      {
        title:
          'Doubler les fonds propres disponibles du club en 5 ans grâce à des campagnes de collecte innovantes et des partenariats avec des fondations.',
        actions: [
          'Une campagne annuelle de levée de fonds.',
          'Identification de 3 nouvelles sources de financement externes d’ici 2028 (Fondation Gates, etc.).',
          'Création d’un comité de recherche de partenariats financiers.',
        ],
      },
      {
        title:
          'Augmenter de 50 % les contributions annuelles des membres à la Fondation Rotary d’ici 2030.',
        actions: [
          'Sensibilisation trimestrielle des membres sur l’impact des dons.',
          'Mise en place de défis internes (parrainages, classements…).',
        ],
      },
    ],
  },
  {
    slug: 'action',
    name: 'Commission Action',
    shortDescription:
      'Mettre en pratique les valeurs du club par des projets concrets au service de la communauté.',
    intro:
      'La commission Action est un élément essentiel du fonctionnement de notre club : elle permet de mettre en pratique nos valeurs et de contribuer concrètement au bien-être de la communauté et du monde.',
    contact: {
      name: 'Sachin SINGH',
      role: 'Président de la commission Action',
      photo: 'https://i.postimg.cc/jS6pbBKN/PHOTO-2026-07-06-09-02-04-%282%29.jpg',
      email: 'sramby2018@gmail.com',
      phone: '+229 01 61 14 81 76',
    },
    missionBlocks: [
      {
        title: 'Domaines d’intervention',
        items: [
          {
            label: 'Action d’intérêt public',
            description:
              'Se concentrer sur les besoins locaux et planifier des actions concrètes pour améliorer la vie des citoyens.',
          },
          {
            label: 'Action internationale',
            description:
              'Développer et mettre en œuvre des projets à l’étranger, en partenariat avec d’autres clubs ou organisations.',
          },
          {
            label: 'Action Jeunesse',
            description:
              'Encourager la participation des jeunes et les aider à développer leurs compétences.',
          },
          {
            label: 'Action professionnelle',
            description:
              'Faciliter les liens entre professionnels et organiser des événements de formation ou de networking.',
          },
          {
            label: 'Action santé',
            description:
              'Mettre en place des programmes de prévention et de soins, souvent avec des professionnels de santé.',
          },
          {
            label: 'Action sociale',
            description:
              'Se focaliser sur les questions sociales et organiser des actions de solidarité ou de sensibilisation.',
          },
          {
            label: 'Action Eau et Environnement',
            description:
              'Protéger l’environnement et favoriser l’accès à l’eau potable.',
          },
        ],
      },
    ],
    objectivesPeriod: '2025 - 2030',
    goals: [
      {
        title:
          'Réaliser chaque année au moins 3 projets d’impact durable, alignés sur les axes stratégiques du Rotary et impliquant au moins 50 % des membres.',
        actions: [
          'Élaboration d’un plan d’action pluriannuel avec indicateurs d’impact (année 1).',
          '1 projet en partenariat avec une fondation internationale tous les 2 ans.',
          'Organisation annuelle d’un projet orienté genre.',
        ],
      },
      {
        title:
          'Créer 2 projets phares reproductibles dans la région, avec un impact direct sur au moins 10 000 bénéficiaires cumulés en 5 ans.',
        actions: [
          'Formalisation de ces projets comme « modèles duplicables ».',
          'Publication d’un rapport d’impact annuel.',
        ],
      },
    ],
  },
  {
    slug: 'image-publique',
    name: 'Commission Image Publique',
    shortDescription:
      'Promouvoir les réalisations du club et renforcer la notoriété du Rotary.',
    intro:
      'Promouvoir les réalisations du Club et la notoriété du Rotary sont les objectifs de la Commission Image publique. Il faut d’abord nouer des contacts avec les journalistes locaux et les inviter à participer aux actions.',
    contact: {
      name: 'Augustin FACHEHOUN',
      role: 'Président de la Commission Image Publique',
      photo: 'https://i.postimg.cc/V6HyhMwV/PHOTO-2026-07-06-09-02-04-Copie.jpg',
      email: 'augustinfachehoun97@gmail.com',
      phone: '+229 01 54 05 36 60',
    },
    bulletGroups: [
      {
        title: 'Communiqué de presse',
        items: [
          'Clair et percutant',
          'Commençant par une bonne accroche',
          'Présentant l’essentiel du sujet (qui, quoi, où, quand et surtout pour quel bénéficiaire)',
          'Indiquant les coordonnées du porte-parole du Club',
          'Incluant des photos',
        ],
      },
    ],
    missionBlocks: [
      {
        title: 'Rayonnement',
        items: [
          {
            label: 'Réseaux sociaux',
            description:
              'Mettre à profit les réseaux sociaux (sites du Club et du District, Facebook, Instagram, YouTube…).',
          },
          {
            label: 'Collaboration interne',
            description:
              'Travailler étroitement avec le Comité et la commission Action pour accomplir sa mission.',
          },
        ],
      },
    ],
    closingNote:
      'Tous les membres participent à l’image publique du Club en portant leur insigne Rotarien et surtout en étant des Ambassadeurs du Rotary !',
    objectivesPeriod: '2025 - 2030',
    goals: [
      {
        title:
          'Accroître la visibilité du club sur les réseaux sociaux de 300 % d’ici juin 2030 (nombre d’abonnés, interactions, portée).',
        actions: [
          'Lancement d’un plan média annuel avec calendrier de contenu.',
          '2 publications par semaine sur les réseaux sociaux (Instagram / Facebook / LinkedIn).',
          'Création de formats vidéo valorisant les bénévoles et projets.',
        ],
      },
      {
        title:
          'Obtenir au moins 10 parutions annuelles dans les médias (TV, presse, radio, blogs) mettant en lumière les actions du club.',
        actions: [
          'Un attaché presse ou responsable média au sein de la commission.',
          'Rédaction et diffusion de communiqués de presse à chaque événement majeur.',
          'Développement de relations avec 5 médias partenaires.',
        ],
      },
    ],
  },
];

export function getPublicCommissionBySlug(slug: string) {
  return publicCommissions.find((commission) => commission.slug === slug);
}
