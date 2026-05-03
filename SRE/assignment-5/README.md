# Assignment 5 — Infrastructure as Code (Terraform + Ansible)

End-to-end IaC pipeline that provisions a Linux host with **Terraform** and configures
**nginx** on it with **Ansible**, demonstrating idempotent state reconciliation.

## Architecture

```
                          assignment-5/
                          ├── terraform/
                          │   ├── main.tf       (Docker provider — image + container)
                          │   └── Dockerfile    (Ubuntu 22.04 + python3 for Ansible)
                          └── ansible/
                              ├── ansible.cfg
                              ├── inventory.ini (community.docker.docker connection)
                              ├── playbook.yml  (apt install nginx, copy index.html)
                              └── files/index.html

   $ terraform apply           $ ansible-playbook playbook.yml
   ┌─────────────────────┐    ┌──────────────────────────────┐
   │  docker_image       │    │  refresh apt cache           │
   │  docker_container ──┼───▶│  apt install nginx           │
   │  (port 8088 → 80)   │    │  copy custom index.html      │
   └─────────────────────┘    │  start nginx (no systemd)    │
                              │  reload on changes (handler) │
                              └──────────────────────────────┘
```

The Terraform module provisions a Docker container running Ubuntu 22.04 with `python3`
pre-installed (so Ansible can run modules over the `community.docker.docker` connection
plugin without SSH). The container exposes port 80 on host port 8088. Ansible then
installs nginx, copies a custom `index.html`, and starts the service.

## Prerequisites

- Docker daemon running (Docker Desktop / OrbStack / Colima)
- `terraform >= 1.5`
- `ansible-core >= 2.13` with the `community.docker` collection (preinstalled with the
  full Ansible distribution; otherwise: `ansible-galaxy collection install community.docker`)

## Step 1 — Terraform: provision the host

```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

If your Docker socket isn't at the default `/var/run/docker.sock` (e.g. OrbStack on macOS
without the compatibility symlink), pass it explicitly:

```bash
DOCKER_HOST="unix:///Users/$USER/.orbstack/run/docker.sock" terraform apply -auto-approve
# or
terraform apply -auto-approve -var "docker_host=unix:///Users/$USER/.orbstack/run/docker.sock"
```

Outputs after a successful apply:

```
container_name = "iac-web-server"
container_id   = "<sha256...>"
web_url        = "http://localhost:8088"
```

## Step 2 — Ansible: configure the host

```bash
cd ../ansible
ansible-playbook playbook.yml
```

The playbook:
1. refreshes the apt cache
2. installs `nginx`
3. ensures `/var/www/html` exists
4. copies `files/index.html` to `/var/www/html/index.html` (notifies the reload handler on change)
5. starts nginx if it isn't already running (no systemd inside the container)
6. **handler:** reloads nginx whenever the deployed file changes

Verify:

```bash
curl http://localhost:8088
open  http://localhost:8088    # macOS
```

## Step 3 — Idempotency & state reconciliation

Run the playbook a second time without changes — every task should report `ok` and the
recap line should say `changed=0`. That proves the playbook is **idempotent**: no work
is performed when the system is already in the desired state.

```bash
ansible-playbook playbook.yml
# PLAY RECAP: iac-web-server : ok=6 changed=0 unreachable=0 failed=0 ...
```

Now edit `ansible/files/index.html` (e.g. change the `<h1>` line) and run the same
playbook:

```bash
ansible-playbook playbook.yml
# PLAY RECAP: iac-web-server : ok=7 changed=2 ...
#   - "Deploy custom index.html" → changed
#   - handler "Reload nginx"     → changed
curl http://localhost:8088   # served updated content
```

Only the two tasks that actually need to do work fire (file copy + nginx reload). Other
tasks remain `ok`. **State has been reconciled to match code.**

## Step 4 — Cleanup

```bash
cd ../terraform
terraform destroy -auto-approve
```

The container and the locally-built image are both removed (`keep_locally = false`).

```bash
docker ps --filter name=iac-web-server
docker images iac-web-base:1.0
# both empty
```

## Defense — talking points

### Terraform

- **Provider:** `kreuzwerker/docker` v3.x — declarative resource for Docker images and
  containers. We use it instead of a cloud provider so the lab works offline.
- **Resources:**
  - `docker_image.web_base` — builds a custom image from `terraform/Dockerfile`. The
    `triggers = { dockerfile_sha = filesha256(...) }` line forces Terraform to rebuild
    the image when the Dockerfile changes (otherwise Terraform would consider the
    resource unchanged because the `name` and `build` config look identical).
  - `docker_container.web_server` — spins up the container, maps port 80 → host 8088,
    sets `restart = "unless-stopped"` and a `managed-by=terraform` label.
- **Workflow:** `init → plan → apply → destroy`. `plan` shows the **expected diff**
  before any change is made — the foundation of the safety story for IaC.

### Ansible

- **Connection plugin:** `community.docker.docker` runs each module via `docker exec`,
  so we don't need SSH or a key inside the container.
- **Modules used (declarative, not imperative):**
  - `apt` — package manager state (`present`)
  - `file` — directory/permissions
  - `copy` — content + ownership + mode
  - `command` / `shell` — only where there is no Ansible module (starting nginx without
    systemd)
- **Handlers** decouple "did something change" from "reload the service" — the reload
  fires once at the end of the play, only if `notify` was triggered.

### Idempotency

- Ansible modules are **declarative**: they describe the *desired state* and only act
  when the current state differs. That's why the second run produces `changed=0`.
- The `copy` module compares the source's content hash with the destination's content
  hash; if equal, nothing is changed and the handler is *not* notified.
- Terraform achieves the same property by storing state in `terraform.tfstate` and
  computing a diff between desired (HCL) and observed (refresh).
- This solves the original problem: **configuration drift** — manual changes are
  reverted on the next `apply`/`ansible-playbook` run, and unintentional changes never
  go undetected.

## Files

| Path | Purpose |
|---|---|
| `terraform/main.tf` | Terraform configuration (provider, image, container, outputs) |
| `terraform/Dockerfile` | Ubuntu base image with Python 3 (Ansible target) |
| `ansible/ansible.cfg` | inventory + YAML output formatter |
| `ansible/inventory.ini` | one host: the Terraform-provisioned container |
| `ansible/playbook.yml` | install nginx, deploy site, reload on change |
| `ansible/files/index.html` | the page served by nginx |
