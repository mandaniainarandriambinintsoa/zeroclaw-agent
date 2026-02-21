#!/bin/sh
# Read latest emails from Gmail in one shot
# Usage: sh scripts/gmail-read.sh [count]
# Output: formatted email list (subject, from, date)
# All output goes to stdout so the bot can see it

COUNT="${1:-5}"

# Step 1: Get access token
SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/gmail-token.sh" 2>&1)
if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "ERREUR: impossible d'obtenir le token Gmail. Detail: $TOKEN"
    exit 0
fi

# Step 2: List message IDs
LIST=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${COUNT}")

# Check for API error
API_ERROR=$(echo "$LIST" | grep -o '"message": *"[^"]*"' | head -1 | sed 's/"message": *"//;s/"$//')
if [ -n "$API_ERROR" ]; then
    echo "ERREUR API Gmail: $API_ERROR"
    exit 0
fi

# Extract IDs
IDS=$(echo "$LIST" | grep -o '"id": *"[^"]*"' | sed 's/"id": *"//;s/"$//')

if [ -z "$IDS" ]; then
    echo "Aucun email trouve dans la boite de reception."
    exit 0
fi

# Step 3: Read each message and format output
INDEX=1
for MSG_ID in $IDS; do
    [ -z "$MSG_ID" ] && continue

    MSG=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/${MSG_ID}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date")

    SUBJECT=$(echo "$MSG" | grep -o '"Subject", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)
    FROM=$(echo "$MSG" | grep -o '"From", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)
    DATE=$(echo "$MSG" | grep -o '"Date", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)

    [ -z "$SUBJECT" ] && SUBJECT="(sans sujet)"
    [ -z "$FROM" ] && FROM="(inconnu)"
    [ -z "$DATE" ] && DATE="(date inconnue)"

    echo "${INDEX}. De: ${FROM}"
    echo "   Sujet: ${SUBJECT}"
    echo "   Date: ${DATE}"
    echo ""
    INDEX=$((INDEX + 1))
done

echo "Total: $((INDEX - 1)) email(s) affiches."
