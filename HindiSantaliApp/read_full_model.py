import urllib.request, zipfile, io, sys

data = urllib.request.urlopen('https://repo1.maven.org/maven2/io/github/eix128/sentencepiece4j/1.0.2/sentencepiece4j-1.0.2-sources.jar').read()
with zipfile.ZipFile(io.BytesIO(data)) as z:
    # Read Model.java fully
    src = z.read('com/sentencepiece/Model.java').decode('utf-8', errors='replace')
    # Show all methods
    for line in src.split('\n'):
        if 'public' in line and ('static' in line or 'void' in line or 'List' in line or 'String' in line or 'Model' in line):
            print(line.strip())
