# Reelkeep 1.23 — external build support

[Download build support ZIP](https://raw.githubusercontent.com/JadeRaymond/live_in_night_city/reelkeep-build-support-1.23/Reelkeep-1.23-build-support.zip)

[Original source review ZIP](https://raw.githubusercontent.com/JadeRaymond/live_in_night_city/reelkeep-source-review-1.23/Reelkeep-1.23-source-review.zip)

Extract both ZIPs into the same directory: both use the root folder `Reelkeep-source-review-1.23/`.

## Commands

Requires Linux x86_64, Python 3.9+, JDK 17+ (tested on 21), Bash and zip.

```sh
python3 setup-tools.py
bash check-java.sh
```

This installs pinned SDK/build tools, ECJ, ONNX and Tesseract Java APIs and compiles all Java, Android resources and DEX. Downloaded dependency hashes are verified. No key/password/session is supplied.

## Full APK with runtime resources

The previous review export intentionally excluded app/assets and native libraries. Tools alone cannot recreate them. Also supply the original Reelkeep 1.23 installer APK as a local file:

```sh
python3 restore-runtime.py /path/to/Reelkeep-1.23.apk
bash build-unsigned.sh
```

Runtime restoration verifies the known baseline APK hash and extracts only assets and ARM64 libraries. It does not overwrite edited Java or extract decompiled Java. Result: `build/reelkeep-unsigned.apk`.

For installation the reviewer must sign using their own key; their signature cannot update the installed production build. The production signing key remains private.

[Full Russian instructions](BUILD-TOOLS.md)

Verified in a separate clean source directory, using checksum-verified cached dependency archives: Java and DEX compilation, full unsigned APK packaging and ZIP CRC checks passed. A full new network download was not repeated.
