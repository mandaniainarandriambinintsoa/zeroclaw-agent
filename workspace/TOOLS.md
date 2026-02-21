# Routage des outils

## Emails Gmail (OBLIGATOIRE: suivre ces etapes exactement)

Tu DOIS suivre ces 3 etapes dans l'ordre. Ne JAMAIS sauter d'etape.

### Etape 1: Obtenir le token d'acces
Appel outil "shell" avec:
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-token.sh"}
```
Le resultat est le access_token brut (une seule ligne). Sauvegarde-le pour les etapes suivantes.

### Etape 2: Lister les messages
Appel outil "http_request" avec:
```json
{
  "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
  "method": "GET",
  "headers": {"Authorization": "Bearer ACCESS_TOKEN_ETAPE_1"}
}
```
Remplacer ACCESS_TOKEN_ETAPE_1 par le token obtenu a l'etape 1.

### Etape 3: Lire chaque message
Pour chaque ID de message obtenu a l'etape 2, appel "http_request":
```json
{
  "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages/MESSAGE_ID?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date",
  "method": "GET",
  "headers": {"Authorization": "Bearer ACCESS_TOKEN_ETAPE_1"}
}
```
Presenter les resultats: sujet, expediteur, date.

## Envoyer un email
Etape 1: obtenir token (meme commande shell ci-dessus).
Etape 2: appel "http_request" POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send avec le token Bearer.

## GitHub
Utiliser l'outil "shell" avec les commandes gh CLI. L'authentification est deja configuree.
Exemples:
- Lister les repos: `{"command": "gh repo list"}`
- Voir les issues: `{"command": "gh issue list"}`
- Creer un repo: `{"command": "gh repo create nom-du-repo --public"}`

## Recherche web
Utiliser l'outil "web_search_tool" pour actualites, recherche d'info, SEO.

## Memoire
- Sauvegarder: outil "memory_store"
- Rappeler: outil "memory_recall"

## Fichiers
- Lire: outil "file_read" (workspace uniquement)
- Ecrire: outil "file_write" (workspace uniquement)

## APIs Google (Sheets, Docs, Calendar, YouTube)
Utiliser http_request. Obtenir le token d'abord avec:
```json
{"command": "sh /zeroclaw-data/workspace/scripts/gmail-token.sh"}
```
