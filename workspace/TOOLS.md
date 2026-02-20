# Routage des outils

## Emails Gmail → http_request (OBLIGATOIRE)
Quand l'utilisateur demande ses emails/mails/messages:
1. file_read `credentials/google.env` → extraire CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
2. http_request POST `https://oauth2.googleapis.com/token` body: `grant_type=refresh_token&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&refresh_token=REFRESH_TOKEN` headers: `{"Content-Type":"application/x-www-form-urlencoded"}` → extraire access_token
3. http_request GET `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5` headers: `{"Authorization":"Bearer ACCESS_TOKEN"}` → liste des message IDs
4. Pour chaque message: http_request GET `https://gmail.googleapis.com/gmail/v1/users/me/messages/MESSAGE_ID` headers: `{"Authorization":"Bearer ACCESS_TOKEN"}`

## Envoyer un email → http_request
http_request POST `https://gmail.googleapis.com/gmail/v1/users/me/messages/send` avec body base64 encodé du message RFC 2822.

## Recherche web → web_search_tool
Pour toute question d'actualite, recherche d'info, SEO.

## GitHub → shell
Utiliser `git` et `gh` CLI. Le token GH_TOKEN est deja configure.

## Memoire → memory_store / memory_recall
Retenir des infos entre sessions. Toujours sauvegarder les preferences utilisateur.

## Fichiers → file_read / file_write
Uniquement pour lire/ecrire des fichiers locaux dans le workspace.

## APIs externes → http_request
Google Sheets, Google Docs, Google Calendar, YouTube, etc. Meme workflow OAuth que Gmail.
