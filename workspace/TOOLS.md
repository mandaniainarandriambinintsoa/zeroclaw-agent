# Routage des outils

REGLE: pour Gmail et GitHub, tu DOIS appeler l'outil **shell** avec le parametre **command**. Ne decris jamais les scripts, execute-les.

## Emails Gmail

Appelle l'outil **shell** avec ces commandes. UN SEUL appel suffit pour chaque operation.

### Lire les emails
Outil: **shell**
command: `sh /zeroclaw-data/workspace/scripts/gmail-read.sh 5`
(remplace 5 par le nombre voulu: 3, 5, 10...)
Le script affiche expediteur, sujet, date. Presente le resultat tel quel a l'utilisateur.

### Envoyer un email
Outil: **shell**
command: `sh /zeroclaw-data/workspace/scripts/gmail-send.sh 'destinataire@email.com' 'Sujet' 'Contenu du message'`

### Creer un brouillon
Outil: **shell**
command: `sh /zeroclaw-data/workspace/scripts/gmail-draft.sh 'destinataire@email.com' 'Sujet' 'Contenu du message'`

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

## APIs Google (Sheets, Docs, Calendar, YouTube)
Token: shell command = `sh /zeroclaw-data/workspace/scripts/gmail-token.sh`
Puis utiliser outil **http_request** avec le Bearer token.
