# Kit Cursor — Rotary Club Cotonou Le Nautile Patronat

Ce kit est volontairement éclaté en 4 couches distinctes, comme pour n'importe quel
agent IA sérieux : **Prompt**, **Context**, **Skills**, **Rules**. Chaque couche a un
rôle différent et un mode d'activation différent dans Cursor.

## Structure du kit

```
rotary-cursor-kit/
├── 00-README-INSTALLATION.md      ← vous êtes ici
├── 01-PROMPT-INIT.md              ← message d'amorçage (one-shot, Composer/Chat)
└── cursor-rules/                  ← à copier tel quel dans .cursor/rules/ du repo
    ├── 000-context.mdc            ← Contexte métier (toujours actif)
    ├── 010-persona-skills.mdc     ← Persona & compétences (toujours actif)
    ├── 020-design-system.mdc      ← DA/Design tokens (actif sur le frontend)
    ├── 030-frontend-rules.mdc     ← Règles de code React/PWA (actif sur apps/web)
    ├── 040-backend-rules.mdc      ← Règles de code NestJS (actif sur apps/api)
    └── 050-security-rules.mdc     ← Règles de sécurité (toujours actif)
```

## Pourquoi cette séparation ?

| Couche | Rôle | Fréquence d'usage | Où ça vit dans Cursor |
|---|---|---|---|
| **Prompt** | Amorcer une session : rôle, mission, méthode | Une fois (ou à chaque relance de sujet) | Collé dans le Chat/Composer |
| **Context** | Faits métier stables du projet (client, utilisateurs, périmètre) | En permanence, en arrière-plan | `.cursor/rules/000-context.mdc` (`alwaysApply: true`) |
| **Skills** | Profil d'expertise à incarner par l'IA (comment elle raisonne) | En permanence, en arrière-plan | `.cursor/rules/010-persona-skills.mdc` (`alwaysApply: true`) |
| **Rules** | Contraintes techniques opposables (code, design, sécurité) | Seulement quand on touche les fichiers concernés | `.cursor/rules/0*-*.mdc` avec `globs` ciblés |

L'intérêt concret des `globs` : quand vous éditez `apps/api/src/modules/projects/*.ts`,
Cursor charge automatiquement `040-backend-rules.mdc` et `050-security-rules.mdc`, mais
**pas** `020-design-system.mdc` — ce qui évite de diluer le contexte de l'IA avec des
règles non pertinentes pour la tâche en cours, et donne des réponses plus précises.

## Installation

1. Copiez le dossier `cursor-rules/` à la racine de votre repo sous le nom `.cursor/rules/`
   (dossier caché, c'est normal — c'est la convention Cursor).
2. Ouvrez Cursor sur le repo : les fichiers `.mdc` sont détectés automatiquement
   (visibles dans *Cursor Settings → Rules*).
3. Dans une nouvelle conversation Composer, collez le contenu de `01-PROMPT-INIT.md`
   pour lancer le projet.
4. Les règles context/skills/security s'appliqueront automatiquement à toutes les
   requêtes ; les règles frontend/backend/design s'activeront selon le fichier ouvert.

## Ordre de préséance en cas de conflit
`050-security-rules.mdc` > `040/030-*-rules.mdc` > `020-design-system.mdc` >
`010-persona-skills.mdc` > `000-context.mdc`. En clair : la sécurité prime toujours
sur le style ou la préférence de design.
