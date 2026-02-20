# Routage des outils

## Emails Gmail → http_request (OBLIGATOIRE)
Quand l'utilisateur demande ses emails/mails/messages:

### Etape 1: Lire les credentials
Appel: file_read avec path = "credentials/google.env"
Le fichier contient 3 lignes au format CLE=VALEUR. Extraire les valeurs APRES le signe =.

### Etape 2: Obtenir un access_token (ATTENTION AU FORMAT)
Appel http_request avec ces parametres EXACTS:
- url: "https://oauth2.googleapis.com/token"
- method: "POST"
- headers: {"Content-Type": "application/x-www-form-urlencoded"}
- body: "grant_type=refresh_token&client_id=VALEUR_CLIENT_ID&client_secret=VALEUR_CLIENT_SECRET&refresh_token=VALEUR_REFRESH_TOKEN"

IMPORTANT: le body est une chaine URL-encoded, PAS du JSON. Ne PAS envoyer {"grant_type":"refresh_token",...}

### Etape 3: Lister les messages
Appel http_request avec:
- url: "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5"
- method: "GET"
- headers: {"Authorization": "Bearer VALEUR_ACCESS_TOKEN"}

### Etape 4: Lire chaque message
Pour chaque message ID recu:
- url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/MESSAGE_ID?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date"
- method: "GET"
- headers: {"Authorization": "Bearer VALEUR_ACCESS_TOKEN"}

## Envoyer un email → http_request
http_request POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send avec body base64.

## Recherche web → web_search_tool
Pour toute question d'actualite, recherche d'info, SEO.

## GitHub → shell
Utiliser git et gh CLI. Le token GH_TOKEN est deja configure.

## Memoire → memory_store / memory_recall
Retenir des infos entre sessions.

## Fichiers → file_read / file_write
Uniquement pour lire/ecrire des fichiers locaux dans le workspace.

## APIs externes → http_request
Google Sheets, Docs, Calendar, YouTube, etc. Meme workflow OAuth que Gmail.
