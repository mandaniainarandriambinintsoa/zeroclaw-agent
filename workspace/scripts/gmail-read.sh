#!/bin/sh
# Read latest emails from Gmail using jq for reliable JSON parsing
# Usage: sh scripts/gmail-read.sh [count]
# Output: formatted email list (from, subject, date, snippet)

COUNT="${1:-5}"

# Step 1: Get access token
SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/gmail-token.sh" 2>&1)
TOKEN_EXIT=$?
if [ $TOKEN_EXIT -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "ERREUR TOKEN (exit=$TOKEN_EXIT): $TOKEN"
    exit 0
fi

# Step 2: List message IDs
LIST=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${COUNT}")

# Check for API error (show full error details)
API_ERROR_CODE=$(echo "$LIST" | jq -r '.error.code // empty' 2>/dev/null)
API_ERROR_MSG=$(echo "$LIST" | jq -r '.error.message // empty' 2>/dev/null)
API_ERROR_STATUS=$(echo "$LIST" | jq -r '.error.status // empty' 2>/dev/null)
if [ -n "$API_ERROR_CODE" ]; then
    echo "ERREUR API Gmail (code=$API_ERROR_CODE, status=$API_ERROR_STATUS): $API_ERROR_MSG"
    # Show error details for scope issues
    API_ERROR_DETAILS=$(echo "$LIST" | jq -r '.error.errors[]?.reason // empty' 2>/dev/null)
    if [ -n "$API_ERROR_DETAILS" ]; then
        echo "Raison: $API_ERROR_DETAILS"
    fi
    exit 0
fi

# Extract IDs
IDS=$(echo "$LIST" | jq -r '.messages[]?.id' 2>/dev/null)

if [ -z "$IDS" ]; then
    echo "Aucun email trouve. Reponse API brute (100 premiers chars):"
    echo "$LIST" | head -c 100
    exit 0
fi

# Step 3: Read each message and format output
INDEX=1
for MSG_ID in $IDS; do
    [ -z "$MSG_ID" ] && continue

    MSG=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/${MSG_ID}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date")

    SUBJECT=$(echo "$MSG" | jq -r '.payload.headers[] | select(.name=="Subject") | .value' 2>/dev/null | head -1)
    FROM=$(echo "$MSG" | jq -r '.payload.headers[] | select(.name=="From") | .value' 2>/dev/null | head -1)
    DATE=$(echo "$MSG" | jq -r '.payload.headers[] | select(.name=="Date") | .value' 2>/dev/null | head -1)
    SNIPPET=$(echo "$MSG" | jq -r '.snippet // empty' 2>/dev/null)

    [ -z "$SUBJECT" ] && SUBJECT="(sans sujet)"
    [ -z "$FROM" ] && FROM="(inconnu)"
    [ -z "$DATE" ] && DATE="(date inconnue)"

    echo "${INDEX}. De: ${FROM}"
    echo "   Sujet: ${SUBJECT}"
    echo "   Date: ${DATE}"
    if [ -n "$SNIPPET" ]; then
        echo "   Apercu: ${SNIPPET}"
    fi
    echo ""
    INDEX=$((INDEX + 1))
done

echo "Total: $((INDEX - 1)) email(s) affiches."
