import urllib.request, zipfile, io

data = urllib.request.urlopen('https://repo1.maven.org/maven2/io/github/eix128/sentencepiece4j/1.0.2/sentencepiece4j-1.0.2-sources.jar').read()
with zipfile.ZipFile(io.BytesIO(data)) as z:
    for name in ['com/sentencepiece/Model.java', 'com/sentencepiece/SentencePieceProcessor.java']:
        print(f"\n=== {name} ===")
        print(z.read(name).decode('utf-8')[:3000])
