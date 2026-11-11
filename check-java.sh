#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
task_root="$PWD"
BT="$task_root/tools/android-15"
ANDROID="$task_root/tools/android-35/android.jar"
for command_name in java zip; do command -v "$command_name" >/dev/null || { echo "Missing command: $command_name" >&2; exit 1; }; done
for path in "$BT/aapt2" "$BT/lib/d8.jar" "$ANDROID" tools/ecj.jar tools/ort.jar tools/tess.jar; do [ -f "$path" ] || { echo "Missing $path. Run python3 setup-tools.py" >&2; exit 1; }; done
[ -d app/src/com/reelkeep/app ] || { echo 'Extract the original source review ZIP into this same root first.' >&2; exit 1; }
rm -rf -- "$task_root/build/classes" "$task_root/build/dex" "$task_root/build/generated"
mkdir -p build/classes build/dex
"$BT/aapt2" compile --dir app/res -o build/resources.zip
"$BT/aapt2" link -o build/java-check-base.apk --manifest app/AndroidManifest.xml -I "$ANDROID" --java build/generated build/resources.zip
java -jar tools/ecj.jar -8 -proc:none -cp "$ANDROID:tools/ort.jar:tools/tess.jar" -d build/classes app/src/com/reelkeep/app/*.java build/generated/com/reelkeep/app/R.java
mapfile -d '' compiled_classes < <(find build/classes -name '*.class' -print0)
java -cp "$BT/lib/d8.jar" com.android.tools.r8.D8 --min-api 26 --lib "$ANDROID" --output build/dex tools/ort.jar tools/tess.jar "${compiled_classes[@]}"
echo 'Java + Android resources + DEX compilation passed. No signing key used.'
