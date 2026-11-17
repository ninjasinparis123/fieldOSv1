import * as THREE from 'three';
export function makeCreature(kind){
 const dragon=kind==='dragon'||kind==='beast',g=new THREE.Group();
 const skin=new THREE.MeshStandardMaterial({color:dragon?0xb64d39:0x62bac7,roughness:.52,metalness:.22,flatShading:true});
 const glow=new THREE.MeshStandardMaterial({color:dragon?0xe9b782:0x82e8ee,emissive:dragon?0x250700:0x15677d,emissiveIntensity:.55,roughness:.44});
 const ivory=new THREE.MeshLambertMaterial({color:0xe5d9bb}),ball=new THREE.SphereGeometry(1,14,10);
 function add(geo,mat,p,sc=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...sc);m.castShadow=true;g.add(m);return m}
 add(ball,skin,[0,2.25,0],[dragon?1:.71,1,.65]);add(ball,skin,[0,3.38,.43],[dragon?.72:.45,.56,dragon?.83:.49]);add(ball,glow,[0,3.09,1.07],[.5,.23,.32]);
 for(const sign of [-1,1]){add(new THREE.CylinderGeometry(.24,.34,1.5,9),skin,[sign*.91,2.03,0]);add(new THREE.CylinderGeometry(.33,.39,1.46,9),skin,[sign*.4,.78,0]);
  if(dragon){add(new THREE.ConeGeometry(.24,.75,9),ivory,[sign*.53,4.04,.25]);const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(sign*.8,1.0);shape.lineTo(sign*2.2,1.55);shape.lineTo(sign*1.55,0);shape.lineTo(sign*2.25,-.45);shape.lineTo(sign*.53,-.45);shape.closePath();const wing=add(new THREE.ShapeGeometry(shape),skin,[0,2.5,-.7]);wing.material=skin.clone();wing.material.side=THREE.DoubleSide}
  else{add(new THREE.OctahedronGeometry(.33,0),glow,[sign*1.02,1.29,.13]);add(new THREE.OctahedronGeometry(.24,0),glow,[sign*.86,3.69,-.1])}}
 if(dragon){let tail=add(new THREE.ConeGeometry(.38,2.8,9),skin,[0,1.76,-1.64]);tail.rotation.x=-Math.PI/2.5;for(let i=0;i<5;i++)add(new THREE.ConeGeometry(.19,.56,8),ivory,[0,3.6-i*.48,-.41-i*.23])}
 else{for(let i=0;i<7;i++){const a=i*Math.PI*2/7;add(new THREE.OctahedronGeometry(.13,.1),glow,[Math.cos(a)*1.09,2.9+Math.sin(a)*.58,Math.sin(a)*.7])}}
 return g
}
export function enhanceArena(opts){
 const {scene,renderer,characters,pedestalPoints,getPosition,getYaw,getPlayer,getSelected,getLoaded,setPlayer,getKeys,status}=opts;
 const $=id=>document.getElementById(id);
 const extra=[
 {id:'elemental',name:'Elementar',elements:'Feuer + Wasser',asset:'procedural',color:0x6ecbd9},
 {id:'shifter',name:'Gestaltwandler',elements:'Erde + Luft',model:'orc.glb',asset:'jev',color:0x7d9a6e},
 {id:'dragon',name:'Drache',elements:'Feuer + Luft',asset:'procedural',color:0xd97653},
 {id:'assassin',name:'Assassine',elements:'Wasser + Feuer',model:'rogue.glb',asset:'jev',color:0x786f9c}
 ];
 characters.push(...extra);for(let i=4;i<8;i++){const a=i*Math.PI*2/8-Math.PI/2;pedestalPoints.push([Math.cos(a)*30,Math.sin(a)*30])}
 const roster=$('roster'),fps=$('fps');roster.querySelector('h2').textContent='ACHT HELDEN';
 for(const char of extra){const button=document.createElement('button');button.className='choice';button.dataset.character=char.id;button.innerHTML=char.name+'<small>'+char.elements+'</small>';roster.insertBefore(button,fps);button.addEventListener('click',()=>setPlayer(char.id))}
 const mapLink=document.createElement('a');mapLink.href='./world.html';mapLink.id='mapLink';mapLink.textContent='🌳 Die offene Welt betreten';roster.append(mapLink);
 const combat=document.createElement('section');combat.id='combat';combat.innerHTML='<strong>ARENA-KAMPF</strong> · LP <span id="hp">100</span>/100 · <span id="score">0 Treffer</span><div id="healthbar"><div id="healthfill"></div></div><div class="slots">'+[
 ['melee1','J · Hieb'],['melee2','K · Wirbel'],['melee3','L · Sprungschlag'],['shield','Q · Schild'],['range1','1 · Feuerkugel'],['range2','2 · Eisspeer'],['range3','3 · Splittersturm'],['dash','R · Dash']].map(([k,label])=>'<button data-ability="'+k+'">'+label+'</button>').join('')+'</div><div id="combatMessage">6 Attacken · Schild · Dash · T Gestaltwechsel</div>';
 document.body.insertBefore(combat,$('loading'));
 const css=document.createElement('style');css.textContent='#combat{position:fixed;bottom:105px;left:20px;z-index:5;width:min(550px,calc(100vw - 40px));padding:10px;background:#101a20e6;border:1px solid #b7a47e80;border-radius:6px;font:11px system-ui,sans-serif}#combat .slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:8px}#combat button{background:#29343b;color:#f2e1bb;border:1px solid #998669a0;border-radius:4px;padding:7px 2px;font:11px system-ui,sans-serif}#combat button.cooling{opacity:.4}#healthbar{height:8px;border:1px solid #866e57;background:#352b2b;overflow:hidden;border-radius:7px;margin:5px 0}#healthfill{height:100%;width:100%;background:linear-gradient(90deg,#aa2839,#ec9868)}#combatMessage{color:#d8c291;margin-top:6px}#roster{max-height:calc(100vh - 25px);overflow-y:auto}#mapLink{display:block;text-decoration:none;color:#fae4b9;padding:9px;background:#29473d;border:1px solid #aa9c70;border-radius:4px;font:12px system-ui,sans-serif;margin-top:8px}@media(max-width:700px){#combat{bottom:85px;left:8px;width:calc(100vw - 16px);padding:4px}#combat .slots{gap:2px;margin-top:3px}#combat button{font-size:9px;padding:5px 1px}#roster{max-height:45vh}}';document.head.append(css);
 const gateGroup=new THREE.Group();gateGroup.position.set(0,0,-38);scene.add(gateGroup);
 const gateStone=new THREE.MeshStandardMaterial({color:0x76827f,roughness:.79}),portalMat=new THREE.MeshBasicMaterial({color:0x65bbab,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false});
 for(const k of [-1,1]){let pillar=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.25,11,9),gateStone);pillar.position.set(k*4.1,5.5,0);gateGroup.add(pillar)}
 let arch=new THREE.Mesh(new THREE.TorusGeometry(4.55,.7,9,36),gateStone);arch.position.y=9;gateGroup.add(arch);
 let disc=new THREE.Mesh(new THREE.CircleGeometry(3.8,40),portalMat);disc.position.set(0,5,.15);gateGroup.add(disc);
 let c=document.createElement('canvas');c.width=512;c.height=96;let ct=c.getContext('2d');ct.fillStyle='#152421';ct.fillRect(0,0,512,96);ct.fillStyle='#f3ddb0';ct.font='bold 29px Georgia';ct.textAlign='center';ct.fillText('WELTENTOR  [E]',256,61);let title=new THREE.Mesh(new THREE.PlaneGeometry(8,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));title.position.set(0,12,.1);gateGroup.add(title);
 const effectList=[],shots=[],targets=[];
 const abilityKeys={KeyJ:'melee1',KeyK:'melee2',KeyL:'melee3',Digit1:'range1',Digit2:'range2',Digit3:'range3',KeyQ:'shield',KeyR:'dash'};
 const cd={melee1:.38,melee2:1.5,melee3:2.3,range1:.85,range2:1.35,range3:3,shield:5,dash:2.6},ready={},S={time:0,hp:100,hits:0,guardUntil:0,dashRemaining:0,dashVec:new THREE.Vector3(),invulnerableUntil:0,beast:false,oldBody:null};
 const matDummy=new THREE.MeshLambertMaterial({color:0xa88a6d});
 for(const [x,z] of [[0,-12],[12,4],[-12,4],[0,22],[23,4],[-23,4]]){const group=new THREE.Group();group.position.set(x,0,z);const material=matDummy.clone(),body=new THREE.Mesh(new THREE.CylinderGeometry(.75,.9,3,10),material);body.position.y=1.85;group.add(body);const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,1),matDummy);head.position.y=3.8;group.add(head);scene.add(group);targets.push({group,body,hp:100,respawn:0,attack:S.time+3+Math.random()*2})}
 function forward(){return new THREE.Vector3(Math.sin(getYaw()),0,Math.cos(getYaw()))}
 function glow(x,y,z,color,size=.5,ttl=.3){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(size,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false}));mesh.position.set(x,y,z);scene.add(mesh);effectList.push({mesh,t:ttl,total:ttl})}
 function hit(target,dmg){if(target.hp<=0)return;target.hp-=dmg;S.hits++;glow(target.group.position.x,2.6,target.group.position.z,0xffe3ae,.5,.27);target.body.material.color.setHex(target.hp>0?0xd69a7a:0x505d50);$('score').textContent=S.hits+' Treffer';if(target.hp<=0){target.group.visible=false;target.respawn=S.time+4}}
 function melee(dmg,reach,angle,color){const p=getPosition(),f=forward();for(const target of targets){if(target.hp<=0)continue;const dx=target.group.position.x-p.x,dz=target.group.position.z-p.z,d=Math.hypot(dx,dz);if(d>reach)continue;const dot=(dx*f.x+dz*f.z)/(d||1);if(angle>=6.2||dot>Math.cos(angle*.5))hit(target,dmg)}
 const ring=new THREE.Mesh(new THREE.RingGeometry(reach*.65,reach*.82,40,1,0,angle>=6.2?Math.PI*2:angle),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.rotation.z=-getYaw();ring.position.set(p.x,.3,p.z);scene.add(ring);effectList.push({mesh:ring,t:.28,total:.28})}
 function projectile(color,speed,dmg,size,spread=0){const f=forward().applyAxisAngle(new THREE.Vector3(0,1,0),spread),p=getPosition();const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(size,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));mesh.position.set(p.x+f.x*2.1,2.7,p.z+f.z*2.1);scene.add(mesh);shots.push({mesh,vel:f.multiplyScalar(speed),t:2.4,dmg,enemy:false})}
 function ability(name){if(S.time<(ready[name]||0))return false;ready[name]=S.time+cd[name];const c=({knight:0xf0c36e,warrior:0xf56b49,mage:0x79c9ff,spirit:0x83cf83,elemental:0x74efff,shifter:0xc3d588,dragon:0xfd8c5a,assassin:0xb58cff})[getSelected()]||0xe7bc88;
 if(name==='melee1')melee(23,6,1.5,c);
 if(name==='melee2')melee(15,7,6.283,c);
 if(name==='melee3')melee(38,8,1.85,0xf9dc89);
 if(name==='range1')projectile(c,23,20,.53);
 if(name==='range2')projectile(0x8edbff,34,27,.35);
 if(name==='range3')for(const a of [-.36,-.17,0,.17,.36])projectile(c,26,12,.3,a);
 if(name==='shield'){S.guardUntil=S.time+2.3;glow(getPosition().x,2.2,getPosition().z,0x7dceff,2.2,2.3)}
 if(name==='dash'){const k=getKeys(),f=forward(),fw=Number(!!k.KeyW)-Number(!!k.KeyS),side=Number(!!k.KeyD)-Number(!!k.KeyA);const v=new THREE.Vector3(f.x*fw+f.z*side,0,f.z*fw-f.x*side);S.dashVec.copy(v.lengthSq()?v.normalize():f);S.dashRemaining=.17;S.invulnerableUntil=S.time+.3;glow(getPosition().x,1,getPosition().z,0xf5d8aa,1,.28)}
 $('combatMessage').textContent=({melee1:'Klingenhieb',melee2:'Wirbelangriff',melee3:'Sprungschlag',range1:'Elementarkugel',range2:'Eisspeer',range3:'Splittersturm',shield:'Schild',dash:'Dash'})[name]+' aktiviert';return true}
 function transform(){if(getSelected()!=='shifter')return;const p=getPlayer();if(!S.beast){S.oldBody=p.children[0];if(S.oldBody)p.remove(S.oldBody);const beast=makeCreature('beast');beast.scale.setScalar(.9);p.add(beast);S.beast=true}else{p.clear();if(S.oldBody)p.add(S.oldBody);S.beast=false}status.textContent=S.beast?'Bestienform aktiv':'Humanoide Gestalt'}
 function handleKey(e){if(e.repeat||e.target?.closest?.('input,textarea,button,select'))return;if(abilityKeys[e.code]){e.preventDefault();ability(abilityKeys[e.code])}if(e.code==='KeyT')transform();if(e.code==='KeyE'&&Math.hypot(getPosition().x,getPosition().z+38)<7){window.location.href='./world.html'}}
 window.addEventListener('keydown',handleKey);
 combat.querySelectorAll('[data-ability]').forEach(btn=>btn.addEventListener('click',()=>ability(btn.dataset.ability)));
 function update(dt){
  S.time+=dt;const p=getPosition();
  if(S.dashRemaining>0){p.addScaledVector(S.dashVec,dt*60);S.dashRemaining=Math.max(0,S.dashRemaining-dt)}
  const len=Math.hypot(p.x,p.z);if(len>42){p.x*=42/len;p.z*=42/len}
  for(const t of targets){if(t.hp<=0){if(S.time>=t.respawn){t.hp=100;t.group.visible=true;t.body.material.color.setHex(0xa88a6d)}continue}
   if(Math.hypot(p.x-t.group.position.x,p.z-t.group.position.z)<19&&S.time>t.attack){t.attack=S.time+3.4;const dir=new THREE.Vector3(p.x-t.group.position.x,0,p.z-t.group.position.z).normalize();const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,1),new THREE.MeshBasicMaterial({color:0xf77956}));mesh.position.set(t.group.position.x,2.5,t.group.position.z);scene.add(mesh);shots.push({mesh,vel:dir.multiplyScalar(10),t:2,dmg:8,enemy:true})}}
  for(let i=shots.length-1;i>=0;i--){const q=shots[i];q.t-=dt;q.mesh.position.addScaledVector(q.vel,dt);q.mesh.rotation.y+=dt*6;let impacted=false;if(q.enemy){if(q.mesh.position.distanceTo(new THREE.Vector3(p.x,2.5,p.z))<1.5){impacted=true;if(S.time>S.guardUntil&&S.time>S.invulnerableUntil){S.hp=Math.max(0,S.hp-q.dmg);if(!S.hp){S.hp=100;p.set(0,0,10);status.textContent='Du bist wieder in der Arena gespawnt'}}}}else{for(const t of targets){if(t.hp>0&&q.mesh.position.distanceTo(new THREE.Vector3(t.group.position.x,2.5,t.group.position.z))<1.55){hit(t,q.dmg);impacted=true;break}}}
   if(q.t<=0||impacted){scene.remove(q.mesh);q.mesh.geometry.dispose();q.mesh.material.dispose();shots.splice(i,1)}}
  for(let i=effectList.length-1;i>=0;i--){const e=effectList[i];e.t-=dt;e.mesh.material.opacity=.9*Math.max(0,e.t/e.total);if(e.t<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effectList.splice(i,1)}}
  $('hp').textContent=S.hp;$('healthfill').style.width=S.hp+'%';
  for(const button of combat.querySelectorAll('[data-ability]'))button.classList.toggle('cooling',S.time<(ready[button.dataset.ability]||0));
  portalMat.opacity=.55+.15*Math.sin(S.time*2.1);
 }
 return {update,ability,transform}
}
