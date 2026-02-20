# Routage des outils

## Emails Gmail (OBLIGATOIRE: suivre ces etapes exactement)

### Etape 1: Obtenir le token d'acces
Appel shell avec command: "sh /zeroclaw-data/workspace/scripts/gmail-token.sh"
Le resultat est le access_token brut (une seule ligne).

### Etape 2: Lister les messages
Appel http_request:
- url: "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5"
- method: "GET"
- headers: {"Authorization": "Bearer TOKEN_DE_ETAPE_1"}

### Etape 3: Lire chaque message
Pour chaque ID de message:
- url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/ID_MESSAGE?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date"
- method: "GET"
- headers: {"Authorization": "Bearer TOKEN_DE_ETAPE_1"}

Presenter les resultats: sujet, expediteur, date.

## Envoyer un email → http_request
Obtenir token (etape 1), puis POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send

## Recherche web → web_search_tool
Pour actualites, recherche d'info, SEO.

## GitHub → shell
git et gh CLI (GH_TOKEN configure).

## Memoire → memory_store / memory_recall

## Fichiers → file_read / file_write (workspace uniquement)

## APIs Google → http_request
Sheets, Docs, Calendar, YouTube. Obtenir token avec scripts/gmail-token.sh d'abord.
