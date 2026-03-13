# Skill: GrowthPilot — Content Marketing

## Quand utiliser

Quand l'utilisateur mentionne: post, tweet, linkedin, contenu, social, publie, marketing, growth, scrape, genere.

## API Base

`https://growthpilot-nine.vercel.app/api`

## Commandes disponibles

### Scraper un site
```
http_request POST https://growthpilot-nine.vercel.app/api/scrape
Body: {"url": "https://example.com"}
```
Retourne: title, description, keywords, features.

### Generer un post
```
http_request POST https://growthpilot-nine.vercel.app/api/generate
Body: {
  "projectId": "temp-001",
  "platform": "twitter",
  "scrapedData": { "title": "...", "description": "...", "keywords": [...], "features": [...] },
  "tone": "casual",
  "language": "french"
}
```
Platforms: twitter, linkedin, reddit, facebook, instagram, tiktok, youtube.
Tones: professional, casual, viral.

### Lister les posts
```
http_request GET https://growthpilot-nine.vercel.app/api/posts?action=all&userId=USER_ID
```

## Regles importantes

1. Faire UNE action a la fois, pas tout en parallele
2. Apres chaque appel API, montrer le resultat a l'utilisateur et attendre
3. Si un appel echoue, dire l'erreur et STOP — ne pas retry en boucle
4. Toujours montrer le contenu genere a l'utilisateur
5. Ne JAMAIS publier sans confirmation explicite

## Exemple simple

Utilisateur: "genere un tweet pour https://mysite.com"

Etapes:
1. Appeler scrape avec l'URL
2. Montrer le resume du scraping
3. Appeler generate avec platform=twitter et les donnees scrapees
4. Montrer le tweet genere
5. STOP — attendre la prochaine instruction
