#!/usr/bin/env bash
set -euo pipefail
mkdir -p hypnosis_build
cat > hypnosis_build/script.txt <<'EOF'
Höre diese Aufnahme nur an einem sicheren Ort, an dem du dich entspannen kannst. Nicht beim Fahren. Du kannst jederzeit die Augen öffnen und die Aufnahme beenden.

Atme langsam ein. Und noch langsamer wieder aus. Mit jedem Ausatmen darf dein Körper ein wenig schwerer werden. Du musst jetzt nichts beweisen. Nichts erzwingen. Nur zuhören.

Stell dir vor, du stehst in einem dunklen Raum. Die Dunkelheit ist nicht dein Feind. Sie ist nur der Teil des Raumes, den du im Moment noch nicht sehen kannst. Und irgendwo vor dir erscheint ein kleines, warmes Licht.

Du gehst nicht gegen die Dunkelheit. Du gehst durch sie hindurch. Schritt für Schritt. Ruhig. Aufmerksam. Sicher.

Was hinter dir liegt, darf Erfahrung sein, ohne deine Zukunft zu bestimmen. Ein Gedanke ist ein Gedanke. Ein Gefühl ist ein Gefühl. Ein schwieriger Moment ist ein Moment. Du bist mehr als dieser Moment.

Und während du weitergehst, darf dein Geist eine neue Bedeutung lernen. Aus Verwirrung kann Klarheit entstehen. Aus Angst kann Aufmerksamkeit entstehen. Aus einem Rückschlag kann Information entstehen. Aus Erfahrung kann Urteilskraft entstehen.

Du musst nicht dein gesamtes Leben heute lösen. Dein nächster Schritt darf klein und real sein.

Das Licht vor dir wird etwas heller. Es berührt dein Gesicht. Deine Schultern. Deine Brust. Deine Hände. Und du bemerkst: Licht bedeutet nicht, dass niemals wieder etwas schwer wird. Licht bedeutet, dass du auch im Schweren einen nächsten Schritt erkennen kannst.

Lass diese Sätze langsam wirken.

Ich kann Dunkelheit wahrnehmen, ohne in ihr zu verschwinden.

Ich kann Angst fühlen und trotzdem klar entscheiden.

Ich kann aus Erfahrung lernen.

Ich kann loslassen, was mir nicht mehr dient.

Ich muss nicht alles heute schaffen.

Mein nächster Schritt darf klein und real sein.

Ich bewege mich von Verwirrung zu Klarheit. Von Erstarrung zu Handlung. Von Selbstzweifel zu Lernen. Von Dunkelheit zu Licht.

Und vielleicht siehst du jetzt einen frühen Morgen vor dir. Am Horizont verändert sich die Farbe des Himmels. Nicht plötzlich. Nicht gewaltsam. Sondern langsam. Natürlich.

Genau so darf Veränderung sein. Du brauchst keine perfekte Vergangenheit, um eine bessere Zukunft aufzubauen. Du brauchst keinen perfekten Tag, um heute eine gute Entscheidung zu treffen. Du musst nicht den gesamten Weg sehen, um den nächsten Schritt zu gehen.

Ruhe ist keine Schwäche. Geduld ist kein Stillstand. Grenzen sind keine Grausamkeit. Hilfe anzunehmen ist kein Versagen. Neu anzufangen ist keine Niederlage. Mich zu korrigieren macht mich lernfähig.

Und wenn in Zukunft ein dunkler Moment auftaucht, darf dein Geist sich an eine einfache Frage erinnern: Wo ist der nächste kleine Punkt von Klarheit? Was ist der nächste sichere, konkrete Schritt?

Du wartest nicht darauf, dass Licht von außen kommt. Du erzeugst Licht durch Klarheit, Handlung, Lernen, Verbindung und Wahrheit.

Atme jetzt noch einmal tief ein. Und langsam aus. Spüre den Boden unter dir. Spüre deinen Körper. Nimm die Geräusche um dich herum wahr.

Die Dunkelheit ist nicht das Ende der Geschichte. Schritt für Schritt kann es heller werden.

Und wenn du bereit bist, öffne langsam die Augen. Wach. Ruhig. Klar. Hier und jetzt.
EOF

piper --model de_DE-thorsten-high --length-scale 1.18 --sentence-silence 0.70 --output_file hypnosis_build/voice.wav < hypnosis_build/script.txt
DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 hypnosis_build/voice.wav)
ffmpeg -y -i hypnosis_build/voice.wav -f lavfi -t "$DUR" -i 'anoisesrc=color=brown:amplitude=0.010:r=44100' -filter_complex "[0:a]aresample=44100,highpass=f=70,lowpass=f=10000,acompressor=threshold=-20dB:ratio=2:attack=20:release=220,asplit=2[d][w];[w]aecho=0.8:0.3:80|160:0.10|0.05,volume=0.25[r];[1:a]volume=0.10[n];[d][r][n]amix=inputs=3:normalize=0,loudnorm=I=-18:TP=-1.5:LRA=6[out]" -map '[out]' -ar 44100 -ac 2 -c:a libmp3lame -b:a 256k hypnosis_build/Hypnose_Dunkelheit_zu_Licht_MENSCHLICH_Piper.mp3
SIZE=$(stat -c%s hypnosis_build/Hypnose_Dunkelheit_zu_Licht_MENSCHLICH_Piper.mp3)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 hypnosis_build/Hypnose_Dunkelheit_zu_Licht_MENSCHLICH_Piper.mp3)
CHANNELS=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=nw=1:nk=1 hypnosis_build/Hypnose_Dunkelheit_zu_Licht_MENSCHLICH_Piper.mp3)
python - <<PY
size=int('$SIZE'); dur=float('$DURATION'); ch=int('$CHANNELS')
assert size > 500000, (size, 'file too small')
assert dur > 120, (dur, 'duration too short')
assert ch == 2, (ch, 'not stereo')
print(f'VERIFIED size={size} duration={dur:.2f}s channels={ch}')
PY