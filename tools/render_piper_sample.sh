#!/usr/bin/env bash
set -euo pipefail
mkdir -p hypnosis_build/sample
cat > hypnosis_build/sample/script.txt <<'TEXT'
Mach es dir bequem. Atme langsam ein. Und etwas länger wieder aus. Du musst jetzt nichts erzwingen. Es genügt, dass du hier bist.

Stell dir vor, du stehst in einem dunklen Raum. Die Dunkelheit ist ein Zustand, keine Identität. Und irgendwo erkennst du einen kleinen Lichtpunkt. Nicht groß. Nicht grell. Nur deutlich genug, dass du ihn wahrnehmen kannst.

Mit jedem Atemzug kommst du diesem Licht einen Schritt näher. Aus Angst kann Aufmerksamkeit werden. Aus Verwirrung kann eine Frage entstehen. Aus einer Frage kann Klarheit werden.

Ich kann Dunkelheit wahrnehmen, ohne selbst Dunkelheit zu werden. Ich beobachte, bevor ich bewerte. Ich prüfe, bevor ich glaube. Ich wähle den nächsten sinnvollen Schritt. Meine Vergangenheit erklärt Teile meiner Geschichte. Sie besitzt nicht meine Zukunft.

Atme tiefer ein. Und langsam wieder aus. Licht bedeutet nicht, dass alles perfekt wird. Licht bedeutet, dass ich wieder sehen, wählen und handeln kann. Ich darf lernen. Ich darf mich korrigieren. Ich darf neu anfangen.
TEXT

piper --model de_DE-thorsten-high \
  --length-scale 1.16 \
  --noise-scale 0.55 \
  --noise-w 0.50 \
  --sentence-silence 0.75 \
  --output_file hypnosis_build/sample/voice.wav \
  < hypnosis_build/sample/script.txt

ffmpeg -y -i hypnosis_build/sample/voice.wav \
  -f lavfi -i 'anoisesrc=color=brown:amplitude=0.018:r=48000' \
  -f lavfi -i 'sine=frequency=174:sample_rate=48000' \
  -f lavfi -i 'sine=frequency=180:sample_rate=48000' \
  -filter_complex "[0:a]aresample=48000,highpass=f=65,lowpass=f=14000,acompressor=threshold=-21dB:ratio=2:attack=30:release=220,asplit=2[dry][wet];[wet]aecho=0.75:0.32:90|170|280:0.16|0.10|0.05,volume=0.23[rv];[dry]volume=1[d];[1:a]volume=0.014[noise];[2:a]volume=0.006[left];[3:a]volume=0.006[right];[left][right]amerge=inputs=2[bi];[d][rv][noise][bi]amix=inputs=4:normalize=0,loudnorm=I=-18:LRA=5:TP=-1.2[out]" \
  -map '[out]' -shortest -ar 48000 -ac 2 -codec:a libmp3lame -b:a 256k \
  hypnosis_build/Hypnose_MENSCHLICHE_STIMME_SAMPLE.mp3

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 hypnosis_build/Hypnose_MENSCHLICHE_STIMME_SAMPLE.mp3
