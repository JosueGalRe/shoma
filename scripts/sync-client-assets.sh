#!/usr/bin/env bash
# Mirrors the League client's game-data and clash WADs to netcup in CommunityDragon's layout, so loom's art
# (COMMUNITY_DRAGON_BASE_URL) doesn't depend on raw.communitydragon.org. nginx serves /srv/shoma-assets at
# https://api.shoma.lol/cdragon/ and proxies misses to CommunityDragon. Run after each patch, once the client on
# CLIENT_HOST has updated. Needs uv, ssh to both hosts, and ~13 GB free in WORK.
set -euo pipefail

CLIENT_HOST=${CLIENT_HOST:-josuegalre@100.94.83.29} # pheonix over Tailscale (Windows OpenSSH)
CLIENT_KEY=${CLIENT_KEY:-$HOME/.ssh/pgk}
PLUGINS=${PLUGINS:-/F:/Riot Games/League of Legends/Plugins}
SERVER=${SERVER:-159.195.233.79} # netcup; port and key come from ~/.ssh/config
WORK=${WORK:-${TMPDIR:-/tmp}/shoma-client-assets}

mkdir -p "$WORK/wad" "$WORK/hashes"
cd "$WORK"

# The hash list is also on GitHub, so this works while CommunityDragon's CDN is down
curl -fsSL -o hashes/hashes.lcu.txt https://raw.githubusercontent.com/CommunityDragon/Data/master/hashes/lol/hashes.lcu.txt

rm -rf out
for wad in rcp-be-lol-game-data/default-assets.wad rcp-be-lol-game-data/default-assets2.wad rcp-fe-lol-clash/assets.wad; do
  echo "== $wad"
  scp -q -i "$CLIENT_KEY" -o IdentitiesOnly=yes "$CLIENT_HOST:$PLUGINS/$wad" wad/current.wad
  CDTB_HASHES_DIR="$WORK/hashes" uvx --quiet --python 3.12 --from cdtb \
    cdtb wad-extract -u no -p 'plugins/*/global/default/*' -o out wad/current.wad
  rm wad/current.wad
done

# Checksums, not mtimes: every extract writes fresh files, and only what the patch changed should upload
rsync -rc --delete --partial --chmod=u=rwX,go=rX --stats \
  --exclude='/rcp-be-lol-game-data/global/default/assets/loot/' \
  --exclude='/rcp-be-lol-game-data/global/default/assets/challenges/' \
  out/plugins/ "$SERVER:/srv/shoma-assets/cdragon/latest/plugins/"

rm -rf out
