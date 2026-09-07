#!/usr/bin/env bash
# Store the GitHub token the in-app editor uses to open pull requests.
#
# Create the token first (fine-grained, this repo only):
#   https://github.com/settings/personal-access-tokens/new
#   Repository access: Only select repositories -> usapho-guide
#   Permissions: Contents = Read and write, Pull requests = Read and write
#
# Then run:  ./scripts/set-github-token.sh
# It prompts once, writes .env.local, and pushes the value to Vercel.

set -euo pipefail
cd "$(dirname "$0")/.."

REPO_SLUG="${GITHUB_REPO:-shlok-madhekar/usapho-guide}"

printf 'Paste the GitHub token (input hidden): '
read -rs TOKEN
printf '\n'

if [ -z "$TOKEN" ]; then
  echo "No token entered, nothing changed." >&2
  exit 1
fi

# Check it works and has the permissions we need before storing it anywhere.
code=$(curl -s -o /tmp/ghcheck.json -w '%{http_code}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO_SLUG")

if [ "$code" != "200" ]; then
  echo "Token cannot read $REPO_SLUG (HTTP $code). Check the repository access setting." >&2
  rm -f /tmp/ghcheck.json
  exit 1
fi

if ! grep -q '"push": *true' /tmp/ghcheck.json; then
  echo "Token reaches the repo but has no write access." >&2
  echo "Set Contents and Pull requests to 'Read and write', then rerun." >&2
  rm -f /tmp/ghcheck.json
  exit 1
fi
rm -f /tmp/ghcheck.json
echo "Token verified against $REPO_SLUG."

# local
touch .env.local
grep -v '^GITHUB_TOKEN=' .env.local > .env.local.tmp || true
grep -v '^GITHUB_REPO=' .env.local.tmp > .env.local.tmp2 || true
mv .env.local.tmp2 .env.local
rm -f .env.local.tmp
{
  echo "GITHUB_REPO=$REPO_SLUG"
  echo "GITHUB_TOKEN=$TOKEN"
} >> .env.local
echo "Wrote .env.local (gitignored)."

# vercel
if command -v vercel >/dev/null 2>&1; then
  printf '%s' "$TOKEN" | vercel env add GITHUB_TOKEN production --force >/dev/null 2>&1 \
    && echo "Added GITHUB_TOKEN to Vercel production." \
    || echo "Could not set the Vercel variable; add it manually with: vercel env add GITHUB_TOKEN production"
else
  echo "Vercel CLI not found. Add GITHUB_TOKEN in the Vercel dashboard."
fi

echo
echo "Next: vercel deploy --prod -y   (so production picks up the new variable)"
