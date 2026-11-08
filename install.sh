#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  ASS — Instalador automático
#  curl -fsSL https://ass-project.github.io/ass-deploy/install.sh | bash
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

BASE_URL="https://ass-project.github.io/ass-deploy/packages"
INSTALL_DIR="/usr/local/bin"
BIN_NAME="ass"

# ── Colores ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}▶${RESET} $*"; }
ok()      { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
err()     { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

echo ""
echo -e "${BOLD}  ⚡ AASS — Server Service Installer${RESET}"
echo "  ─────────────────────────────────"
echo ""

# ── Detectar OS y arquitectura ────────────────────────────────────
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "${OS}" in
  linux)  OS_TAG="linux" ;;
  darwin) OS_TAG="darwin" ;;
  *) err "Sistema operativo no soportado: ${OS}. Descarga manualmente desde ${BASE_URL}" ;;
esac

case "${ARCH}" in
  x86_64|amd64)          ARCH_TAG="amd64" ;;
  aarch64|arm64|armv8*)  ARCH_TAG="arm64" ;;
  *) err "Arquitectura no soportada: ${ARCH}. Descarga manualmente desde ${BASE_URL}" ;;
esac

info "Plataforma detectada: ${OS_TAG}/${ARCH_TAG}"

# ── Obtener versión más reciente ──────────────────────────────────
info "Consultando versión más reciente..."
LATEST_URL="${BASE_URL}/latest.json"

if command -v curl &>/dev/null; then
  LATEST_JSON="$(curl -fsSL "${LATEST_URL}" 2>/dev/null || echo '{}')"
elif command -v wget &>/dev/null; then
  LATEST_JSON="$(wget -qO- "${LATEST_URL}" 2>/dev/null || echo '{}')"
else
  err "Se requiere curl o wget"
fi

VERSION="$(echo "${LATEST_JSON}" | grep '"version"' | sed 's/.*"\(.*\)".*/\1/' | head -1)"
VERSION="${VERSION:-0.1.0}"  # fallback

ok "Versión: ${VERSION}"

# ── URL del binario ───────────────────────────────────────────────
BIN_URL="${BASE_URL}/ss-${OS_TAG}-${ARCH_TAG}.bin"
TMP_FILE="$(mktemp /tmp/ss-XXXXXX)"

info "Descargando ${BIN_URL}..."

if command -v curl &>/dev/null; then
  curl -fsSL --progress-bar "${BIN_URL}" -o "${TMP_FILE}" || err "Error al descargar ${BIN_URL}"
elif command -v wget &>/dev/null; then
  wget -q --show-progress "${BIN_URL}" -O "${TMP_FILE}" || err "Error al descargar ${BIN_URL}"
fi

chmod +x "${TMP_FILE}"

# ── Verificar que el binario funciona ─────────────────────────────
if ! "${TMP_FILE}" --version &>/dev/null; then
  warn "No se pudo verificar la versión del binario descargado"
fi

# ── Instalar ──────────────────────────────────────────────────────
FINAL_PATH="${INSTALL_DIR}/${BIN_NAME}"

if [ -w "${INSTALL_DIR}" ]; then
  mv "${TMP_FILE}" "${FINAL_PATH}"
elif command -v sudo &>/dev/null; then
  info "Requiere permisos sudo para instalar en ${INSTALL_DIR}..."
  sudo mv "${TMP_FILE}" "${FINAL_PATH}"
else
  # Fallback: instalar en ~/.local/bin
  LOCAL_BIN="${HOME}/.local/bin"
  mkdir -p "${LOCAL_BIN}"
  mv "${TMP_FILE}" "${LOCAL_BIN}/${BIN_NAME}"
  FINAL_PATH="${LOCAL_BIN}/${BIN_NAME}"
  warn "Instalado en ${FINAL_PATH} (añade ~/.local/bin al PATH si no está)"
fi

rm -f "${TMP_FILE}" 2>/dev/null || true

echo ""
ok "${BOLD}ASS v${VERSION} instalado en ${FINAL_PATH}${RESET}"
echo ""
echo "  Comandos para empezar:"
echo -e "  ${BOLD}ss init${RESET}        — Genera ass.toml de ejemplo"
echo -e "  ${BOLD}ss validate${RESET}    — Valida la configuración"
echo -e "  ${BOLD}ss start${RESET}       — Inicia todos los servicios"
echo -e "  ${BOLD}ss info${RESET}        — Información del sistema"
echo ""
echo "  Documentación: https://ass-project.github.io/ass-deploy/"
echo ""
