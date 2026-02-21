#!/bin/sh
# Create a draft email via Gmail API
# Usage: sh scripts/gmail-draft.sh "to@example.com" "Subject" "Body text"
# Output: draft ID on success, error on failure

if [ $# -lt 3 ]; then
    echo "ERREUR: usage: gmail-draft.sh TO SUBJECT BODY"
    exit 0
fi

TO="$1"
SUBJECT="$2"
BODY="$3"

# Get access token
SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/gmail-token.sh" 2>&1)
if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "ERREUR: impossible d'obtenir le token Gmail. Detail: $TOKEN"
    exit 0
fi

# Build RFC 2822 MIME message
MIME="To: ${TO}\r\nSubject: ${SUBJECT}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${BODY}"

# Base64url encode
RAW=$(printf '%b' "$MIME" | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Create draft via Gmail API
RESPONSE=$(curl -s -X POST \
    "https://gmail.googleapis.com/gmail/v1/users/me/drafts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"raw\": \"${RAW}\"}}")

# Check for error
ERROR=$(echo "$RESPONSE" | grep -o '"message": *"[^"]*"' | head -1 | sed 's/"message": *"//;s/"$//')
if [ -n "$ERROR" ]; then
    echo "ERREUR API Gmail: $ERROR"
    exit 0
fi

# Extract draft ID
DRAFT_ID=$(echo "$RESPONSE" | grep -o '"id": *"[^"]*"' | head -1 | sed 's/"id": *"//;s/"$//')
echo "Brouillon cree avec succes. Draft ID: $DRAFT_ID"
