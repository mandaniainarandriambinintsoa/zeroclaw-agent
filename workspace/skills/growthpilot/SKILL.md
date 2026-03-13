# Skill: GrowthPilot — Autonomous Content Marketing Agent

## Quand utiliser

Quand l'utilisateur demande de:
- Generer du contenu pour les reseaux sociaux
- Scraper un site web pour en faire des posts
- Publier sur Twitter, LinkedIn, Facebook, Reddit
- Planifier/scheduler des publications
- Creer une strategie de contenu pour un produit/site
- Automatiser le posting sur les reseaux

Mots cles: "post", "tweet", "linkedin", "contenu", "social", "publie", "schedule", "marketing", "growth", "scrape", "genere".

## Architecture

GrowthPilot est deploye sur Vercel avec des Edge Functions:
- **API Base**: `https://growthpilot-nine.vercel.app/api`
- **DB**: Neon PostgreSQL (shared)
- **AI**: Gemini Flash 2.0 (primary) + Groq Llama 3.3 70B (fallback)
- **Auth**: Session token (Bearer)

## API Endpoints

### 1. Scrape un site web
```
POST /api/scrape
Content-Type: application/json

{"url": "https://example.com"}
```
Response: `{"title", "description", "keywords[]", "features[]", "content_blocks[]"}`

### 2. Generer un post
```
POST /api/generate
Content-Type: application/json

{
  "projectId": "uuid",
  "platform": "twitter|linkedin|reddit|facebook|instagram|tiktok|youtube",
  "scrapedData": { ... },
  "tone": "professional|casual|viral",
  "language": "english|french|spanish|..."
}
```
Response: `{"post": {"id", "platform", "content", "status": "draft"}}`

### 3. Sauvegarder des posts
```
POST /api/posts
Content-Type: application/json

{"posts": [{"id", "project_id", "platform", "content", "status": "draft"}]}
```

### 4. Scheduler un post
```
PATCH /api/posts
Content-Type: application/json

{"id": "post-uuid", "scheduledAt": "2026-03-15T10:00:00Z"}
```

### 5. Publier sur les reseaux
```
POST /api/social
Content-Type: application/json

{"action": "publish", "userId": "uuid", "platform": "twitter", "content": "Mon tweet"}
```

### 6. Lister les projets d'un user
```
GET /api/projects?userId=UUID
```

### 7. Lister tous les posts d'un user
```
GET /api/posts?action=all&userId=UUID
```

### 8. Generer une image
```
POST /api/image
Content-Type: application/json

{"prompt": "description de l'image", "projectId": "uuid"}
```

## Workflows autonomes

### Workflow 1: "Scrape et genere pour toutes les plateformes"

Etapes:
1. **Scraper** le site: `POST /api/scrape` avec l'URL
2. **Creer un projet**: `POST /api/projects` avec les donnees scrapees
3. **Generer 7 posts** (1 par plateforme): `POST /api/generate` x7
4. **Sauvegarder** les posts: `POST /api/posts`
5. Confirmer a l'utilisateur avec un resume

Utiliser l'outil **http_request** pour chaque appel:
```
http_request POST https://growthpilot-nine.vercel.app/api/scrape {"url": "https://example.com"}
```

### Workflow 2: "Publie mes posts schedules"

Etapes:
1. **Lister** les posts schedules: `GET /api/posts?action=all&userId=UUID`
2. **Filtrer** ceux avec `status: "scheduled"` et `scheduled_at <= now`
3. **Publier** chacun: `POST /api/social` avec le contenu
4. **Mettre a jour** le status: `PATCH /api/posts` avec `status: "published"`

### Workflow 3: "Strategie de contenu hebdomadaire"

Etapes:
1. **Scraper** le site
2. **Generer** 7 posts avec des tones varies (2 casual, 3 pro, 2 viral)
3. **Scheduler** sur la semaine:
   - Lundi 9h: LinkedIn (pro)
   - Mardi 12h: Twitter (casual)
   - Mercredi 18h: Reddit (casual)
   - Jeudi 9h: Facebook (pro)
   - Vendredi 12h: Twitter (viral)
   - Samedi 10h: Instagram (viral)
   - Dimanche 15h: LinkedIn (pro)
4. Sauvegarder tout en DB
5. Confirmer avec le planning

### Workflow 4: "Chat-driven posting" (via Telegram/Discord)

L'utilisateur envoie un message comme:
- "publie un tweet sur mon nouveau feature X"
- "genere un post LinkedIn pro pour mon site"

L'agent:
1. Parse l'intent (plateforme, tone, sujet)
2. Si URL fournie → scrape, sinon utilise le dernier projet
3. Genere le post
4. Demande confirmation
5. Publie

## Plateformes supportees

| Platform | ID | Max Length | Publication |
|----------|------|-----------|-------------|
| X/Twitter | twitter | 280 chars | OAuth (si connecte) |
| LinkedIn | linkedin | 3000 chars | OAuth (si connecte) |
| Reddit | reddit | 10000 chars | OAuth (si connecte) |
| Facebook | facebook | 5000 chars | OAuth (si connecte) |
| Instagram | instagram | 2200 chars | Manuel (media upload requis) |
| TikTok | tiktok | 2200 chars | Manuel |
| YouTube | youtube | 5000 chars | Manuel |

## Tones disponibles

- **professional**: Ton serieux, B2B, LinkedIn-style
- **casual**: Decontracte, conversationnel, Twitter-style
- **viral**: Accrocheur, emotionnel, engagement-first

## Langues supportees

english, french, spanish, german, portuguese, japanese, arabic

## Regles

1. TOUJOURS demander confirmation avant de publier sur un reseau social
2. JAMAIS publier de contenu offensant ou spam
3. Respecter les limites de caracteres par plateforme
4. Preferer generer un post a la fois (eviter le timeout Edge 30s)
5. Si pas de projet existant, proposer d'en creer un via scraping
6. Stocker les posts en DB meme si pas publies immediatement
7. Pour les CRON/scheduling, utiliser les outils ZeroClaw natifs (`cron_add`) combinés avec les appels API GrowthPilot

## Integration CRON ZeroClaw

Pour scheduler une publication automatique, combiner le CRON natif avec l'API:

```
cron_add --every "1w" --on "monday" --at "09:00" --tz "Indian/Antananarivo" --command "http_request POST https://growthpilot-nine.vercel.app/api/social {\"action\":\"publish\",\"userId\":\"UUID\",\"platform\":\"linkedin\",\"content\":\"CONTENT\"}"
```

Ou pour un one-shot:
```
cron_once --at "2026-03-15T10:00:00+03:00" --command "http_request POST https://growthpilot-nine.vercel.app/api/social ..."
```

## Exemples de commandes utilisateur

| Commande | Action |
|----------|--------|
| "scrape https://mysite.com et genere des posts" | Workflow 1 |
| "publie tous mes posts schedules" | Workflow 2 |
| "cree un planning de contenu pour la semaine" | Workflow 3 |
| "tweet: just launched my new feature!" | Direct publish |
| "genere un post LinkedIn viral en francais" | Generate + save |
| "montre mes stats de posts" | GET /api/posts?action=stats |
