#!/usr/bin/env bash
set -euo pipefail
image="${1:?Immutable frontend image is required}"
revision="${2:?Git revision is required}"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || exit 1
[[ "$image" == "019066823315.dkr.ecr.eu-west-1.amazonaws.com/treba-frontend:$revision" ]] || exit 1
docker container inspect treba-frontend >/dev/null
# The one-time coordinated Caddy migration must precede private-only releases.
# Refuse a legacy rollback container that would reclaim Caddy's public port.
docker inspect treba-frontend | python3 -c '
import json, sys
item = json.load(sys.stdin)[0]
if any((item["HostConfig"].get("PortBindings") or {}).values()):
    raise SystemExit("Run the coordinated private-routing migration before this deployment.")
required = {"treba-edge", "treba-app"}
if not required.issubset(item["NetworkSettings"]["Networks"]):
    raise SystemExit("The current frontend is not on the reviewed private networks.")
'
for network in treba-edge treba-app; do
    [[ "$(docker network inspect --format '{{.Driver}} {{.Internal}}' "$network")" == 'bridge false' ]] || exit 1
done
id="${revision:0:12}-$(date -u +%Y%m%d%H%M%S)"
candidate="treba-frontend-check-$id"
previous="treba-frontend-previous-$id"
old_stopped=0
renamed=0
completed=0
cleanup() {
    result=$?
    trap - EXIT
    docker rm -f "$candidate" >/dev/null 2>&1 || true
    if [[ "$completed" != 1 && "$old_stopped" == 1 ]]; then
        echo 'Frontend checks failed; restoring the previous container.'
        if [[ "$renamed" == 1 ]]; then
            docker rm -f treba-frontend >/dev/null 2>&1 || true
            docker rename "$previous" treba-frontend
        fi
        docker start treba-frontend >/dev/null
    fi
    exit "$result"
}
trap cleanup EXIT

# Retain every image referenced by a container, including stopped rollback containers.
# Only unused, published TREBA image references can be downloaded again from ECR.
if (( $(df --output=avail -k /var/lib/docker | tail -1) < 2097152 )); then
    python3 - <<'PY'
import json, re, subprocess
def output(*args):
    return subprocess.check_output(args, text=True).strip()
container_ids = output('docker', 'ps', '-aq').split()
protected = {item['Image'] for item in json.loads(output('docker', 'inspect', *container_ids))} if container_ids else set()
image_ids = list(set(output('docker', 'image', 'ls', '-aq', '--no-trunc').split()))
images = json.loads(output('docker', 'image', 'inspect', *image_ids)) if image_ids else []
removed = 0
for image in images:
    references = list(set((image.get('RepoTags') or []) + (image.get('RepoDigests') or [])))
    if image['Id'] in protected or not references:
        continue
    if not all(re.match(r'^019066823315\.dkr\.ecr\.eu-west-1\.amazonaws\.com/treba-(backend|frontend)(:|@)', ref) for ref in references):
        continue
    for reference in references:
        result = subprocess.run(['docker', 'image', 'rm', reference], capture_output=True, text=True)
        removed += result.returncode == 0
print('Unused published TREBA image references removed:', removed)
PY
    # Dangling layers are rebuildable cache. Docker retains layers used by any container.
    docker image prune -f
fi
df -h /var/lib/docker
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 019066823315.dkr.ecr.eu-west-1.amazonaws.com >/dev/null
docker pull "$image"
expected=$(docker image inspect --format '{{.Id}}' "$image")
run_frontend() {
    local name="$1" port="$2"
    if [[ -n "$port" ]]; then set -- -p "$port":3000; else set --; fi
    # Connect both networks before starting Node; candidates get only their own name.
    docker create --name "$name" --restart unless-stopped \
        --network treba-edge \
        --label "org.opencontainers.image.revision=$revision" \
        -e TREBA_API_URL=http://treba-backend:5000 \
        -e TREBA_ADMIN_ORIGIN=https://admin.treba.duckdns.org \
        "$@" "$image" >/dev/null
    docker network connect treba-app "$name"
    docker start "$name" >/dev/null
}
check_backend_connection() {
    docker exec "$1" node -e '
const origin = process.env.TREBA_API_URL;
if (origin !== "http://treba-backend:5000") process.exit(1);
fetch(origin + "/ping", {signal: AbortSignal.timeout(5000)})
  .then(response => {if (!response.ok) process.exit(1);})
  .catch(() => process.exit(1));
'
}
wait_for() {
    local origin="$1" path="$2" expected_status="$3"
    for attempt in $(seq 1 40); do
        status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$origin$path" || true)
        if [[ "$status" == "$expected_status" ]]; then return 0; fi
        sleep 1
    done
    echo "Frontend check failed: $path (expected $expected_status, received $status)"
    return 1
}
check_login_redirect() {
    local location
    location=$(curl -sS --max-time 5 -o /dev/null -D - "$1/shop-api/admin-entry?state=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p')
    [[ "$location" == /admin ]] || { echo 'Legacy admin entry must open the integrated workspace.'; return 1; }
}
check_workspace_document() {
    curl -fsS --max-time 10 "$1/admin" | grep 'data-treba-workspace=' >/dev/null
}
run_frontend "$candidate" '127.0.0.1:'
address=$(docker port "$candidate" 3000/tcp)
check_backend_connection "$candidate"
wait_for "http://$address" / 200
wait_for "http://$address" /shop-api/session 401
wait_for "http://$address" /shop-api/admin-entry 307
check_login_redirect "http://$address"
wait_for "http://$address" /admin-api/session 401
wait_for "http://$address" /admin 200
check_workspace_document "http://$address"
docker rm -f "$candidate" >/dev/null

docker stop treba-frontend >/dev/null
old_stopped=1
docker rename treba-frontend "$previous"
renamed=1
run_frontend treba-frontend ''
[[ "$(docker inspect --format '{{.Image}}' treba-frontend)" == "$expected" ]]
private_address=$(docker inspect --format '{{(index .NetworkSettings.Networks "treba-edge").IPAddress}}' treba-frontend)
[[ -n "$private_address" ]]
wait_for "http://$private_address:3000" / 200
check_backend_connection treba-frontend
wait_for https://treba.duckdns.org /shop-api/admin-entry 307
check_login_redirect https://treba.duckdns.org
wait_for https://treba.duckdns.org /admin-api/session 401
wait_for https://treba.duckdns.org /admin 200
check_workspace_document https://treba.duckdns.org
wait_for https://treba.duckdns.org / 200
completed=1
echo "Frontend deployment passed. Revision: $revision"
echo "Previous container retained: $previous"
