#!/bin/sh
# Read latest emails from Gmail in one shot
# Usage: sh scripts/gmail-read.sh [count]
# Output: formatted email list (subject, from, date)

COUNT="${1:-5}"

# Step 1: Get access token
SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/gmail-token.sh")
if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "ERROR: failed to get access token" >&2
    exit 1
fi

# Step 2: List message IDs
LIST=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${COUNT}")

# Extract IDs (no jq dependency)
IDS=$(echo "$LIST" | grep -o '"id": *"[^"]*"' | sed 's/"id": *"//;s/"$//')

if [ -z "$IDS" ]; then
    echo "Aucun email trouve."
    exit 0
fi

# Step 3: Read each message
INDEX=1
echo "$IDS" | while read -r MSG_ID; do
    [ -z "$MSG_ID" ] && continue

    MSG=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/${MSG_ID}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date")

    SUBJECT=$(echo "$MSG" | grep -o '"Subject", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)
    FROM=$(echo "$MSG" | grep -o '"From", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)
    DATE=$(echo "$MSG" | grep -o '"Date", *"value": *"[^"]*"' | sed 's/.*"value": *"//;s/"$//' | head -1)

    echo "${INDEX}. De: ${FROM}"
    echo "   Sujet: ${SUBJECT}"
    echo "   Date: ${DATE}"
    echo ""
    INDEX=$((INDEX + 1))
done
