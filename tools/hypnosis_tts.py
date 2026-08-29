import subprocess
from pathlib import Path
import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

OUT = Path('hypnosis_build'); OUT.mkdir(exist_ok=True)
SECTIONS = [
"Mach es dir bequem. Höre diese Aufnahme nur an einem sicheren Ort, an dem du nichts tun musst. Nicht beim Autofahren. Du kannst jederzeit die Augen öffnen, dich bewegen oder die Aufnahme beenden. Atme langsam ein. Und etwas länger wieder aus. Noch einmal. Ein. Und aus. Du musst jetzt nichts erzwingen. Es genügt, dass du hier bist.",
"Mit jedem Ausatmen darf dein Körper etwas weniger festhalten. Lass die Stirn weich werden. Den Kiefer. Die Schultern. Vielleicht bemerkst du, wie zwischen einem Gedanken und dem nächsten ein kleiner Raum entsteht. Genau dort beginnt Veränderung. Nicht durch Druck. Sondern durch einen neuen Blick.",
"Stell dir vor, du stehst in einem dunklen Raum. Die Dunkelheit bedeutet nicht, dass mit dir etwas falsch ist. Sie steht für alles, was unklar war. Für Angst. Für Zweifel. Für Erfahrungen, die schwer waren. Du musst nichts davon schönreden. Du musst nichts davon bekämpfen. Du darfst nur erkennen: Dunkelheit ist ein Zustand. Keine Identität.",
"Und vielleicht gibt es irgendwo in diesem Raum einen winzigen Lichtpunkt. Nicht groß. Nicht grell. Nur deutlich genug, dass du ihn wahrnehmen kannst. Dieses Licht verlangt nicht, dass du sofort alles verstehst. Es erinnert dich nur an eine Möglichkeit: Es kann heller werden. Schritt für Schritt. Entscheidung für Entscheidung.",
"Wenn Angst auftaucht, muss Angst nicht allein entscheiden. Wenn Unsicherheit auftaucht, kannst du nach Information suchen. Wenn ein Rückschlag kommt, kannst du fragen: Was zeigt mir das? Was kann ich lernen? Was ist der nächste sichere, konkrete Schritt? So beginnt ein neues Muster. Reiz. Pause. Wahrnehmen. Wählen.",
"Du bist nicht jeder Gedanke, der durch deinen Kopf geht. Du bist nicht jedes Gefühl, das kommt und wieder geht. Du bist der Mensch, der beobachten, prüfen und entscheiden kann. Ein Gedanke kann laut sein, ohne wahr zu sein. Ein Gefühl kann intensiv sein, ohne dein ganzes Leben zu beschreiben. Du darfst zwischen Erfahrung und Bedeutung unterscheiden.",
"Und jetzt lass neue Bedeutungen entstehen. Aus Verwirrung wird eine Frage. Aus einer Frage kann Klarheit werden. Aus Angst wird Aufmerksamkeit. Aus Aufmerksamkeit kann Vorbereitung werden. Aus einem Fehler wird Information. Aus Information kann Urteilskraft werden. Aus Stillstand wird ein kleiner nächster Schritt. Aus Dunkelheit wird die Suche nach Licht.",
"Vielleicht gehst du jetzt innerlich einen Schritt auf dieses Licht zu. Und noch einen. Mit jedem Schritt wird es wärmer. Ruhiger. Klarer. Du musst nicht den ganzen Weg sehen. Nur den nächsten Meter. Du musst nicht dein ganzes Leben heute lösen. Nur die nächste gute Entscheidung treffen.",
"Sag innerlich, langsam und ohne Zwang: Ich erkenne, was ich beeinflussen kann. Ich akzeptiere, was gerade nicht in meiner Hand liegt. Ich suche Wahrheit vor Wunschdenken. Ich suche Klarheit vor Panik. Ich wähle den nächsten sinnvollen Schritt. Ich darf lernen. Ich darf mich korrigieren. Ich darf neu anfangen.",
"Ich kann Dunkelheit wahrnehmen, ohne selbst Dunkelheit zu werden. Ich kann Schmerz kennen und trotzdem Wärme bewahren. Ich kann Angst spüren und trotzdem bewusst handeln. Ich kann enttäuscht worden sein und trotzdem mit guten Grenzen Vertrauen aufbauen. Meine Vergangenheit erklärt Teile meiner Geschichte. Sie besitzt nicht meine Zukunft.",
"Dein Nervensystem darf lernen, dass Ruhe kein Stillstand ist. Ruhe kann Vorbereitung sein. Geduld kann Stärke sein. Grenzen können Schutz sein. Hilfe anzunehmen kann klug sein. Eine Pause kann verhindern, dass ein kurzer Impuls eine lange Konsequenz erzeugt. Du musst nicht schnell reagieren, um stark zu sein.",
"Und während das Licht näherkommt, stell dir dein zukünftiges Ich vor. Nicht perfekt. Nicht unverwundbar. Sondern erfahrener. Klarer. Ruhiger. Ein Mensch, der gelernt hat, unter Druck langsamer zu denken. Der Fakten prüft. Der gute Menschen erkennt. Der seinen Ruf, seine Gesundheit, seine Beziehungen und seine Zeit schützt.",
"Dieses zukünftige Ich sagt nicht: Ich hatte nie Dunkelheit. Es sagt: Ich habe gelernt, mich darin zu orientieren. Ich habe gelernt, nach dem nächsten Licht zu suchen. Ich habe gelernt, aus Erfahrung bessere Entscheidungen zu bauen. Ich habe gelernt, dass Stärke nicht Härte bedeutet. Stärke kann Klarheit sein.",
"Lass diese Sätze jetzt tiefer sinken. Ich werde ruhiger, wenn es unübersichtlich wird. Ich beobachte, bevor ich bewerte. Ich prüfe, bevor ich glaube. Ich frage, bevor ich annehme. Ich plane, bevor ich riskiere. Ich handle konkret. Ich lerne aus Feedback. Ich korrigiere meinen Kurs. Ich bleibe beweglich.",
"Ich muss nicht gegen die Dunkelheit kämpfen. Ich kann Licht hinzufügen. Ein ehrliches Gespräch ist Licht. Eine klare Grenze ist Licht. Eine abgeschlossene Aufgabe ist Licht. Wissen ist Licht. Schlaf ist Licht. Bewegung ist Licht. Eine gute Entscheidung ist Licht. Ein Mensch, dem ich vertrauen kann, ist Licht.",
"Und je öfter du solche Schritte wiederholst, desto vertrauter wird dieser Weg. Nicht weil Worte Magie wären. Sondern weil Aufmerksamkeit trainiert werden kann. Weil Gewohnheiten trainiert werden können. Weil Entscheidungen wiederholt werden können. Weil ein neuer Weg im Leben aus vielen kleinen realen Handlungen entsteht.",
"Für morgen brauchst du nur einen Lichtpunkt. Eine Sache, die du klärst. Eine Sache, die du abschließt. Eine Sache, die du lernst. Eine Sache, bei der du eine gute Grenze setzt. Eine Sache, die deinem zukünftigen Ich hilft. Klein genug, dass du sie wirklich tun kannst.",
"Und jetzt noch einmal. Ich suche Licht, ohne die Realität zu verleugnen. Ich suche Lösungen, ohne Gefühle wegzudrücken. Ich respektiere meine Erfahrung, ohne mich von ihr einsperren zu lassen. Ich entscheide bewusst. Ich handle konkret. Ich lerne. Ich korrigiere. Ich gehe weiter.",
"Atme jetzt etwas tiefer ein. Und langsam wieder aus. Spüre den Raum um dich herum. Deine Hände. Deine Füße. Den Untergrund unter dir. Nimm aus dieser Aufnahme nur mit, was dir nützlich, realistisch und mit deinen Werten vereinbar erscheint. Der nächste Schritt muss nicht groß sein. Er muss nur echt sein."
]

def run(c): subprocess.run(c, check=True)
def main():
    device='cuda' if torch.cuda.is_available() else 'cpu'
    model=ChatterboxMultilingualTTS.from_pretrained(device=device,t3_model='v3')
    waves=[]; sr=model.sr
    for i,text in enumerate(SECTIONS):
        print(f'Generating {i+1}/{len(SECTIONS)}')
        wav=model.generate(text,language_id='de',cfg_weight=0.30,exaggeration=0.48).cpu()
        waves += [wav, torch.zeros((wav.shape[0],int(sr*1.35)))]
    dry=torch.cat(waves,dim=-1); ta.save(str(OUT/'voice_dry.wav'),dry,sr)
    run(['ffmpeg','-y','-i',str(OUT/'voice_dry.wav'),'-filter:a','atempo=0.92',str(OUT/'voice_slow.wav')])
    fc='[0:a]highpass=f=65,lowpass=f=14500,acompressor=threshold=-20dB:ratio=2.2:attack=25:release=180,asplit=2[dry][wet];[wet]aecho=0.7:0.35:80|145|230:0.18|0.12|0.07,volume=0.24[rv];[dry]volume=1[d];[1:a]volume=0.018[bn];[2:a]volume=0.010[l];[3:a]volume=0.010[r];[l][r]amerge=inputs=2[bi];[d][rv][bn][bi]amix=inputs=4:normalize=0,loudnorm=I=-18:LRA=5:TP=-1[out]'
    run(['ffmpeg','-y','-i',str(OUT/'voice_slow.wav'),'-f','lavfi','-i','anoisesrc=color=brown:amplitude=0.025:r=48000','-f','lavfi','-i','sine=frequency=174:sample_rate=48000','-f','lavfi','-i','sine=frequency=180:sample_rate=48000','-filter_complex',fc,'-map','[out]','-shortest','-ar','48000','-ac','2',str(OUT/'master.wav')])
    run(['ffmpeg','-y','-i',str(OUT/'master.wav'),'-codec:a','libmp3lame','-b:a','256k',str(OUT/'Hypnose_Dunkelheit_zu_Licht_OpenSource.mp3')])
if __name__=='__main__': main()
