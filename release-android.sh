#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRADLE_FILE="$ROOT_DIR/android/app/build.gradle"
ANDROID_DIR="$ROOT_DIR/android"
SOURCE_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
RELEASES_DIR="$ROOT_DIR/releases"

if [[ ! -f "$GRADLE_FILE" ]]; then
    echo "ERROR: No se encontró:"
    echo "$GRADLE_FILE"
    exit 1
fi

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
    echo "ERROR: No se encontró gradlew o no tiene permisos."
    exit 1
fi

BACKUP_FILE="$(mktemp)"
cp "$GRADLE_FILE" "$BACKUP_FILE"

restore_version() {
    echo
    echo "ERROR: Falló la compilación."
    echo "Restaurando la versión anterior..."

    cp "$BACKUP_FILE" "$GRADLE_FILE"
    rm -f "$BACKUP_FILE"
}

trap restore_version ERR

VERSION_DATA="$(
    python3 - "$GRADLE_FILE" <<'PYTHON'
import re
import sys
from pathlib import Path

gradle_file = Path(sys.argv[1])
content = gradle_file.read_text(encoding="utf-8")

code_match = re.search(
    r"^\s*versionCode\s+(\d+)\s*$",
    content,
    re.MULTILINE
)

name_match = re.search(
    r"""^\s*versionName\s+["'](\d+)\.(\d+)\.(\d+)["']\s*$""",
    content,
    re.MULTILINE
)

if not code_match:
    raise SystemExit("ERROR: No se encontró versionCode.")

if not name_match:
    raise SystemExit(
        "ERROR: versionName debe tener formato X.Y.Z, por ejemplo 1.0.0."
    )

current_code = int(code_match.group(1))
major = int(name_match.group(1))
minor = int(name_match.group(2))
patch = int(name_match.group(3))

new_code = current_code + 1
new_name = f"{major}.{minor}.{patch + 1}"

print(f"{current_code}|{major}.{minor}.{patch}|{new_code}|{new_name}")
PYTHON
)"

IFS='|' read -r \
    CURRENT_VERSION_CODE \
    CURRENT_VERSION_NAME \
    NEW_VERSION_CODE \
    NEW_VERSION_NAME \
    <<< "$VERSION_DATA"

echo
echo "Versión actual: $CURRENT_VERSION_NAME ($CURRENT_VERSION_CODE)"
echo "Nueva versión:  $NEW_VERSION_NAME ($NEW_VERSION_CODE)"
echo

python3 - \
    "$GRADLE_FILE" \
    "$NEW_VERSION_CODE" \
    "$NEW_VERSION_NAME" <<'PYTHON'
import re
import sys
from pathlib import Path

gradle_file = Path(sys.argv[1])
new_code = sys.argv[2]
new_name = sys.argv[3]

content = gradle_file.read_text(encoding="utf-8")

content, code_changes = re.subn(
    r"^(\s*versionCode\s+)\d+(\s*)$",
    lambda match: f"{match.group(1)}{new_code}{match.group(2)}",
    content,
    count=1,
    flags=re.MULTILINE
)

content, name_changes = re.subn(
    r"""^(\s*versionName\s+)(["'])[^"']+\2(\s*)$""",
    lambda match: (
        f"{match.group(1)}"
        f"{match.group(2)}"
        f"{new_name}"
        f"{match.group(2)}"
        f"{match.group(3)}"
    ),
    content,
    count=1,
    flags=re.MULTILINE
)

if code_changes != 1:
    raise SystemExit("ERROR: No se pudo actualizar versionCode.")

if name_changes != 1:
    raise SystemExit("ERROR: No se pudo actualizar versionName.")

gradle_file.write_text(content, encoding="utf-8")
PYTHON

echo "Compilando Android App Bundle..."
echo

cd "$ANDROID_DIR"
./gradlew bundleRelease

if [[ ! -f "$SOURCE_AAB" ]]; then
    echo "ERROR: No se generó el archivo .aab."
    exit 1
fi

mkdir -p "$RELEASES_DIR"

DESTINATION_AAB="$RELEASES_DIR/erav2-${NEW_VERSION_NAME}-${NEW_VERSION_CODE}.aab"

cp "$SOURCE_AAB" "$DESTINATION_AAB"

rm -f "$BACKUP_FILE"
trap - ERR

echo
echo "========================================"
echo "COMPILACIÓN FINALIZADA"
echo "========================================"
echo
echo "Versión: $NEW_VERSION_NAME"
echo "Código:  $NEW_VERSION_CODE"
echo
echo "Archivo para Google Play:"
echo "$DESTINATION_AAB"
echo
ls -lh "$DESTINATION_AAB"