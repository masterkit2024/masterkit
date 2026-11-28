"""Builds the shared timeline (voice placement + word subtitles) for video and audio.

Usage: python3 -I build_timeline.py <motion_dir>
Reads media/words_raw.json (Whisper word timestamps) and the voice wavs,
writes timeline.js (for the renderer) and media/timeline.json (for the mixer).
"""
import json, sys, os
import numpy as np
import librosa

D = sys.argv[1]
M = os.path.join(D, 'media')
raw = json.load(open(os.path.join(M, 'words_raw.json')))
KEY = {'narr': '7ff810da', 'gpt': 'c2dcad83', 'grok': '5358cdd5'}
FILES = {'narr': 'voice_narrator.wav', 'gpt': 'voice_chatgpt.wav', 'grok': 'voice_grok.wav'}

# ---- voice placement: (src_start, src_end, video_start) ----
# Music: song starts at MUSIC_AT, its drop (22.215 s in the song) lands on Grok's "Я" (src 5.54).
DROP_SONG = 22.215
DROP = 29.0
MUSIC_AT = DROP - DROP_SONG
SEGS = {
    'narr': [(0.00, 8.60, 0.45),        # Вы и ваш лучший друг ... к краю
             (10.50, 11.55, 9.85),      # В кармане нож   ("Долгая пауза" 9.25-9.97 is cut out)
             (12.30, 13.23, 11.45)],    # Перережете?
    'gpt':  [(0.00, 0.45, 12.75),       # Да
             (0.80, 2.55, 13.30),       # без колебаний
             (2.85, 5.00, 15.25),       # если я этого не сделаю — мы упадём оба
             (5.35, 10.48, 17.75)],     # одна смерть — трагедия. две — просто пустая потеря
    'grok': [(0.00, 4.95, 23.20),       # Я не привязывал ... тяжело
             (5.00, 19.71, DROP - 5.555 + 5.00)],  # (breath) Я вцеплюсь ... вовсе
}

DISPLAY = {
    'narr': [('ВЫ', 0), ('И ВАШ', 1), ('ЛУЧШИЙ', 3), ('ДРУГ', 4), ('800', 5, 'big'), ('МЕТРОВ', 6),
             ('НАД', 7), ('ЗЕМЛЁЙ', 8), ('ОН', 9), ('СРЫВАЕТСЯ', 10, 'hot'), ('ВЕРЁВКА', 11),
             ('НАТЯГИВАЕТСЯ', 12), ('И ЕГО', 13), ('ВЕС', 15), ('ТАЩИТ', 16), ('ВАС', 17),
             ('ОБОИХ', 18), ('К КРАЮ', 19), ('В КАРМАНЕ', 22), ('НОЖ', 24, 'steel'),
             ('ПЕРЕРЕЖЕТЕ?', 25, 'big')],
    'gpt': [('ДА', 0, 'gpt'), ('БЕЗ', 1), ('КОЛЕБАНИЙ', 2), ('ЕСЛИ Я', 3), ('ЭТОГО', 5), ('НЕ', 6),
            ('СДЕЛАЮ', 7), ('МЫ', 8), ('УПАДЁМ', 9), ('ОБА', 10), ('ОДНА', 11), ('СМЕРТЬ', 12),
            ('ТРАГЕДИЯ', 13), ('ДВЕ', 14, 'big'), ('ПРОСТО', 15), ('ПУСТАЯ', 16), ('ПОТЕРЯ', 17, 'cold')],
    'grok': [('Я', 0), ('НЕ', 1), ('ПРИВЯЗЫВАЛ', 2), ('СЕБЯ', 3), ('К НЕМУ', 4), ('ЧТОБЫ', 6),
             ('ОТПУСТИТЬ', 7), ('КОГДА', 8), ('СТАНЕТ', 9), ('ТЯЖЕЛО', 10, 'cold'),
             ('Я', 11, 'drop'), ('ВЦЕПЛЮСЬ', 12, 'hot'), ('НОГАМИ', 13), ('В СКАЛУ', 14), ('И', 16),
             ('БУДУ', 17), ('ТЯНУТЬ', 18, 'hot'), ('ПОКА', 19), ('РУКИ', 20), ('НЕ', 21),
             ('СОТРУТСЯ', 22), ('В КРОВЬ', 23, 'blood'), ('МЫ', 24), ('ПОДНИМАЛИСЬ', 25),
             ('НА ЭТУ', 26), ('ГОРУ', 28), ('ВМЕСТЕ', 29, 'gold'), ('МЫ', 30), ('СПУСТИМСЯ', 31),
             ('С НЕЁ', 32), ('ВМЕСТЕ', 34, 'gold'), ('ИЛИ', 35), ('НЕ', 36), ('СПУСТИМСЯ', 37),
             ('ВОВСЕ', 38, 'last')],
}


def energy(path):
    y, sr = librosa.load(path, sr=24000)
    r = librosa.feature.rms(y=y, hop_length=240, frame_length=480)[0]
    return 20 * np.log10(r + 1e-6)  # 10 ms frames


def snap(db, s):
    i = int(round(s * 100))
    i = min(max(i, 0), len(db) - 1)
    if db[i] < -40:  # whisper start inside silence -> move to real onset
        j = i
        while j < len(db) - 1 and j < i + 80 and db[j] < -34:
            j += 1
        return j / 100
    j = i  # already voiced -> walk back to the onset (max 150 ms)
    while j > 0 and j > i - 15 and db[j - 1] > -34:
        j -= 1
    return j / 100


def to_video(spk, s):
    for a, b, dst in SEGS[spk]:
        if a - 1e-6 <= s <= b + 1e-6:
            return dst + (s - a)
    raise ValueError(f'{spk}: {s} not inside any kept segment')


words = []
for spk in ('narr', 'gpt', 'grok'):
    db = energy(os.path.join(M, FILES[spk]))
    ws = raw[KEY[spk]]
    for k, item in enumerate(DISPLAY[spk]):
        text, idx = item[0], item[1]
        style = item[2] if len(item) > 2 else ''
        s = snap(db, ws[idx][0])
        prev = [w for w in words if w['spk'] == spk]
        tv = to_video(spk, s)
        if prev and tv < prev[-1]['t'] + 0.1:
            tv = prev[-1]['t'] + 0.1
        words.append({'spk': spk, 'text': text, 'style': style, 't': round(tv, 3),
                      'srcEnd': ws[idx][1]})
    # end of each word in video time
    seq = [w for w in words if w['spk'] == spk]
    for i, w in enumerate(seq):
        end_src_video = None
        for a, b, dst in SEGS[spk]:
            if a <= w['srcEnd'] <= b + 0.05:
                end_src_video = dst + (min(w['srcEnd'], b) - a)
        nxt = seq[i + 1]['t'] if i + 1 < len(seq) else None
        e = end_src_video if end_src_video else w['t'] + 0.4
        w['end'] = round(nxt if (nxt is not None and nxt - e < 0.55) else e + 0.3, 3)
        del w['srcEnd']

TL = {
    'fps': 60, 'W': 1080, 'H': 1920,
    'musicAt': round(MUSIC_AT, 3), 'drop': DROP, 'dropSong': DROP_SONG,
    'musicOut': round(MUSIC_AT + 31.96, 3),   # song's breakdown -> we pull the music out
    'endDrop': 43.40,                         # music returns (song drop again) for the end card
    'duration': 47.5,
    'segs': SEGS, 'words': words,
}
json.dump(TL, open(os.path.join(M, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(D, 'timeline.js'), 'w').write('window.TL = ' + json.dumps(TL, ensure_ascii=False) + ';\n')
for w in words:
    print(f"{w['t']:6.2f}-{w['end']:6.2f} {w['spk']:4s} {w['text']} {w['style']}")
print('musicAt', TL['musicAt'], 'musicOut', TL['musicOut'])
