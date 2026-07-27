#!/usr/bin/env bash
# Removes the local /etc/hosts entries that route garnishmusicproduction.com
# (and its subdomains) plus garnishrealestate.com to 127.0.0.1. With these
# removed, the browser resolves those domains via real DNS again instead of
# hitting whatever's running locally. Local dev still works via *.localhost
# (see proxy.ts), which doesn't depend on these entries at all.
set -euo pipefail

HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/etc/hosts.bak.$(date +%Y%m%d%H%M%S)"

if [ "$(id -u)" -ne 0 ]; then
  echo "This script needs root to edit $HOSTS_FILE. Re-run with sudo:"
  echo "  sudo $0"
  exit 1
fi

echo "Backing up $HOSTS_FILE to $BACKUP_FILE"
cp "$HOSTS_FILE" "$BACKUP_FILE"

echo "Removing garnishmusicproduction.com / garnishrealestate.com entries..."
sed -i '/garnishmusicproduction\.com$/d; /garnishrealestate\.com$/d' "$HOSTS_FILE"

echo "Done. Remaining garnish-related entries (should be empty):"
grep -i garnish "$HOSTS_FILE" || echo "  (none)"

echo ""
echo "If your browser still shows the old page, clear its DNS cache or restart it."
