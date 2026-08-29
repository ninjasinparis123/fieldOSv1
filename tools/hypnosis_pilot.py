import subprocess
from pathlib import Path
import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

OUT=Path('hypnosis_build'); OUT.mkdir(exist_ok=True)
TEXT="""Atme langsam ein. Und noch etwas langsamer wieder aus. Du musst die Dunkelheit nicht bekämpfen. Dunkelheit ist ein Zustand, keine Identität. Vor dir erscheint ein kleines Licht. Mit jedem ruhigen Atemzug wird es klarer. Ich kann Angst wahrnehmen und trotzdem bewusst wählen. Ich suche Klarheit. Ich lerne. Ich korrigiere. Ich gehe weiter. Aus Dunkelheit wird Schritt für Schritt Licht."""

def run(c): subprocess.run(c,check=True)

def main():
    device='cuda' if torch.cuda.is_available() else 'cpu'
    print('device',device,flush=True)
    model=ChatterboxMultilingualTTS.from_pretrained(device=device,t3_model='v3')
    print('generate',flush=True)
    wav=model.generate(TEXT,language_id='de',cfg_weight=0.30,exaggeration=0.48).cpu()
    ta.save(str(OUT/'pilot_dry.wav'),wav,model.sr)
    run(['ffmpeg','-y','-i',str(OUT/'pilot_dry.wav'),'-filter:a','atempo=0.92',str(OUT/'pilot_slow.wav')])
    fc='[0:a]highpass=f=65,lowpass=f=14500,acompressor=threshold=-20dB:ratio=2.2:attack=25:release=180,asplit=2[dry][wet];[wet]aecho=0.7:0.35:80|145|230:0.18|0.12|0.07,volume=0.24[rv];[dry]volume=1[d];[1:a]volume=0.018[bn];[2:a]volume=0.010[l];[3:a]volume=0.010[r];[l][r]amerge=inputs=2[bi];[d][rv][bn][bi]amix=inputs=4:normalize=0,loudnorm=I=-18:LRA=5:TP=-1[out]'
    run(['ffmpeg','-y','-i',str(OUT/'pilot_slow.wav'),'-f','lavfi','-i','anoisesrc=color=brown:amplitude=0.025:r=48000','-f','lavfi','-i','sine=frequency=174:sample_rate=48000','-f','lavfi','-i','sine=frequency=180:sample_rate=48000','-filter_complex',fc,'-map','[out]','-shortest','-ar','48000','-ac','2',str(OUT/'pilot_master.wav')])
    run(['ffmpeg','-y','-i',str(OUT/'pilot_master.wav'),'-codec:a','libmp3lame','-b:a','256k',str(OUT/'Hypnose_Dunkelheit_zu_Licht_PILOT.mp3')])

if __name__=='__main__': main()
