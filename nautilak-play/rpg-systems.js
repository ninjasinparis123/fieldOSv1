import * as THREE from 'three';
/* Original skill/RPG systems for Nautilak, inspired by genre patterns; no imported RuneScape code or assets. */
const skills={attack:'Angriff',defence:'Verteidigung',strength:'Stärke',ranged:'Fernkampf',magic:'Magie',woodcutting:'Holzfällen',mining:'Bergbau',fishing:'Angeln',smithing:'Schmieden',crafting:'Handwerk'};
const items={wood:'🪵 Baumstamm',ore:'🪨 Kupfererz',fish:'🐟 Fisch',bar:'🔩 Kupferbarren',charm:'💠 Amulett',scale:'🐉 Drachenschuppe'};
export function xpForLevel(n){let total=0;for(let i=1;i<n;i++)total+=Math.floor(i+300*Math.pow(2,i/7));return Math.floor(total/4)}
export function levelForXp(xp){let low=1,high=99;while(low<high){let mid=Math.ceil((low+high)/2);if(xpForLevel(mid)<=xp)low=mid;else high=mid-1}return low}
export function installRpg({scene,getPosition,notify=()=>{},mode='arena'}){
 const ECON=window.NautilakEconomy;ECON.mountWallet();
 const key='nautilak-skills-v1',fresh={xp:{},items:{},gold:0,quest:0,progress:{wood:0,ore:0,fish:0,wins:0}};
 for(const k in skills)fresh.xp[k]=0;let state=fresh;
 try{let saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved==='object')state={...fresh,...saved,xp:{...fresh.xp,...saved.xp},items:{...saved.items},progress:{...fresh.progress,...saved.progress}}}catch(e){}
 const write=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch(e){}};
 let t=0,tab='skills',messageUntil=0;
 const css=document.createElement('style');css.textContent='#skillsMenu{position:fixed;left:14px;top:113px;width:290px;max-width:83vw;max-height:65vh;overflow:auto;display:none;z-index:11;background:#111d23ee;color:#efdfbe;border:1px solid #c9a973;border-radius:6px;padding:12px;font:12px system-ui,sans-serif}#skillsMenu.active{display:block}#skillsMenu button,#rpgNav button{background:#28383a;color:#f5e3bf;border:1px solid #92856c;border-radius:4px;padding:7px;font:11px system-ui,sans-serif;cursor:pointer}#rpgNav{position:fixed;top:102px;right:18px;z-index:8;display:flex;gap:5px}#skillsMenu .stat{display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #8b886950}#skillsMenu .item{padding:7px;border:1px solid #8b886950;margin:4px 0}#skillsMenu h3{color:#e9c57e;margin:0 0 11px}#rpgToast{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:15;background:#152127ee;color:#f4d78e;padding:8px 16px;border:1px solid #c3a878;border-radius:5px;opacity:0;pointer-events:none;font:12px system-ui,sans-serif}@media(max-width:700px){#rpgNav{top:51px;right:7px;max-width:180px;flex-wrap:wrap}#skillsMenu{top:90px;left:7px;width:245px;max-height:50vh}}';document.head.append(css);
 const nav=document.createElement('nav');nav.id='rpgNav';nav.innerHTML='<button data-tab="skills">⭐ Skills [V]</button><button data-tab="bag">🎒 Tasche [B]</button><button data-tab="quest">📜 Quest [N]</button>';document.body.append(nav);
 const panel=document.createElement('aside');panel.id='skillsMenu';panel.innerHTML='<h3>NAUTILAK · ABENTEUER <button id="closeSkills" style="float:right">✕</button></h3><div id="skillsContents"></div>';document.body.append(panel);
 const toast=document.createElement('div');toast.id='rpgToast';document.body.append(toast);
 const popup=msg=>{toast.textContent=msg;toast.style.opacity=1;messageUntil=t+2.5;notify(msg)};
 function slots(){return Object.values(state.items).reduce((sum,n)=>sum+Math.ceil(n/25),0)}
 function addItem(item,n=1){let old=state.items[item]||0,delta=Math.ceil((old+n)/25)-Math.ceil(old/25);if(slots()+delta>28){popup('Inventar voll (28 Plätze)');return false}state.items[item]=old+n;write();return true}
 function consume(item,n){if((state.items[item]||0)<n)return false;state.items[item]-=n;if(!state.items[item])delete state.items[item];write();return true}
 function gain(skill,amount){let old=levelForXp(state.xp[skill]||0);state.xp[skill]=(state.xp[skill]||0)+Math.max(1,Math.round(amount*(ECON.unlocked('blessing')?1.25:1)));let lv=levelForXp(state.xp[skill]);if(lv>old)popup('LEVEL UP · '+skills[skill]+' '+lv);write();return lv}
 function checkQuest(){const p=state.progress;if(state.quest===0&&p.wood>=3&&p.ore>=2&&p.fish>=1){state.quest=1;state.gold+=60;popup('Quest geschafft · +60 Gold!')}if(state.quest===1&&p.wins>=3){state.quest=2;state.gold+=100;addItem('charm');popup('Wächter besiegt · +100 Gold + Amulett')}if(state.quest===2&&(state.items.bar||0)>=2){state.quest=3;state.gold+=200;popup('Questreihe geschafft · +200 Gold!')}write()}
 function craft(kind){if(kind==='bar'){if(!consume('ore',2))return popup('2 Erz benötigt');addItem('bar');gain('smithing',55)}if(kind==='charm'){if((state.items.bar||0)<1||(state.items.wood||0)<1)return popup('Barren + Holz benötigt');consume('bar',1);consume('wood',1);addItem('charm');gain('crafting',60)}checkQuest();render()}
 function render(){const c=document.getElementById('skillsContents');if(tab==='skills')c.innerHTML=Object.entries(skills).map(([id,label])=>'<div class="stat"><span>'+label+'</span><strong>Lv '+levelForXp(state.xp[id]||0)+' · '+Math.floor(state.xp[id]||0)+' XP</strong></div>').join('');
 if(tab==='bag')c.innerHTML='<p>🎒 '+slots()+'/28 Plätze · 🟡 '+state.gold+' Gold</p>'+Object.entries(state.items).map(([id,n])=>'<div class="item">'+(items[id]||id)+' ×'+n+'</div>').join('')+'<button data-craft="bar">2 Erz → Kupferbarren (+55 XP)</button> <button data-craft="charm">Barren + Holz → Amulett</button>';
 if(tab==='quest'){const p=state.progress;c.innerHTML='<h3>Die Prüfungen des Weltenbaums</h3><p>'+(state.quest===0?'Sammle: '+p.wood+'/3 Holz · '+p.ore+'/2 Erz · '+p.fish+'/1 Fisch':state.quest===1?'Besiege Trainingswächter: '+p.wins+'/3':state.quest===2?'Schmiede zwei Kupferbarren: '+(state.items.bar||0)+'/2':'✓ Alle Prüfungen bestanden')+'</p><p>G an Rohstoffen · Kämpfen · Handwerk. Fortschritt wird lokal gespeichert.</p>'}}
 function open(id){tab=id;panel.classList.add('active');render()}
 function toggle(id){if(tab===id&&panel.classList.contains('active'))panel.classList.remove('active');else open(id)}
 nav.addEventListener('click',e=>{let b=e.target.closest('[data-tab]');if(b)toggle(b.dataset.tab)});
 document.getElementById('closeSkills').addEventListener('click',()=>panel.classList.remove('active'));
 panel.addEventListener('click',e=>{let b=e.target.closest('[data-craft]');if(b)craft(b.dataset.craft)});
 const resources=[{kind:'wood',skill:'woodcutting',name:'Eisenholz',x:-20,z:-19},{kind:'wood',skill:'woodcutting',name:'Eisenholz',x:-24,z:12},{kind:'ore',skill:'mining',name:'Kupferader',x:19,z:-18},{kind:'ore',skill:'mining',name:'Kupferader',x:24,z:15},{kind:'fish',skill:'fishing',name:'Quellteich',x:0,z:25}];
 const mats={wood:new THREE.MeshLambertMaterial({color:0x537a4b}),ore:new THREE.MeshLambertMaterial({color:0xa2896b}),fish:new THREE.MeshLambertMaterial({color:0x64b4cb,transparent:true,opacity:.9})};
 const spawnShift=mode==='world'?36:0;
 for(const r of resources){r.z+=spawnShift;r.ready=0;const root=new THREE.Group();root.position.set(r.x,mode==='world'?-1:0,r.z);
 if(r.kind==='wood'){let trunk=new THREE.Mesh(new THREE.CylinderGeometry(.37,.58,4,8),new THREE.MeshLambertMaterial({color:0x70503c}));trunk.position.y=2;root.add(trunk);for(let i=0;i<3;i++){let crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2-i*.3,1),mats.wood);crown.position.y=4.3+i*1.25;root.add(crown)}}
 if(r.kind==='ore'){let rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1.8,1),mats.ore);rock.position.y=1.5;rock.scale.set(1.2,.8,1.1);root.add(rock)}
 if(r.kind==='fish'){let water=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,.12,28),mats.fish);water.position.y=.06;root.add(water)}
 scene.add(root)}
 function near(){const p=getPosition();let result=null,dist=1e9;for(const r of resources){let d=Math.hypot(p.x-r.x,p.z-r.z);if(d<dist){dist=d;result=r}}return dist<=6?result:null}
 function gather(){const r=near();if(!r)return popup('Kein Rohstoff in Reichweite');if(r.ready>t)return popup('Rohstoff regeneriert sich …');if(!addItem(r.kind))return;r.ready=t+4.5;state.progress[r.kind]++;if((state.progress.wood+state.progress.ore+state.progress.fish)%3===0)ECON.award('relic',2,'Drei Rohstoffe gesammelt');gain(r.skill,r.kind==='wood'?30:r.kind==='ore'?38:32);popup('+'+skills[r.skill]+' XP · '+(items[r.kind]||r.kind));checkQuest();render()}
 const hotkeys={KeyV:'skills',KeyB:'bag',KeyN:'quest'};window.addEventListener('keydown',e=>{if(e.repeat||e.target?.closest?.('button,input,textarea,select'))return;if(hotkeys[e.code]){e.preventDefault();toggle(hotkeys[e.code])}if(e.code==='KeyG'){e.preventDefault();gather()}},true);
 function update(dt){t+=dt;if(t>messageUntil)toast.style.opacity=0}
 function combatHit(type,dmg){gain(type,dmg*2)}
 function defeated(){state.progress.wins++;ECON.award('relic',2,'Trainingswächter besiegt');state.gold+=12;if(Math.random()<.25)addItem('scale',1);gain('strength',42);gain('defence',28);checkQuest();render();popup('Wächter besiegt · +12 Gold + Kampf-XP')}
 return {update,combatHit,defeated,addItem,near,gather,state}
}
