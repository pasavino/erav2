#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${DEBUG:-0}" -eq 1 ]] && set -x

APP_NAME=${APP_NAME:-ERA}
BUILD_TYPE=${1:-release}

ANDROID_DIR="android"
DIST_DIR="dist"
BUILD_GRADLE="${ANDROID_DIR}/app/build.gradle"

KEY_ALIAS=${KEY_ALIAS:-era}
KEYSTORE_PATH="${ANDROID_DIR}/app/era.keystore"
KEYSTORE_PROPS="${ANDROID_DIR}/keystore.properties"

export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"

log(){ echo -e "\033[1;34m[INFO]\033[0m $*"; }
err(){ echo -e "\033[1;31m[ERR]\033[0m  $*" >&2; }

trap 'err "Fallo en línea $LINENO"' ERR

mkdir -p "$DIST_DIR"

# ---------------------------------------------------------
# 1) Generar nativos solamente si no existe /android
# ---------------------------------------------------------
if [[ ! -d "$ANDROID_DIR" ]]; then
  log "Generando proyecto Android..."
  npx expo prebuild --platform android --clean
fi

# ---------------------------------------------------------
# 2) Incrementar versión
# ---------------------------------------------------------
if [[ ! -f "$BUILD_GRADLE" ]]; then
  err "No encontré $BUILD_GRADLE"
  exit 1
fi

CURRENT_CODE=$(
  grep -m1 -E '^[[:space:]]*versionCode[[:space:]]+[0-9]+' "$BUILD_GRADLE" \
  | grep -oE '[0-9]+'
)

CURRENT_NAME=$(
  grep -m1 -E '^[[:space:]]*versionName[[:space:]]+"[^"]+"' "$BUILD_GRADLE" \
  | sed -E 's/.*versionName[[:space:]]+"([^"]+)".*/\1/'
)

if [[ -z "${CURRENT_CODE:-}" || -z "${CURRENT_NAME:-}" ]]; then
  err "No pude obtener versionCode o versionName"
  exit 1
fi

# Google Play exige que versionCode siempre aumente
NEW_CODE=$((CURRENT_CODE + 1))

# versionName: incrementar solamente el último número
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$CURRENT_NAME"

V_MAJOR=${V_MAJOR:-1}
V_MINOR=${V_MINOR:-0}
V_PATCH=${V_PATCH:-0}

NEW_PATCH=$((V_PATCH + 1))
NEW_NAME="${V_MAJOR}.${V_MINOR}.${NEW_PATCH}"

log "Versión:"
log "versionCode: $CURRENT_CODE -> $NEW_CODE"
log "versionName: $CURRENT_NAME -> $NEW_NAME"

sed -i -E \
  "s/^([[:space:]]*)versionCode[[:space:]]+[0-9]+/\1versionCode ${NEW_CODE}/" \
  "$BUILD_GRADLE"

sed -i -E \
  "s/^([[:space:]]*)versionName[[:space:]]+\"[^\"]+\"/\1versionName \"${NEW_NAME}\"/" \
  "$BUILD_GRADLE"

# ---------------------------------------------------------
# 3) SDK Android
# ---------------------------------------------------------
if command -v sdkmanager >/dev/null 2>&1; then

  log "Aceptando licencias + verificando SDK..."

  yes | sdkmanager \
    --licenses \
    --sdk_root="$ANDROID_SDK_ROOT" || true

  sdkmanager \
    --sdk_root="$ANDROID_SDK_ROOT" \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" || true

else

  log "sdkmanager no encontrado; sigo (asumo SDK instalado)."

fi

# ---------------------------------------------------------
# 4) Keystore
# ---------------------------------------------------------
if [[ ! -f "$KEYSTORE_PATH" ]]; then

  log "Creando keystore..."

  read -s -p "Keystore password: " STORE_PW
  echo

  keytool -genkeypair -v \
    -storetype JKS \
    -keystore "$KEYSTORE_PATH" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias "$KEY_ALIAS" \
    -storepass "$STORE_PW" \
    -keypass "$STORE_PW" \
    -dname "CN=ERA,O=ERA,L=,ST=,C=NG"

  cat > "$KEYSTORE_PROPS" <<EOF
storePassword=$STORE_PW
keyPassword=$STORE_PW
keyAlias=$KEY_ALIAS
storeFile=app/$(basename "$KEYSTORE_PATH")
EOF

fi

# ---------------------------------------------------------
# 5) Compilar AAB
# ---------------------------------------------------------
pushd "$ANDROID_DIR" >/dev/null

chmod +x ./gradlew || true

log "Compilando AAB release..."

NODE_ENV=production ./gradlew --no-daemon bundleRelease

popd >/dev/null

# ---------------------------------------------------------
# 6) Buscar AAB generado
# ---------------------------------------------------------
AAB_FILE="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

if [[ ! -f "$AAB_FILE" ]]; then
  err "No encontré el AAB generado."
  exit 2
fi

# ---------------------------------------------------------
# 7) Copiar a /dist
# ---------------------------------------------------------
STAMP=$(date +%Y%m%d-%H%M)

OUT="$DIST_DIR/${APP_NAME}-${NEW_NAME}-code${NEW_CODE}-${STAMP}.aab"

cp -f "$AAB_FILE" "$OUT"

log "✅ AAB listo:"
log "$OUT"
log ""
log "✅ versionName: $NEW_NAME"
log "✅ versionCode: $NEW_CODE"