# Routage des outils

## Emails Gmail

Tu as 3 outils Gmail dedies. Utilise-les DIRECTEMENT:

- **gmail_read** : lire les emails (parametre: count)
- **gmail_send** : envoyer un email (parametres: to, subject, body)
- **gmail_draft** : creer un brouillon (parametres: to, subject, body)

## GitHub

Appelle l'outil **shell** avec les commandes gh CLI. L'auth est deja configuree.

### Repos
- Lister: shell command = `gh repo list`
- Creer: shell command = `gh repo create nom-du-repo --public`

### Pull Requests
- Lister: shell command = `gh pr list`
- Creer: shell command = `gh pr create --title 'Titre' --body 'Description'`
- Voir: shell command = `gh pr view 123`
- Merger: shell command = `gh pr merge 123`

### Issues
- Lister: shell command = `gh issue list`
- Creer: shell command = `gh issue create --title 'Titre' --body 'Description'`

## Recherche web
Outil: **web_search_tool**

## Memoire
- Sauvegarder: outil **memory_store**
- Rappeler: outil **memory_recall**

## Fichiers
- Lire: outil **file_read** (workspace uniquement)
- Ecrire: outil **file_write** (workspace uniquement)

## Dev Workflow (delegation au PC local)

Quand l'utilisateur demande de developper/coder/fixer quelque chose dans un projet:

1. Lire le skill: `workspace/skills/dev-workflow/SKILL.md`
2. Creer une issue GitHub avec les labels `dev-task,pending` sur le bon repo
3. L'agent local sur le PC de Manda detecte et traite automatiquement

Projets configures:
- **factumation** / **factupro** → repo `mandaniainarandriambinintsoa/Factumation`

Commande type:
```
gh issue create --repo mandaniainarandriambinintsoa/Factumation --title "[dev-task] factumation: DESCRIPTION" --body "## Tache\nDETAILS" --label "dev-task,pending"
```

## APIs Google (Sheets, Docs, Calendar, YouTube)
Token: shell command = `sh /zeroclaw-data/workspace/scripts/gmail-token.sh`
Puis utiliser outil **http_request** avec le Bearer token.
