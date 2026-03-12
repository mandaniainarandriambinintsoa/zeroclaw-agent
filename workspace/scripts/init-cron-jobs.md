# Cron Jobs ZeroClaw - A ajouter via Telegram

Envoie ces commandes a ZeroClaw sur Telegram pour creer les cron jobs :

## 1. Morning Briefing (tous les jours a 5h UTC = 8h UTC+3)
```
Ajoute un cron job nomme "morning_briefing" avec l'expression "0 5 * * *" et le prompt : "Fais un briefing complet: 1) Emails non lus avec gmail_read, 2) Issues GitHub ouvertes sur mes repos avec shell gh, 3) Rappels du jour depuis memory_recall. Envoie le resume structure sur Telegram."
```

## 2. Email Check (toutes les 2h)
```
Ajoute un cron job nomme "email_check" avec l'expression "0 */2 * * *" et le prompt : "Verifie les emails non lus avec gmail_read. Si un email contient les mots urgent, ASAP, deadline, critical ou important, alerte immediatement sur Telegram avec le sujet et l'expediteur."
```

## 3. GitHub Monitor (toutes les 4h)
```
Ajoute un cron job nomme "github_monitor" avec l'expression "0 */4 * * *" et le prompt : "Verifie les issues et PRs ouvertes sur mes repos GitHub avec shell gh. Resume les nouvelles activites sur Telegram."
```
