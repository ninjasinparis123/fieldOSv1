#!/usr/bin/env bash
set -euo pipefail
mkdir -p hypnosis_build/ultra
printf '%s\n' 'Atme langsam ein. Und etwas länger wieder aus. Dunkelheit ist ein Zustand, keine Identität. Aus Angst kann Aufmerksamkeit werden. Aus Verwirrung kann Klarheit entstehen. Ich wähle den nächsten sinnvollen Schritt. Und mit jedem Schritt wird es ein wenig heller.' > hypnosis_build/ultra/text.txt
piper --model de_DE-thorsten-high --length-scale 1.12 --noise-scale 0.55 --noise-w 0.50 --sentence-silence 0.6 --output_file hypnosis_build/ultra/dry.wav < hypnosis_build/ultra/text.txt
ffmpeg -y -i hypnosis_build/ultra/dry.wav -filter:a "highpass=f=65,lowpass=f=14000,aecho=0.75:0.25:100|190:0.12|0.07,loudnorm=I=-18:LRA=5:TP=-1.2" -ar 48000 -ac 2 -codec:a libmp3lame -b:a 256k hypnosis_build/Hypnose_MENSCHLICHE_STIMME_20s.mp3
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 hypnosis_build/Hypnose_MENSCHLICHE_STIMME_20s.mp3
