"""Reclaim recreatable frontend rollback copies when the deployment disk is low."""
import json
import re
import shutil
import subprocess

REGISTRY = "019066823315.dkr.ecr.eu-west-1.amazonaws.com/treba-frontend:"
NAME = re.compile(r"^/treba-frontend-previous-[0-9a-f]{12}-[0-9]{14}$")
IMAGE = re.compile(re.escape(REGISTRY) + r"([0-9a-f]{40})$")


def candidates(containers):
    rollbacks = sorted((c for c in containers if NAME.fullmatch(c.get("Name", ""))),
                       key=lambda c: c["Name"][-14:], reverse=True)
    # Always preserve the two newest rollback containers, even when they are ineligible.
    return [c for c in rollbacks[2:]
            if c.get("State", {}).get("Status") == "exited"
            and IMAGE.fullmatch(c.get("Config", {}).get("Image", ""))
            and not c.get("Mounts")]


def disposable_changes(changes):
    parents = {"/tmp", "/app", "/app/.next", "/app/.next/cache", "/root", "/root/.npm", "/root/.npm/_logs"}
    for line in changes.splitlines():
        if len(line) < 3 or line[0] not in "ACD":
            return False
        path = line[2:]
        if path in parents and line[0] == "C":
            continue
        if not any(path == prefix or path.startswith(prefix + "/")
                   for prefix in ("/tmp", "/app/.next/cache", "/root/.npm/_logs")):
            return False
    return True


def output(*args):
    return subprocess.check_output(args, text=True).strip()


def main():
    if shutil.disk_usage("/var/lib/docker").free >= 2 * 1024**3:
        print("Rollback cleanup: sufficient free space.")
        return
    ids = output("docker", "ps", "-aq").split()
    containers = json.loads(output("docker", "inspect", *ids)) if ids else []
    for container in candidates(containers):
        name = container["Name"].lstrip("/")
        revision = IMAGE.fullmatch(container["Config"]["Image"]).group(1)
        # Prove the exact immutable image can be downloaded again before discarding its container.
        remote = output("aws", "ecr", "batch-get-image", "--region", "eu-west-1",
                        "--repository-name", "treba-frontend", "--image-ids", "imageTag=" + revision,
                        "--query", "images[0].imageId.imageTag", "--output", "text")
        if remote != revision or not disposable_changes(output("docker", "diff", container["Id"])):
            print("Rollback retained (not safely recreatable):", name)
            continue
        # No force, no volume removal: a concurrently restarted copy is protected by Docker.
        subprocess.run(["docker", "container", "rm", container["Id"]], check=True, capture_output=True, text=True)
        print("Recreatable old frontend rollback removed:", name)
    print("Rollback cleanup complete; current containers, two newest rollbacks and all volumes retained.")


if __name__ == "__main__":
    main()
