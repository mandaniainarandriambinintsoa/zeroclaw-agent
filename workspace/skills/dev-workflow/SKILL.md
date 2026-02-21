# Skill: Dev Workflow

## Quand utiliser

Quand l'utilisateur demande de:
- Developper une feature dans un projet
- Coder quelque chose dans un repo
- Ajouter/modifier/fixer du code dans un projet specifique

Mots cles: "developpe", "code", "ajoute", "implemente", "fixe", "corrige", "feature", "bug fix" + nom de projet.

## Projets disponibles

| Nom | Repo GitHub | Langage |
|-----|-------------|---------|
| factumation / factupro | mandaniainarandriambinintsoa/Factumation | TypeScript |

## Comment traiter la demande

### Etape 1: Identifier le projet et la tache

Extraire:
- **Projet**: quel projet parmi ceux disponibles
- **Tache**: description claire de ce qu'il faut faire

### Etape 2: Creer une issue GitHub

Utiliser l'outil **shell** avec cette commande exacte:

```
gh issue create \
  --repo mandaniainarandriambinintsoa/Factumation \
  --title "[dev-task] factumation: DESCRIPTION_COURTE" \
  --body "## Tache\nDESCRIPTION_DETAILLEE\n\n## Contexte\nCONTEXTE_ADDITIONNEL\n\n## Criteres\n- CRITERE_1\n- CRITERE_2" \
  --label "dev-task,pending"
```

Remplacer:
- `DESCRIPTION_COURTE`: titre court de la feature (max 60 chars)
- `DESCRIPTION_DETAILLEE`: explication complete de ce qu'il faut faire
- `CONTEXTE_ADDITIONNEL`: contexte technique si pertinent
- `CRITERE_1, CRITERE_2`: criteres d'acceptance

### Etape 3: Confirmer a l'utilisateur

Repondre avec:
```
Tache creee! L'agent local va la traiter automatiquement.
- Issue: [lien vers l'issue]
- Projet: [nom du projet]
- Statut: En attente de traitement

Tu recevras une notification quand la PR sera prete.
```

## Exemples

### Exemple 1: "ajoute export PDF dans factumation"

Commande:
```
gh issue create \
  --repo mandaniainarandriambinintsoa/Factumation \
  --title "[dev-task] factumation: export PDF des factures" \
  --body "## Tache\nAjouter une fonctionnalite d'export PDF pour les factures.\n\n## Contexte\nLes utilisateurs doivent pouvoir telecharger leurs factures en format PDF.\n\n## Criteres\n- Bouton export PDF sur la page facture\n- PDF genere avec toutes les infos de la facture\n- Telechargement automatique apres generation" \
  --label "dev-task,pending"
```

### Exemple 2: "fixe le bug de login dans factumation"

Commande:
```
gh issue create \
  --repo mandaniainarandriambinintsoa/Factumation \
  --title "[dev-task] factumation: fix bug login" \
  --body "## Tache\nCorriger le bug de login signale par l'utilisateur.\n\n## Contexte\nLe login ne fonctionne pas correctement.\n\n## Criteres\n- Login fonctionne sans erreur\n- Tests passes" \
  --label "dev-task,pending"
```

## Regles

1. TOUJOURS creer l'issue sur le bon repo (verifier le mapping projet → repo)
2. TOUJOURS mettre les labels `dev-task,pending`
3. TOUJOURS prefixer le titre avec `[dev-task] nom-projet:`
4. JAMAIS inclure de secrets ou tokens dans l'issue
5. Si le projet n'est pas dans la liste, dire a l'utilisateur qu'il n'est pas configure
