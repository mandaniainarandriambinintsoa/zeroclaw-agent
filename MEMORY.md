# MEMORY — ZeroClaw (claw)

> Compte GitHub utilisé : `mandaniaina.randriambinintoa` (perso)
> Dernière mise à jour : 2026-02-20

---

## Etat du projet

ZeroClaw fork personnel **entièrement déployé et opérationnel** sur Render free tier (Frankfurt).
Agent accessible via Telegram, propulsé par Groq + Llama 3.1 8B (instant).

**URL service** : https://zeroclaw-agent.onrender.com
**Service ID Render** : `srv-d6bmdnggjchc73cdhcc0`

---

## Déploiement Render

| Élément | Valeur |
|---------|--------|
| Plan | Free |
| Région | Frankfurt (EU) |
| Runtime | Docker (`Dockerfile.render`) |
| Port | 3000 |
| Health check | `/health` |
| Auto-deploy | oui (sur push `main`) |
| Commande | `daemon` (gateway + channels + heartbeat) |

---

## Configuration actuelle (`config.toml`)

| Clé | Valeur |
|-----|--------|
| Provider | `groq` |
| Modèle par défaut | `llama-3.1-8b-instant` (30k TPM) |
| Fallback modèle | `llama-3.3-70b-versatile` → `llama3-8b-8192` |
| Gateway port | `3000`, `allow_public_bind = true` |
| Autonomy | `supervised`, `workspace_only = true` |
| Memory | SQLite, `auto_save = true` |
| Telegram | configuré, `allowed_users = ["8202028798"]` |

---

## Variables d'env Render (secrets)

| Variable | Rôle |
|----------|------|
| `GROQ_API_KEY` | Clé API Groq (définie dans dashboard Render) |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram (injecté via entrypoint.sh) |
| `ZEROCLAW_MODEL` | `llama-3.1-8b-instant` (override config.toml) |

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `config.toml` | Config principale embarquée dans l'image Docker |
| `Dockerfile.render` | Build multi-stage Rust → debian:trixie-slim, CMD=daemon |
| `entrypoint.sh` | Injecte `$TELEGRAM_BOT_TOKEN` dans config.toml au démarrage |
| `render.yaml` | Blueprint Render (env vars, plan, région) |
| `src/providers/mod.rs` | Fix URL Groq : `/openai/v1` (ligne ~1004) |
| `src/providers/compatible.rs` | Fix URL Groq + new_no_responses_fallback (ligne ~1614) |

---

## Commits (du plus récent au plus ancien)

| Hash | Description |
|------|-------------|
| `8ca2e01` | fix(config): switch to llama-3.1-8b-instant with 70B fallback |
| `0736c42` | fix(providers): correct Groq base URL to include /v1 path |
| `00b1e7c` | fix(deploy): use daemon command to start gateway + telegram channel |
| `a2212a6` | feat(telegram): add Telegram channel config with runtime token injection |
| `756db1d` | fix: add missing autonomy fields in config.toml |
| `35c4b0f` | fix: use debian:trixie-slim runtime for glibc 2.39 compat |
| `126abc4` | Remove upstream GitHub Actions workflows |
| `d5f0d6e` | Add Groq configuration and Render deployment files |

---

## Bugs résolus cette session

| Bug | Fix |
|-----|-----|
| Groq URL incorrecte (`/openai/chat/completions`) | Corrigée en `/openai/v1/chat/completions` |
| Fallback responses API sur Groq (404) | `new_no_responses_fallback` pour Groq |
| `CMD gateway` ne démarrait pas Telegram | Remplacé par `CMD daemon` |
| Rate limit Groq 70B (6k TPM) | Passage à `llama-3.1-8b-instant` (30k TPM) |

---

## Prochaine étape : Personnalisation de l'agent

**Problèmes observés en prod :**
- Répond en anglais par défaut
- Pas de persona/identité définie (ne connaît pas son nom, son rôle)
- Trop verbeux (réponses longues = plus de tokens = rate limit plus vite)

**Solution : fichiers bootstrap dans le workspace**

ZeroClaw charge ces fichiers depuis `/zeroclaw-data/workspace/` pour construire le system prompt :
- `AGENTS.md` — comportement, identité, langue
- `SOUL.md` — personnalité
- `USER.md` — préférences utilisateur
- `BOOTSTRAP.md` — fichier générique

**Plan d'action :**
1. Créer `workspace/AGENTS.md` localement avec :
   - Nom : `manda-zeroclaw`
   - Langue : toujours répondre en français
   - Identité : assistant personnel de Manda, instance ZeroClaw sur Render
   - Comportement : concis, tutoiement, direct
2. Ajouter dans `Dockerfile.render` : `COPY workspace/ /zeroclaw-data/workspace/`
3. Commit + push → rebuild automatique

**Statut : À FAIRE en priorité**

---

## Décisions prises

- Groq free tier (coût zéro) avec Llama
- Render free tier Frankfurt (proche Madagascar)
- Token Telegram jamais commité (injecté via env var + entrypoint.sh)
- `debian:trixie-slim` requis (glibc 2.39 compat avec rust:1.93-slim)
- Workflows CI upstream supprimés (fork perso)
- `.mcp.json` gitignored (contient clés API locales)
- `daemon` au lieu de `gateway` pour démarrer gateway + channels ensemble
