import subprocess
from pathlib import Path
import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

OUT=Path('hypnosis_build'); OUT.mkdir(exist_ok=True)
SECTIONS=[
"Mach es dir bequem. Höre diese Aufnahme nur an einem sicheren Ort, an dem du nichts tun musst. Nicht beim Autofahren. Du kannst jederzeit die Augen öffnen oder die Aufnahme beenden. Atme langsam ein. Und länger wieder aus. Du musst jetzt nichts erzwingen. Es genügt, dass du hier bist.",
"Stell dir vor, du stehst in einem dunklen Raum. Du musst die Dunkelheit nicht bekämpfen. Sie ist ein Zustand, keine Identität. Und irgendwo erkennst du einen kleinen Lichtpunkt. Dieses Licht verlangt nicht, dass du sofort alles löst. Es erinnert dich nur daran: Es kann heller werden. Schritt für Schritt. Entscheidung für Entscheidung.",
"Lass diese Sätze langsam wirken. Ich kann Dunkelheit wahrnehmen, ohne selbst Dunkelheit zu werden. Aus Angst kann Aufmerksamkeit werden. Aus Verwirrung kann eine Frage entstehen. Aus einer Frage kann Klarheit werden. Ich beobachte, bevor ich bewerte. Ich prüfe, bevor ich glaube. Ich wähle den nächsten sinnvollen Schritt. Meine Vergangenheit erklärt Teile meiner Geschichte. Sie besitzt nicht meine Zukunft.",
"Atme tiefer ein. Und langsam wieder aus. Licht bedeutet nicht, dass alles perfekt wird. Licht bedeutet, dass ich wieder sehen, wählen und handeln kann. Ich darf lernen. Ich darf mich korrigieren. Ich darf neu anfangen. Der nächste Schritt muss nicht groß sein. Er muss nur echt sein."
]

def run(c): subprocess.run(c,check=True)

def main():
    device='cuda' if torch.cuda.is_available() else 'cpu'
    print('device',device,flush=True)
    model=ChatterboxMultilingualTTS.from_pretrained(device=device,t3_model='v3')
    sr=model.sr; parts=[]
    for i,t in enumerate(SECTIONS):
        print('section',i+1,'of',len(SECTIONS),flush=True)
        w=model.generate(t,language_id='de',cfg_weight=0.30,exaggeration=0.48).cpu()
        parts.extend([w,torch.zeros((w.shape[0],int(sr*1.5)))])
    dry=torch.cat(parts,dim=-1); ta.save(str(OUT/'pilot_dry.wav'),dry,sr)
    run(['ffmpeg','-y','-i',str(OUT/'pilot_dry.wav'),'-filter:a','atempo=0.92',str(OUT/'pilot_slow.wav')])
    fc='[0:a]highpass=f=65,lowpass=f=14500,acompressor=threshold=-20dB:ratio=2.2:attack=25:release=180,asplit=2[dry][wet];[wet]aecho=0.7:0.35:80|145|230:0.18|0.12|0.07,volume=0.24[rv];[dry]volume=1[d];[1:a]volume=0.018[bn];[2:a]volume=0.010[l];[3:a]volume=0.010[r];[l][r]amerge=inputs=2[bi];[d][rv][bn][bi]amix=inputs=4:normalize=0,loudnorm=I=-18:LRA=5:TP=-1[out]'
    run(['ffmpeg','-y','-i',str(OUT/'pilot_slow.wav'),'-f','lavfi','-i','anoisesrc=color=brown:amplitude=0.025:r=48000','-f','lavfi','-i','sine=frequency=174:sample_rate=48000','-f','lavfi','-i','sine=frequency=180:sample_rate=48000','-filter_complex',fc,'-map','[out]','-shortest','-ar','48000','-ac','2',str(OUT/'pilot_master.wav')])
    run(['ffmpeg','-y','-i',str(OUT/'pilot_master.wav'),'-codec:a','libmp3lame','-b:a','256k',str(OUT/'Hypnose_Dunkelheit_zu_Licht_PILOT.mp3')])

if __name__=='__main__': main()
