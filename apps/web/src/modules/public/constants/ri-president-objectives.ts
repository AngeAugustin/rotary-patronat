export interface RiStrategicAxis {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  objectives: string[];
  indicators: string[];
}

export const RI_PRESIDENT_OBJECTIVES_PATH = '/le-club/president-ri/objectifs';

export const riPresidentObjectives = {
  presidentName: 'Olayinka Hakeem BABALOLA',
  presidentTitle: 'Président du Rotary International',
  pageEyebrow: 'Rotary International',
  pageTitle: 'Objectifs stratégiques',
  pageDescription:
    'Les axes prioritaires du Président du Rotary International pour renforcer l’impact, la croissance et la gouvernance du mouvement.',
  axes: [
    {
      id: 'axe-1',
      number: 1,
      title: 'Santé mondiale',
      subtitle: 'Finaliser l’héritage Polio et préparer l’après',
      objectives: [
        'Maintenir la pression sur les derniers foyers endémiques (Pakistan, Afghanistan) via son expertise africaine.',
        'Lancer une task-force sur la transition des infrastructures PolioPlus vers la prévention des épidémies (choléra, fièvre jaune).',
      ],
      indicators: [
        'Zéro cas de poliovirus sauvage en 2027.',
        'Mise en place de 3 centres pilotes de surveillance épidémiologique en Afrique subsaharienne.',
      ],
    },
    {
      id: 'axe-2',
      number: 2,
      title: 'Croissance inclusive',
      subtitle: 'Dynamiser le recrutement et la diversité',
      objectives: [
        'Multiplier les « Junior Rotary » en s’appuyant sur ses racines Rotaract (1984) pour capter les 18-35 ans.',
        'Créer un fonds d’amorçage dédié à la création de nouveaux clubs dans les zones rurales d’Afrique et d’Asie du Sud-Est.',
        'Atteindre une parité genrée dans les postes de direction de district.',
      ],
      indicators: [
        'Hausse de 15 % du nombre de Rotaractiens transférés vers le Rotary.',
        'Création de 50 nouveaux clubs en zone africaine émergente.',
      ],
    },
    {
      id: 'axe-3',
      number: 3,
      title: 'Résilience organisationnelle',
      subtitle: 'Restaurer la confiance et moderniser la gouvernance',
      objectives: [
        'Digitaliser les processus du Conseil d’administration pour une transparence accrue (traçabilité des votes et des fonds).',
        'Instaurer des « Change Management Sessions » (sa spécialité) pour accompagner les gouverneurs de district face aux défis post-COVID et post-démission.',
        'Simplifier le système de subventions pour réduire les délais de déblocage des fonds d’urgence.',
      ],
      indicators: [
        'Mise en ligne d’un tableau de bord interactif des dépenses du RI.',
        'Réduction de 30 % du temps de traitement des subventions Disaster Response.',
      ],
    },
    {
      id: 'axe-4',
      number: 4,
      title: 'Rayonnement et plaidoyer',
      subtitle: 'Utiliser le leadership nigérian comme levier diplomatique',
      objectives: [
        'Plaider auprès de l’UA (Union Africaine) et de l’ONU pour intégrer le Rotary dans les plans de santé nationaux.',
        'Renforcer le partenariat avec ShelterBox en déployant des modules d’ingénierie rapide (eau/énergie) conçus par ses équipes de Riviera Technical Services.',
      ],
      indicators: [
        'Signature d’un protocole d’accord entre le Rotary et l’Union Africaine.',
        '100 % de coordination entre les équipes ShelterBox et les clubs locaux en cas de catastrophes majeures.',
      ],
    },
  ] satisfies RiStrategicAxis[],
} as const;
