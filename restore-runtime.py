#!/usr/bin/env python3
"""Restore runtime assets/libs from the known baseline APK, without changing Java."""
import argparse,hashlib,zipfile
from pathlib import Path
EXPECTED_SHA="f6846c6c99471397cc1c17c4d7ca6b34a6432ce110d47cee6b49080a8187fd13"
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('apk',type=Path);args=parser.parse_args()
    root=Path(__file__).resolve().parent
    if hashlib.sha256(args.apk.read_bytes()).hexdigest()!=EXPECTED_SHA:raise SystemExit('Expected original Reelkeep 1.23 APK. Hash mismatch; no files restored.')
    count=0
    with zipfile.ZipFile(args.apk) as z:
        for entry in z.infolist():
            name=entry.filename
            if entry.is_dir():continue
            if name.startswith('assets/'):relative=Path('app')/name
            elif name.startswith('lib/arm64-v8a/'):relative=Path('build/native')/name
            else:continue
            if '..' in relative.parts or relative.is_absolute():raise SystemExit('Unsafe archive path')
            target=root/relative;data=z.read(entry)
            if target.exists() and target.read_bytes()!=data:raise SystemExit('Existing file differs: '+str(relative)+'; use a clean source export before editing assets.')
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);count+=1
    if not (root/'app/assets/index.html').is_file() or not (root/'build/native/lib/arm64-v8a/libonnxruntime.so').is_file():raise SystemExit('Incomplete runtime assets')
    print('Restored',count,'runtime files. Java source files were not changed.')
if __name__=='__main__':main()
