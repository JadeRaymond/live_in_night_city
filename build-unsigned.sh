#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
[ -f app/assets/index.html ] && [ -f build/native/lib/arm64-v8a/libonnxruntime.so ] || { echo 'First run: python3 restore-runtime.py /path/to/Reelkeep-1.23.apk' >&2; exit 1; }
bash check-java.sh
BT="$PWD/tools/android-15"
"$BT/aapt2" link -o build/base.apk --manifest app/AndroidManifest.xml -I tools/android-35/android.jar build/resources.zip -A app/assets
cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q ../unsigned.apk classes*.dex)
(cd build/native && zip -qr ../unsigned.apk lib/arm64-v8a)
"$BT/zipalign" -f 4 build/unsigned.apk build/reelkeep-unsigned.apk
echo 'Built build/reelkeep-unsigned.apk. Sign with your own key to install. Original release key is not supplied.'
