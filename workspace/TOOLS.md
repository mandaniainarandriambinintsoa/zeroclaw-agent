# Routage des outils

## Emails Gmail

TOUTES les operations Gmail utilisent UN SEUL appel shell. Ne JAMAIS utiliser http_request pour Gmail.

### Lire les emails (1 seule commande)
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-read.sh 5"}
```
Le nombre a la fin est le nombre d'emails a lire (3, 5, 10...).
Le script affiche directement: expediteur, sujet, date. Presente le resultat tel quel.

### Envoyer un email (1 seule commande)
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-send.sh 'destinataire@email.com' 'Sujet du mail' 'Contenu du message'"}
```

### Creer un brouillon (1 seule commande)
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-draft.sh 'destinataire@email.com' 'Sujet du mail' 'Contenu du message'"}
```

## GitHub (utiliser outil "shell" avec gh CLI)

L'authentification est deja configuree. Exemples:

### Repos
- Lister: `{"command": "gh repo list"}`
- Creer: `{"command": "gh repo create nom-du-repo --public"}`
- Cloner: `{"command": "gh repo clone owner/repo"}`

### Pull Requests
- Lister: `{"command": "gh pr list"}`
- Voir une PR: `{"command": "gh pr view 123"}`
- Creer une PR: `{"command": "gh pr create --title 'Titre' --body 'Description'"}`
- Merge une PR: `{"command": "gh pr merge 123"}`
- Commenter: `{"command": "gh pr comment 123 --body 'Mon commentaire'"}`

### Issues
- Lister: `{"command": "gh issue list"}`
- Creer: `{"command": "gh issue create --title 'Titre' --body 'Description'"}`
- Commenter: `{"command": "gh issue comment 123 --body 'Mon commentaire'"}`

## Recherche web
Utiliser l'outil "web_search_tool" pour actualites, recherche d'info, SEO.

## Memoire
- Sauvegarder: outil "memory_store"
- Rappeler: outil "memory_recall"

## Fichiers
- Lire: outil "file_read" (workspace uniquement)
- Ecrire: outil "file_write" (workspace uniquement)

## APIs Google (Sheets, Docs, Calendar, YouTube)
Obtenir le token d'abord:
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-token.sh"}
```
Puis utiliser "http_request" avec le Bearer token.
