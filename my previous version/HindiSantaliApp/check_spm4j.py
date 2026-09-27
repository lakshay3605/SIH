import urllib.request, zipfile, io
data = urllib.request.urlopen('https://repo1.maven.org/maven2/io/github/eix128/sentencepiece4j/1.0.2/sentencepiece4j-1.0.2.jar').read()
with zipfile.ZipFile(io.BytesIO(data)) as z:
    for f in z.namelist():
        print(f)
