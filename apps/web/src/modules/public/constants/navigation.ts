export const publicNavLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/le-club', label: 'Le Club' },
  { to: '/nos-actions', label: 'Nos actions' },
  { to: '/nos-actualites', label: 'Nos actualités' },
  { to: '/nos-reunions', label: 'Nos réunions' },
  { to: '/bibliotheque', label: 'Bibliothèque' },
  { to: '/nous-rejoindre', label: 'Nous rejoindre' },
] as const;

export const footerLinkGroups = [
  {
    title: 'Découvrir',
    links: [
      { to: '/', label: 'Accueil' },
      { to: '/le-club', label: 'Le Club' },
      { to: '/nos-actions', label: 'Nos actions' },
    ],
  },
  {
    title: 'Vie du club',
    links: [
      { to: '/nos-actualites', label: 'Actualités' },
      { to: '/nos-reunions', label: 'Réunions' },
      { to: '/bibliotheque', label: 'Bibliothèque' },
    ],
  },
] as const;
