"""Build original, reproducible listening clips and bilingual comparison tables.

Source notes come from the site's existing authored learning examples. The same
simple educational synthesizer, gain and 120 BPM are used for A and B. These are
software illustrations, not TD-3 recordings or exports of a visitor's patch.
Requires Python 3, Node and ffmpeg; no third-party Python packages.
"""
from pathlib import Path
import array, copy, html, json, math, re, subprocess, tempfile, wave

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/listening'
OUT.mkdir(parents=True, exist_ok=True)
examples = json.loads(subprocess.check_output(['node', '-e', "console.log(JSON.stringify(require('./learning-examples.20260928.js').examples))"], cwd=ROOT))
IDS = ['sparse-a', 'one-note', 'slide-tension', 'offbeat', 'accent-map']
TEXT = {
 'sparse-a': [('A: Original rhythm','B: Step 6 becomes a rest','Listen for the extra space before the octave jump. Only step 6 changes.'),('A: Orijinal ritim','B: 6. adım es oluyor','Oktav sıçramasından önce açılan boşluğu dinle. Yalnız 6. adım değişiyor.')],
 'one-note': [('A: Step 13 is C1','B: Step 13 is C2','Listen to the slide from C3: two octaves down in A, one octave down in B.'),('A: 13. adım C1','B: 13. adım C2','C3’ten kaymayı dinle: A’da iki, B’de bir oktav aşağı iner.')],
 'slide-tension': [('A: Slides off','B: Slides on','Steps 3 and 14 slide into the following G-sharp. Notes, accents and rhythm stay fixed.'),('A: Slide kapalı','B: Slide açık','3. ve 14. adımlar sonraki G# notasına kayar. Notalar, vurgular ve ritim sabittir.')],
 'offbeat': [('A: Entry on step 2','B: Entry on step 1','Moving the first D one step earlier puts it on the downbeat. Every later event stays fixed.'),('A: Giriş 2. adımda','B: Giriş 1. adımda','İlk D’yi bir adım öne almak onu güçlü vuruşa yerleştirir. Sonraki adımlar aynı kalır.')],
 'accent-map': [('A: Accents off','B: Accents on','Listen for the emphasis on steps 1, 5, 9 and 14. Both recordings use the same output gain.'),('A: Vurgular kapalı','B: Vurgular açık','1, 5, 9 ve 14. adımlardaki vurguyu dinle. İki kayıt aynı çıkış kazancını kullanır.')]
}
RATE, BPM, LOOPS = 22050, 120, 2
STEP = 60 / BPM / 4
PITCH = dict(zip(['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],range(12)))
def frequency(s): return 440 * 2 ** (((int(s['octave'])+1)*12+PITCH[s['note']]-69)/12)
def active(s): return bool(s['note']) and s['gate'] != '-'
def render(steps):
    result = array.array('h'); phase = 0.; low = 0.
    for n in range(round(RATE*(32*STEP+.25))):
        t=n/RATE; absolute=int(t/STEP); local=t-absolute*STEP
        s=steps[absolute%16]; previous=steps[(absolute-1)%16]; nxt=steps[(absolute+1)%16]
        if absolute>=32 or not active(s): sample=0.
        else:
            incoming=absolute>0 and active(previous) and 'S' in previous['accentSlide']
            outgoing=active(nxt) and 'S' in s['accentSlide']
            f=frequency(s)
            if incoming:
                f=frequency(previous)*(f/frequency(previous))**min(1,local/.075)
            phase=(phase+f/RATE)%1
            # Band-limited additive saw prevents high-frequency aliasing.
            saw=sum(math.sin(2*math.pi*phase*k)/k for k in range(1,13)) * .45
            accent='A' in s['accentSlide']; attack=min(1,local/.004) if not incoming else 1.
            gate=1. if outgoing else max(0,min(1,(STEP*.8-local)/.012))
            envelope=attack*gate*(.3+.7*math.exp(-local/0.095))
            cutoff=450+(1800 if accent else 950)*math.exp(-local/.06)
            coefficient=1-math.exp(-2*math.pi*cutoff/RATE)
            low += coefficient*(saw-low)
            sample=low*envelope*(.65 if accent else .42)
        result.append(round(max(-1,min(1,sample)) * 26000))
    return result

manifest={'bpm':BPM,'loops':LOOPS,'sampleRate':RATE,'kind':'original educational software synthesis','examples':{}}
for key in IDS:
    a=copy.deepcopy(examples[key]['steps']);b=copy.deepcopy(a)
    if key=='sparse-a': b[5]['note']='';b[5]['gate']='-'
    elif key=='one-note': b[12]['octave']='2'
    elif key=='slide-tension':
        for s in a: s['accentSlide']=s['accentSlide'].replace('S','')
    elif key=='offbeat': b[0],b[1]=b[1],b[0]
    elif key=='accent-map':
        for s in a:s['accentSlide']=s['accentSlide'].replace('A','')
    manifest['examples'][key]={'a':a,'b':b,'changed':[i+1 for i in range(16) if a[i]!=b[i]]}
    for variant,steps in [('a',a),('b',b)]:
        pcm=render(steps)
        assert max(abs(x) for x in pcm)>1000 and max(abs(x) for x in pcm)<32767
        with tempfile.NamedTemporaryFile(suffix='.wav') as f:
            with wave.open(f.name,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f.name,'-codec:a','libmp3lame','-b:a','64k','-map_metadata','-1',str(OUT/f'{key}-{variant}.mp3')],check=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

def block(key,tr):
    d=manifest['examples'][key];labels=TEXT[key][int(tr)];esc=html.escape
    heading='Dinleyerek karşılaştır' if tr else 'Hear the difference'
    players=''.join(f'<div class="ab-player"><label for="{key}-{v}">{esc(labels[i])}</label><audio id="{key}-{v}" data-comparison-audio controls preload="none" aria-label="{esc(labels[i])}" src="/assets/listening/{key}-{v}.mp3"><a href="/assets/listening/{key}-{v}.mp3">MP3</a></audio></div>' for i,v in enumerate(['a','b']))
    caption=('Değişen adımlar' if tr else 'Changed steps')+': '+', '.join(map(str,d['changed']))+'. '+('İşaretli hücreleri karşılaştır. A = accent, S = slide, — = es.' if tr else 'Compare the marked cells. A = accent, S = slide, — = rest.')
    rows=''
    for v in ['a','b']:
        cells=''
        for i,s in enumerate(d[v]):
            value=(s['note']+s['octave']+(' '+s['accentSlide'] if s['accentSlide'] else '')) if active(s) else '—'
            changed=i+1 in d['changed'];cells+=f'<td'+(' data-changed="true"' if changed else '')+'>'+esc(value)+(' *' if changed else '')+'</td>'
        rows+=f'<tr><th scope="row">{v.upper()}</th>{cells}</tr>'
    table=f'<div class="ab-table-wrap" tabindex="0" role="region" aria-label="{esc(heading)}"><table class="ab-table"><caption>{esc(caption)}</caption><thead><tr><th scope="col">{"Sürüm" if tr else "Version"}</th>'+''.join(f'<th scope="col">{i}</th>' for i in range(1,17))+f'</tr></thead><tbody>{rows}</tbody></table></div>'
    note=('120 BPM · 2 ölçü · Aynı synth ayarı. Eğitim için yazılımla üretilmiştir; TD-3 kaydı değildir. Aşağıdaki örnek yükleme bağlantısı yazıdaki orijinal pattern’i açar.' if tr else '120 BPM · 2 bars · Same synth settings. Software-generated teaching audio, not a TD-3 recording. The example-loading link opens the original pattern described in the article.')
    return f'<!-- comparison:{key} --><div class="ab-comparison"><h3>{heading}</h3><p>{esc(labels[2])}</p><div class="ab-players">{players}</div>{table}<p class="ab-note">{esc(note)}</p></div><!-- /comparison:{key} -->'

for path,tr in [('303-pattern-examples.html',False),('tr/303-pattern-ornekleri.html',True)]:
    p=ROOT/path;s=p.read_text()
    for key in IDS:
        s=re.sub(r'<!-- comparison:'+key+r' -->.*?<!-- /comparison:'+key+r' -->','',s,flags=re.S)
        pattern=r'(<p><a class="learning-open" data-learning-example="'+key+r'".*?</p>)'
        s=re.sub(pattern,lambda m:block(key,tr)+'\n'+m[1],s,count=1)
    if 'listening-comparisons.20261005.js' not in s:s=s.replace('</head>','<script defer src="/listening-comparisons.20261005.js"></script>\n</head>')
    s=s.replace('"dateModified":"2026-09-28"','"dateModified":"2026-10-05"').replace('<time datetime="2026-09-28">Updated 28 September 2026</time>','<time datetime="2026-10-05">Updated 5 October 2026</time>').replace('<time datetime="2026-09-28">Güncelleme: 28 Eylül 2026</time>','<time datetime="2026-10-05">Güncelleme: 5 Ekim 2026</time>')
    p.write_text(s)
print('Built 10 audio clips and 5 bilingual comparisons.')
