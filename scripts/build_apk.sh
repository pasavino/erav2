#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${DEBUG:-0}" -eq 1 ]] && set -x

APP_NAME=${APP_NAME:-ERA}
BUILD_TYPE=${1:-release}   # release | debug
ANDROID_DIR="android"
DIST_DIR="dist"
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

# 1) Generar nativos si falta /android
if [[ ! -d "$ANDROID_DIR" ]]; then
  log "expo prebuild --clean..."
  #npx expo prebuild --clean
  npx expo prebuild --platform android --clean
fi

# 2) SDK (no obligatorio). Si falla, no romper.
if command -v sdkmanager >/dev/null 2>&1; then
  log "Aceptando licencias + instalando SDK base..."
  yes | sdkmanager --licenses --sdk_root="$ANDROID_SDK_ROOT" || true
  sdkmanager --sdk_root="$ANDROID_SDK_ROOT" "platform-tools" "platforms;android-34" "build-tools;34.0.0" || true
else
  log "sdkmanager no encontrado; sigo (asumo SDK instalado)."
fi

# 3) Keystore (si no existe)
if [[ ! -f "$KEYSTORE_PATH" ]]; then
  log "Creando keystore..."
  read -s -p "Keystore password: " STORE_PW; echo
  keytool -genkeypair -v -storetype JKS \
    -keystore "$KEYSTORE_PATH" -keyalg RSA -keysize 2048 \
    -validity 10000 -alias "$KEY_ALIAS" \
    -storepass "$STORE_PW" -keypass "$STORE_PW" \
    -dname "CN=ERA,O=ERA,L=,ST=,C=NG"
  cat > "$KEYSTORE_PROPS" <<EOF
storePassword=$STORE_PW
keyPassword=$STORE_PW
keyAlias=$KEY_ALIAS
storeFile=app/$(basename "$KEYSTORE_PATH")
EOF
fi

# 4) Build
pushd "$ANDROID_DIR" >/dev/null
chmod +x ./gradlew || true
if [[ "$BUILD_TYPE" == "release" ]]; then
  log "Compilando APK release..."
  ./gradlew --no-daemon assembleRelease
  OUT_DIR="app/build/outputs/apk/release"
else
  log "Compilando APK debug..."
  ./gradlew --no-daemon assembleDebug
  OUT_DIR="app/build/outputs/apk/debug"
fi

APK_REL=$(ls -t "$OUT_DIR"/*.apk 2>/dev/null | head -n1 || true)
popd >/dev/null

[[ -n "${APK_REL:-}" && -f "$ANDROID_DIR/$APK_REL" ]] || { err "No encontré el APK. Revisá el log de Gradle."; exit 2; }

STAMP=$(date +%Y%m%d-%H%M)
OUT="$DIST_DIR/${APP_NAME}-${BUILD_TYPE}-${STAMP}.apk"
cp -f "$ANDROID_DIR/$APK_REL" "$OUT"
log "✅ APK listo: $OUT"
