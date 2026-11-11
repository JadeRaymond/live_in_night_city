#!/usr/bin/env python3
"""Restore the exact Linux x86_64 build tools. No third-party Python modules."""
import argparse, hashlib, json, platform, shutil, urllib.request, zipfile
from pathlib import Path

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''): h.update(block)
    return h.hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache',type=Path,help='Optional cache with the locked archive filenames')
    args=parser.parse_args()
    if platform.system()!='Linux' or platform.machine() not in ('x86_64','amd64'):
        raise SystemExit('Requires Linux x86_64, Python 3 and JDK 17+ (tested with JDK 21).')
    root=Path(__file__).resolve().parent
    cache=(args.cache or root/'.dependency-cache').resolve();cache.mkdir(parents=True,exist_ok=True)
    lock=json.loads((root/'tools/dependency-lock.json').read_text())
    for entry in lock:
        dest=cache/entry['name']
        if not dest.exists():
            print('Downloading',entry['name'],flush=True)
            partial=dest.with_suffix(dest.suffix+'.partial')
            request=urllib.request.Request(entry['url'],headers={'User-Agent':'Reelkeep-build-setup/1.0'})
            with urllib.request.urlopen(request,timeout=180) as response,partial.open('wb') as out:shutil.copyfileobj(response,out)
            if digest(partial)!=entry['sha256']:
                partial.unlink();raise SystemExit('SHA-256 mismatch: '+entry['name'])
            partial.replace(dest)
        if digest(dest)!=entry['sha256']:raise SystemExit('Invalid cached dependency: '+entry['name'])
        print('Verified',entry['name'],flush=True)
    def extract(archive,member,relative):
        target=root/relative;target.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(cache/archive) as z:target.write_bytes(z.read(member))
    members=['aapt2','zipalign','apksigner','lib/d8.jar','lib/apksigner.jar','lib64/libc++.so','NOTICE.txt','source.properties']
    for member in members:extract('build-tools.zip','android-15/'+member,'tools/android-15/'+member)
    extract('platform.zip','android-35/android.jar','tools/android-35/android.jar')
    (root/'tools/ecj.jar').write_bytes((cache/'ecj.jar').read_bytes())
    extract('ort.aar','classes.jar','tools/ort.jar');extract('tess.aar','classes.jar','tools/tess.jar')
    for member in ['aapt2','zipalign','apksigner']:(root/'tools/android-15'/member).chmod(0o755)
    expected={'tools/ort.jar':'c21c4b520c66dda4c8d6e17e7a64f2b38314a83f8a29ecfa60900f876b758752','tools/tess.jar':'5466930812c64924a3bbe02dcc7dbfa4c4ba19eed86dd2ae5ec2a666301ad1a1'}
    for relative,sha in expected.items():
        if digest(root/relative)!=sha:raise SystemExit('Extracted JAR mismatch: '+relative)
    print('Tools ready. Run: bash check-java.sh')
if __name__=='__main__':main()
