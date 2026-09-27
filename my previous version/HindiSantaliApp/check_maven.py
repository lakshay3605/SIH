import urllib.request, json
data = json.loads(urllib.request.urlopen('https://search.maven.org/solrsearch/select?q=a:sentencepiece&rows=50&wt=json').read())
print('\n'.join([f"{doc['g']}:{doc['a']}:{doc['latestVersion']}" for doc in data['response']['docs']]))
