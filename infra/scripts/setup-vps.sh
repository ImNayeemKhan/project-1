#!/usr/bin/env bash
# =============================================================================
# ISP Platform — fresh Ubuntu VPS bootstrap.
# Tested on Ubuntu 22.04 and 24.04. Run ONCE as root on a brand-new server.
#
# Usage:
#   wget -qO- https://raw.githubusercontent.com/<you>/<repo>/main/infra/scripts/setup-vps.sh | bash
# or locally:
#   sudo bash infra/scripts/setup-vps.sh
# =============================================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (sudo)." >&2
  exit 1
fi

echo "==> Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban unattended-upgrades \
  git vim htop jq tmux \
  build-essential

echo "==> Configuring automatic security updates"
dpkg-reconfigure --priority=low unattended-upgrades || true

echo "==> Configuring UFW firewall (SSH, HTTP, HTTPS only)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Configuring Fail2Ban (SSH jail)"
cat >/etc/fail2ban/jail.d/isp-platform.conf <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port    = ssh
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> Creating 2 GiB swap if not present"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo "==> Installing Docker Engine"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

echo "==> Creating 'deploy' user (no root SSH for the app)"
if ! id -u deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  # Copy the existing root authorized_keys over so you can keep using your key.
  if [ -f /root/.ssh/authorized_keys ]; then
    mkdir -p /home/deploy/.ssh
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys
  fi
fi

echo "==> Hardening SSH"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd || true

echo "==> Done."
echo "    Next steps:"
echo "      1. SSH back in as deploy@<ip>"
echo "      2. git clone <your-repo> ~/isp-platform"
echo "      3. cd ~/isp-platform && cp apps/api/.env.example apps/api/.env && \$EDITOR apps/api/.env"
echo "      4. docker compose -f infra/docker-compose.yml up -d --build"
