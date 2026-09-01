"""
Check the contents of the linux-arm64 sentencepiece JAR to see if we can use libsentencepiece.so
"""
import urllib.request, zipfile, io, os

def check_jar(url):
    print(f"Checking: {url}")
    try:
        data = urllib.request.urlopen(url).read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for f in z.namelist():
                print(f"  {f}")
    except Exception as e:
        print(f"  Error: {e}")

check_jar("https://repo1.maven.org/maven2/org/bytedeco/sentencepiece/0.2.0-1.5.11/sentencepiece-0.2.0-1.5.11-linux-arm64.jar")
