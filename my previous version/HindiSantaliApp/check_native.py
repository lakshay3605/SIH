"""
Download sentencepiece4j and check if it'll work on Android
(no native .so in it)
"""
import urllib.request, zipfile, io

url = "https://repo1.maven.org/maven2/io/github/eix128/sentencepiece4j/1.0.2/sentencepiece4j-1.0.2.jar"
data = urllib.request.urlopen(url).read()
print(f"Downloaded {len(data)} bytes")

with zipfile.ZipFile(io.BytesIO(data)) as z:
    has_native = any('.so' in f or '.dll' in f or '.dylib' in f for f in z.namelist())
    print(f"Has native libs: {has_native}")
    print("Classes:", [f for f in z.namelist() if f.endswith('.class')][:10])
