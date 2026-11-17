import * as THREE from 'three';
const $=id=>document.getElementById(id);
const isIsland=document.body.dataset.game==='island',GAME=isIsland?'MOSSBAY':'AETHERKIN';
let saveKey='nautilak-'+(isIsland?'mossbay':'aetherkin')+'-v1';
const defaults=isIsland?{wood:0,shells:0,fish:0,seeds:4,harvest:0,flowers:0,plots:[],quests:0,gold:0}:{team:['Emberlyn'],owned:['Emberlyn'],win:0,crystals:5,gold:0,encounters:0};
let data;try{data={...defaults,...(JSON.parse(localStorage.getItem(saveKey)||'null')||{})}}catch(e){data={...defaults}};
const save=()=>{try{localStorage.setItem(saveKey,JSON.stringify(data))}catch(e){}};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,300);
scene.background=new THREE.Color(isIsland?0x93d5e6:0x9095d6);scene.fog=new THREE.FogExp2(isIsland?0xc0d9d0:0x989ac8,.012);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('screen').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xf9f0e3,0x6b8066,2.35));
const sunlight=new THREE.DirectionalLight(0xfff0cf,2.15);sunlight.position.set(38,75,32);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);sunlight.shadow.camera.left=-55;sunlight.shadow.camera.right=55;sunlight.shadow.camera.top=55;sunlight.shadow.camera.bottom=-55;scene.add(sunlight);
const makeMat=(color,opt={})=>new THREE.MeshStandardMaterial({color,roughness:.86,...opt});
const mat={water:makeMat(isIsland?0x3ba3bf:0x444fa4,{metalness:.16,roughness:.35}),sand:makeMat(0xe7d29a),grass:makeMat(isIsland?0x81bb77:0x7099a2),wood:makeMat(0x8c684b),leaf:makeMat(0x529c70),stone:makeMat(0x98a5a5),wall:makeMat(0xf1dbb7),roof:makeMat(0xc87969),glow:makeMat(0xe3ce8e,{emissive:0x423720,emissiveIntensity:.55})};
const obj=(geo,material,x,y,z,root=scene)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m};
obj(new THREE.PlaneGeometry(250,250),mat.water,0,-1.7,0).rotation.x=-Math.PI/2;
obj(new THREE.CylinderGeometry(46,47.5,2,96),mat.sand,0,-.9,0);
obj(new THREE.CylinderGeometry(42,43,1,96),mat.grass,0,-.05,0);
let shore=obj(new THREE.TorusGeometry(43,.38,8,108),mat.sand,0,.46,0);shore.rotation.x=Math.PI/2;
function rng(n){let v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v)}
function tree(x,z,n){let g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
obj(new THREE.CylinderGeometry(.33,.56,3.1,9),mat.wood,0,1.6,0,g);
for(let j=0;j<3;j++)obj(new THREE.IcosahedronGeometry(1.45+j*.33,1),makeMat([0x4b9866,0x66b581,0x3f956c][j]),(j-1)*.4,3.8+j*.4,0,g);
if(n%3===0)obj(new THREE.IcosahedronGeometry(.25,0),mat.glow,1,2.7,1,g);
return g}
function cabin(x,z,color=0xf0d9af){let g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
obj(new THREE.BoxGeometry(7,4.7,5.7),makeMat(color),0,2.35,0,g);obj(new THREE.ConeGeometry(5.3,3.6,4),mat.roof,0,6,0,g).rotation.y=Math.PI/4;
obj(new THREE.BoxGeometry(1.8,3,.12),mat.wood,0,1.5,2.9,g);obj(new THREE.BoxGeometry(1.1,1.1,.15),makeMat(0xc0e4e8),-2,3.2,2.9,g);return g}
if(isIsland){cabin(11,-15);cabin(-19,16,0xd8e6c7)}else{cabin(15,-17,0xbac8d6);cabin(-17,18,0xf1d6bf)}
for(let i=0;i<45;i++){let a=i*2.4,r=12+rng(i+100)*28,x=Math.sin(a)*r,z=Math.cos(a)*r;if((Math.abs(x-11)<9&&Math.abs(z+15)<8)||(Math.abs(x+19)<9&&Math.abs(z-16)<8)||(Math.abs(x)<10&&Math.abs(z)<10))continue;tree(x,z,i)}
for(let i=0;i<50;i++){let a=i*2.399,r=8+rng(i+300)*32,x=Math.sin(a)*r,z=Math.cos(a)*r;
let pebble=obj(new THREE.DodecahedronGeometry(.32+rng(i)*.7,0),makeMat(i%3?0xa2b19c:0xcdc4b1),x,.22,z);pebble.scale.y=.5}
const player=new THREE.Group();scene.add(player);
const skin=makeMat(0xe8bd97),coat=makeMat(isIsland?0xf4af6d:0x4b6ea2),hair=makeMat(0x443a3d),boots=makeMat(0x504a46);
const torso=obj(new THREE.CapsuleGeometry(.78,1.25,5,10),coat,0,1.95,0,player);
obj(new THREE.SphereGeometry(.58,16,12),skin,0,3.38,0,player);
obj(new THREE.SphereGeometry(.61,12,8,0,Math.PI*2,0,Math.PI*.56),hair,0,3.56,0,player);
for(const x of [-.37,.37]){obj(new THREE.CylinderGeometry(.25,.3,1.1,10),boots,x,.6,0,player)}
const limbs=[];for(const x of [-1,1]){let arm=obj(new THREE.CapsuleGeometry(.22,.7,4,8),coat,x*.96,2.05,0,player);limbs.push(arm)}
let pos=new THREE.Vector3(0,0,7),last=performance.now(),nowTime=0,yaw=0,keys={},zoom=18,noticeUntil=0;
const spots=[];function spot(type,x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
let color=type==='wood'?0x678e6a:type==='fish'?0x6fb9d7:type==='shell'?0xffe3a5:type==='flower'?0xf6a9cc:type==='crystal'?0xa29bf2:0xc9a97a;
if(type==='wood'){obj(new THREE.CylinderGeometry(.35,.5,2.8,8),mat.wood,0,1.4,0,g);obj(new THREE.IcosahedronGeometry(1.3,1),makeMat(color),0,3.2,0,g)}
else if(type==='fish'){let o=obj(new THREE.SphereGeometry(1.15,12,8),makeMat(color,{transparent:true,opacity:.75}),0,.5,0,g);o.scale.set(1,.13,1)}
else if(type==='flower'){obj(new THREE.CylinderGeometry(.07,.12,1.1,6),mat.leaf,0,.6,0,g);for(let j=0;j<6;j++){let a=j*Math.PI/3;obj(new THREE.SphereGeometry(.26,8,6),makeMat(color),Math.cos(a)*.37,1.3,Math.sin(a)*.37,g)}}
else if(type==='shell'){let o=obj(new THREE.ConeGeometry(.7,1.4,10),makeMat(color),0,.6,0,g);o.rotation.z=.5}
else{obj(new THREE.OctahedronGeometry(1.14,0),makeMat(color,{emissive:color,emissiveIntensity:.22}),0,1.4,0,g)}
spots.push({type,x,z,g,ready:0})}
for(let i=0;i<18;i++){let a=i*2.4,r=15+rng(i+42)*24,x=Math.sin(a)*r,z=Math.cos(a)*r;if(isIsland){spot(i%4===0?'fish':i%3===0?'shell':i%2===0?'flower':'wood',x,z)}else spot(i%4===0?'crystal':i%3===0?'flower':'wood',x,z)}
const villagers=[];const creatureTypes=[
 {name:'Emberlyn',type:'Feuer',color:0xf18d5d,accent:0xffd18c,emoji:'🔥',moves:['Funkenwurf','Flammenreigen','Glutpanzer']},
 {name:'Mistraloo',type:'Wind',color:0x89c8c8,accent:0xc5f9ea,emoji:'🌪️',moves:['Windklinge','Wirbelstoß','Luftschild']},
 {name:'Mosslet',type:'Wald',color:0x7eaa67,accent:0xc5da84,emoji:'🌱',moves:['Dornenfächer','Rankenstoß','Wurzelwall']},
 {name:'Pebblin',type:'Stein',color:0xb49e8a,accent:0xe6c9a5,emoji:'🪨',moves:['Splitterwurf','Schlagwelle','Felsmantel']},
 {name:'Luminix',type:'Licht',color:0xeacb89,accent:0xfff3bd,emoji:'✨',moves:['Lichtbogen','Sternenstoß','Glanzschild']}
];
function critter(type,x,z,scale=1){let c=new THREE.Group();c.position.set(x,0,z);c.scale.setScalar(scale);scene.add(c);
const m=makeMat(type.color,{roughness:.67}),a=makeMat(type.accent,{emissive:type.accent,emissiveIntensity:.12}),dark=makeMat(0x303342);
obj(new THREE.SphereGeometry(1,18,14),m,0,1.42,0,c).scale.set(1,1.06,.8);obj(new THREE.SphereGeometry(.75,16,12),m,0,2.6,.22,c);
obj(new THREE.SphereGeometry(.56,12,10),a,0,2.15,.72,c).scale.z=.4;
for(const sign of [-1,1]){obj(new THREE.ConeGeometry(.25,.84,8),m,sign*.42,3.35,.14,c).rotation.z=sign*.3;
obj(new THREE.SphereGeometry(.1,8,6),dark,sign*.32,2.72,.82,c);
obj(new THREE.SphereGeometry(.28,10,8),m,sign*.55,.57,.16,c)}
obj(new THREE.OctahedronGeometry(.26,0),a,0,3.7,.1,c);return c}
if(isIsland){for(let i=0;i<4;i++){let c=critter(creatureTypes[(i+1)%5],Math.sin(i*2)*20,Math.cos(i*2)*17,.65);villagers.push({obj:c,base:c.position.clone(),name:['Nori','Peb','Luma','Timo'][i]})}}
else{for(let i=0;i<5;i++){let c=critter(creatureTypes[i],Math.sin(i*1.26)*20,Math.cos(i*1.26)*20,1.1);villagers.push({obj:c,base:c.position.clone(),name:creatureTypes[i].name,type:creatureTypes[i]})}}
const plots=[];if(isIsland)for(let i=0;i<8;i++){let x=-8+(i%4)*3.5,z=-5+Math.floor(i/4)*3.8;const ground=obj(new THREE.BoxGeometry(2.9,.14,2.9),makeMat(0x755b43),x,.33,z);const plant=new THREE.Group();plant.position.set(x,.4,z);scene.add(plant);plots.push({x,z,plant,index:i})}
function refreshPlots(){for(const p of plots){p.plant.clear();let item=data.plots[p.index];if(!item)continue;let age=Math.max(0,Date.now()-item.t)/1000,size=Math.min(1,age/18);obj(new THREE.ConeGeometry(.38+size*.4,.7+size*1.3,7),makeMat(age>18?0xe7bf79:0x67ad55),0,.4+size*.4,0,p.plant)}}
refreshPlots();
let battle=null;const creatureMap=new Map(creatureTypes.map(x=>[x.name,x]));
function announce(msg){$('hint').textContent=msg;noticeUntil=nowTime+4}
function nearest(){let best=null,d=Infinity;for(const s of spots){let q=Math.hypot(pos.x-s.x,pos.z-s.z);if(q<d){best={kind:'spot',target:s};d=q}}
for(const v of villagers){let q=Math.hypot(pos.x-v.base.x,pos.z-v.base.z);if(q<d){best={kind:'friend',target:v};d=q}}
if(isIsland)for(const p of plots){let q=Math.hypot(pos.x-p.x,pos.z-p.z);if(q<d){best={kind:'plot',target:p};d=q}}
return d<4.6?best:null}
function interact(){if(battle)return;const n=nearest();if(!n)return announce('Gehe näher an Pflanzen, Tiere oder Ressourcen');
if(n.kind==='spot'){let s=n.target;if(nowTime<s.ready)return announce('Hier wächst gerade Neues');s.ready=nowTime+6; if(isIsland){if(s.type==='wood')data.wood++;if(s.type==='fish')data.fish++;if(s.type==='shell')data.shells++;if(s.type==='flower')data.flowers++;if(Math.random()<.45)data.seeds++;announce('Gesammelt: '+s.type+' · Vielleicht sind Samen dabei!')}else{data.crystals++;announce('+1 Aetherkristall gesammelt');if(Math.random()<.35)startBattle(creatureTypes[Math.floor(Math.random()*5)])}save();renderHud()}
if(n.kind==='plot'){let p=n.target,item=data.plots[p.index];if(!item){if(data.seeds<1)return announce('Keine Samen. Sammle Blumen oder Holz.');data.seeds--;data.plots[p.index]={t:Date.now()};announce('Samen gepflanzt – in 18 Sekunden reif')}else if(Date.now()-item.t>=18000){data.harvest++;data.gold+=5;delete data.plots[p.index];announce('Ernte! +5 Münzen')}else announce('Die Pflanze wächst noch');save();refreshPlots();renderHud()}
if(n.kind==='friend'){let v=n.target;if(isIsland){let names=['Nori','Peb','Luma','Timo'];announce(v.name+': '+['Schön, dass du da bist!','Guck dir die Muscheln am Strand an!','Dein Garten sieht hübsch aus!','Angel heute etwas Leckeres!'][names.indexOf(v.name)]);data.gold+=1}else startBattle(v.type);save();renderHud()}}
function renderHud(){if(isIsland){$('stats').textContent='🪵 '+data.wood+'  🐚 '+data.shells+'  🐟 '+data.fish+'  🌱 '+data.seeds+'  🥕 '+data.harvest+'  🪙 '+data.gold;
$('quest').textContent=data.harvest>=3?'Quest geschafft! Drei Ernten eingebracht.':data.harvest+'/3 Ernten · Baue einen kleinen Garten auf.'}
else{$('stats').textContent='💎 '+data.crystals+'  🏆 '+data.win+' Siege  ✦ '+data.owned.length+'/5 Wesen';
$('quest').textContent='Team: '+data.team.join(', ')}}
const overlay=$('battle'),h=$('battleText'),actions=$('battleActions');
function startBattle(enemy){if(isIsland||battle)return;const ally=creatureMap.get(data.team[0])||creatureTypes[0];battle={enemy,ally,eHp:85,aHp:100,round:0,guard:0};overlay.hidden=false;showBattle('Ein wildes '+enemy.name+' fordert dich heraus!')}
function showBattle(note){if(!battle)return;const b=battle;h.textContent=note;$('battleAlly').textContent=b.ally.emoji+' '+b.ally.name+' · '+Math.max(0,b.aHp)+' LP';$('battleEnemy').textContent=b.enemy.emoji+' '+b.enemy.name+' · '+Math.max(0,b.eHp)+' LP';
actions.innerHTML=b.ally.moves.map((m,i)=>'<button data-move="'+i+'">'+m+'</button>').join('')+'<button data-move="bond">🤝 Freundschaft anbieten (2 Kristalle)</button><button data-move="run">Rückzug</button>'}
function battleAction(move){if(!battle)return;const b=battle;if(move==='run'){overlay.hidden=true;battle=null;return announce('Du hast dich zurückgezogen')}
if(move==='bond'){if(data.crystals<2)return showBattle('Du brauchst zwei Aetherkristalle');if(b.eHp>43)return showBattle('Das Wesen ist noch zu unruhig. Schwäche es zuerst.');data.crystals-=2;const chance=Math.min(.9,.6+(43-b.eHp)*.012);if(Math.random()<chance){if(!data.owned.includes(b.enemy.name))data.owned.push(b.enemy.name);if(data.team.length<3&&!data.team.includes(b.enemy.name))data.team.push(b.enemy.name);data.gold+=9;save();overlay.hidden=true;battle=null;renderHud();return announce(b.enemy.name+' hat sich dir angeschlossen!')} }
else{let i=Number(move),power=[17,28,4][i],damage=Math.max(0,power+Math.floor(Math.random()*9)-4);if(i===2){b.guard=1;b.aHp=Math.min(100,b.aHp+8)}else b.eHp-=damage}
if(b.eHp<=0){data.win++;data.crystals+=2;data.gold+=12;save();overlay.hidden=true;battle=null;renderHud();return announce('Sieg! +2 Kristalle +12 Münzen')}
b.round++;let attack=Math.max(0,15+Math.floor(Math.random()*13)-b.guard*13);b.guard=0;b.aHp-=attack;
if(b.aHp<=0){overlay.hidden=true;battle=null;return announce('Dein Wesen muss sich ausruhen. Versuche es erneut!')}
showBattle(b.enemy.name+' greift an: -'+attack+' LP');save();renderHud()}
actions.addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(b)battleAction(b.dataset.move)});
$('teamButton')?.addEventListener('click',()=>{$('teamPanel').hidden=false;const list=$('teamList');list.innerHTML=data.owned.map(n=>{const c=creatureMap.get(n);return '<button data-team="'+n+'">'+(c?.emoji||'✦')+' '+n+(data.team[0]===n?' ✓':'')+'</button>'}).join('')});
$('teamList')?.addEventListener('click',e=>{let x=e.target.closest('[data-team]');if(x){let n=x.dataset.team;data.team=[n,...data.team.filter(a=>a!==n)].slice(0,3);save();renderHud();$('teamPanel').hidden=true;announce(n+' führt dein Team an')}});
$('teamClose')?.addEventListener('click',()=>{$('teamPanel').hidden=true});
window.addEventListener('keydown',e=>{const tracked=['KeyW','KeyA','KeyS','KeyD','KeyE','ShiftLeft','Space'];if(tracked.includes(e.code)){keys[e.code]=true;e.preventDefault()}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape'){$('teamPanel').hidden=true;if(battle){battle=null;overlay.hidden=true}}});
window.addEventListener('keyup',e=>{keys[e.code]=false});window.addEventListener('blur',()=>{keys={}});
$('interact')?.addEventListener('click',interact);
renderer.domElement.addEventListener('click',()=>renderer.domElement.focus());
let swing=0;function tick(time){requestAnimationFrame(tick);const dt=Math.min(.045,(time-last)/1000||0);last=time;nowTime+=dt;const vx=Number(!!keys.KeyD)-Number(!!keys.KeyA),vz=Number(!!keys.KeyS)-Number(!!keys.KeyW);const length=Math.hypot(vx,vz);
if(!battle&&length){const speed=keys.ShiftLeft?13:7;pos.x+=vx/length*speed*dt;pos.z+=vz/length*speed*dt;let r=Math.hypot(pos.x,pos.z);if(r>38){pos.x*=38/r;pos.z*=38/r}player.rotation.y=Math.atan2(vx,-vz);swing+=dt*12;limbs[0].rotation.x=Math.sin(swing)*.45;limbs[1].rotation.x=-Math.sin(swing)*.45}else{limbs[0].rotation.x*=.8;limbs[1].rotation.x*=.8}
player.position.set(pos.x,Math.abs(Math.sin(swing))*Math.min(.06,length*.06),pos.z);
for(const v of villagers){v.obj.position.y=Math.sin(nowTime*2+v.base.x)*.18;v.obj.rotation.y=Math.sin(nowTime*.9+v.base.z)*.23}
for(const s of spots)s.g.visible=nowTime>=s.ready;
const target=new THREE.Vector3(pos.x,2,pos.z),cp=target.clone().add(new THREE.Vector3(16,zoom,19));camera.position.lerp(cp,Math.min(1,dt*4));camera.lookAt(target);
if(nowTime>noticeUntil&&$('hint').textContent!==defaultHint)$('hint').textContent=defaultHint;
if(isIsland&&Math.floor(nowTime)%2===0&&Math.floor((nowTime-dt)*.5)!==Math.floor(nowTime*.5))refreshPlots();
renderer.render(scene,camera)}
const defaultHint=isIsland?'WASD laufen · Shift rennen · E sammeln/reden/pflanzen · Sammle Samen am Strand':'WASD bewegen · E herausfordern oder Kristalle sammeln · Team oben verwalten';
$('hint').textContent=defaultHint;renderHud();requestAnimationFrame(tick);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
