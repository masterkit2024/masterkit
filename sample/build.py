import json
h=open('head.part').read(); fx=open('fx.part').read(); js=open('full.js').read()
cues=json.dumps(json.load(open('cues.json')),ensure_ascii=False)
open('full.html','w').write(h+fx+'\nwindow.__CUES='+cues+';\n'+js+'\n</script></body></html>\n')
