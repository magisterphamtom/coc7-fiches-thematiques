# État — CoC7 Fiches investigateur thématiques

Remplace le premier essai `coc7-fiche-2026` (jamais publié, déplacé dans Data/_to_delete).

## Fait (v1.0.0)
- Cinq thèmes repris des palettes de coc7-cartes-chat / tah-annees-20 ; classes `c7ft` + `c7ft-<thème>` posées sur la fiche V3 (hook `renderActorSheetV2`).
- Ordre de décision : flag `coc7-fiches-thematiques.theme` (fiche) > réglage monde selon l'époque (`flags.coc7-luck-tracker.era`, "modern" sinon 1933) ; valeur « chat » = thème effectif de coc7-cartes-chat.
- Bouton Gardien « Thème de la fiche… » (DialogV2) dans le menu de la fenêtre.
- CSS : chaque thème définit des variables --ft-*, branchées sur les variables CoC7 (couleurs, polices, rubans, cadre photo, ornements) ; bandeaux et pieds SVG par thème.
- Vérifié sur maquette (gabarits CoC7 8.16 + system.css), pas encore dans Foundry.

## À tester (Foundry 14.368, CoC7 8.16)
- Fiche 1933 et fiche 2026 ouvertes côte à côte ; changement d'époque fiche ouverte.
- Les cinq thèmes via le bouton du Gardien ; « comme le chat » puis changer le thème du chat.
- Tous les onglets (Combat, Possessions, Historique, Développement, Gardien), fenêtres d'édition.
- Thème clair et sombre de Foundry ; côté joueur.

## Points incertains
- Règles CoC7 très spécifiques qui garderaient leur couleur : corriger au cas par cas.
- Poiret One (New York 20) épaissie par -webkit-text-stroke : vérifier le rendu réel.
