/* Nautilak Cross-Game Expedition Economy v1.
   Client-side prototype only: balances are local and not secure multiplayer currency. */
(function(){
'use strict';
const KEY='nautilak-expedition-economy-v1';
const RES={
 sky:{name:'Himmelsplitter',icon:'💠',color:'#83dcee',from:'Skyrail Rush'},
 ember:{name:'Glutkerne',icon:'🔥',color:'#ffa379',from:'Wardens of Emberfall'},
 prism:{name:'Prismen',icon:'🔮',color:'#c4a6ff',from:'Prism Forge'},
 seed:{name:'Wildsamen',icon:'🌱',color:'#9bdda2',from:'Mossbay'},
 sigil:{name:'Seelensiegel',icon:'✦',color:'#f8d194',from:'Aetherkin'},
 relic:{name:'Reliktfragmente',icon:'⚔',color:'#d1c3a2',from:'Nautilak Universe'}
};
const UP={
 windboots:{name:'Windläufer-Stiefel',icon:'👢',game:'Skyrail Rush',desc:'Starte jeden Lauf mit 4 Sekunden Schutzschild.',cost:{sky:8,prism:4}},
 wardseal:{name:'Wächter-Siegel',icon:'🛡',game:'Emberfall',desc:'Starte jede Partie mit 100 zusätzlichem Gold.',cost:{ember:8,sky:4}},
 lens:{name:'Prismenlinse',icon:'🔍',game:'Prism Forge',desc:'Beginne jede Runde mit 35 Prisma-Energie.',cost:{prism:8,ember:4}},
 garden:{name:'Wachstumstalisman',icon:'🌿',game:'Mossbay',desc:'Deine Pflanzen benötigen nur noch 10 statt 18 Sekunden.',cost:{seed:7,prism:4}},
 kinbond:{name:'Seelenband',icon:'🤝',game:'Aetherkin',desc:'Erhöht die Chance auf Freundschaft mit geschwächten Kreaturen.',cost:{sigil:7,seed:4}},
 blessing:{name:'Heldenmal',icon:'✧',game:'Nautilak Universe',desc:'Erhalte 25 % mehr Erfahrungspunkte für deine Skills.',cost:{relic:7,ember:4}}
};
const fresh=()=>({wallet:Object.fromEntries(Object.keys(RES).map(k=>[k,0])),upgrades:{},stats:{},history:[],revision:1});
function read(){let s=fresh();try{let raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&typeof raw==='object'){for(const k of Object.keys(RES)){let n=Number(raw.wallet&&raw.wallet[k]);s.wallet[k]=Number.isFinite(n)?Math.max(0,Math.min(999999,Math.floor(n))):0}if(raw.upgrades&&typeof raw.upgrades==='object')for(const k of Object.keys(UP))s.upgrades[k]=raw.upgrades[k]===true;if(raw.stats&&typeof raw.stats==='object')s.stats=raw.stats;if(Array.isArray(raw.history))s.history=raw.history.slice(0,40)}}catch(e){}return s}
let state=read(),subscribers=[];
const snap=()=>JSON.parse(JSON.stringify(state));
function store(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}for(const fn of subscribers){try{fn(snap())}catch(e){}}if(typeof window!=='undefined'&&window.dispatchEvent)try{window.dispatchEvent(new Event('nautilak:economy'))}catch(e){}}
function log(message,source){state.history.unshift({message:String(message).slice(0,200),source:String(source||'').slice(0,60),at:Date.now()});state.history=state.history.slice(0,40)}
function toast(message){if(typeof document==='undefined')return;let el=document.getElementById('nautilakEconToast');if(!el){el=document.createElement('div');el.id='nautilakEconToast';el.style.cssText='position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:99999;max-width:min(520px,90vw);background:#152839ef;color:#f6e9c3;border:1px solid #b7cca7;border-radius:9px;padding:11px 15px;font:12px system-ui,sans-serif;box-shadow:0 10px 35px #0008;pointer-events:none;opacity:0;transition:opacity .2s;text-align:center';document.body.appendChild(el)}el.textContent=message;el.style.opacity='1';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity='0',2300)}
function award(type,amount,reason){if(!(type in RES))return false;const n=Math.floor(Number(amount));if(!Number.isFinite(n)||n<1||n>100)return false;state.wallet[type]=Math.min(999999,state.wallet[type]+n);state.stats[type+'Earned']=(Number(state.stats[type+'Earned'])||0)+n;log('+'+n+' '+RES[type].name+' · '+(reason||'Expedition'),RES[type].from);store();toast(RES[type].icon+' +'+n+' '+RES[type].name+' · '+(reason||'Expedition'));return true}
function mark(key,amount=1){if(!/^[a-zA-Z0-9_-]{1,50}$/.test(key))return;state.stats[key]=(Number(state.stats[key])||0)+amount;store()}
function unlocked(key){return state.upgrades[key]===true}
function canCraft(key){let up=UP[key];return !!up&&!unlocked(key)&&Object.entries(up.cost).every(([k,v])=>state.wallet[k]>=v)}
function craft(key){let up=UP[key];if(!up)return {ok:false,message:'Unbekanntes Upgrade'};if(unlocked(key))return {ok:false,message:'Bereits hergestellt'};if(!canCraft(key))return {ok:false,message:'Nicht genügend Materialien'};
 for(const [k,v] of Object.entries(up.cost))state.wallet[k]-=v;state.upgrades[key]=true;log('Hergestellt: '+up.name,up.game);store();toast('✦ Upgrade freigeschaltet: '+up.name);return {ok:true,message:up.name+' freigeschaltet'}}
function getBalance(k){return state.wallet[k]||0}
function mountWallet(){if(typeof document==='undefined'||!document.body||document.getElementById('nautilakEconWallet'))return;
 const box=document.createElement('a');box.id='nautilakEconWallet';box.href='./expeditions.html';box.title='Gemeinsame Ressourcen und Werkstatt';box.style.cssText='position:fixed;left:12px;top:88px;z-index:25;background:#101c28e8;color:#dff4ef;text-decoration:none;border:1px solid #77afada9;border-radius:7px;padding:7px 10px;font:11px system-ui,sans-serif;box-shadow:0 8px 24px #0006;max-width:210px';
 function draw(){let owned=Object.keys(RES).filter(k=>state.wallet[k]>0);box.textContent='🧰 WERKSTATT · '+(owned.length?owned.map(k=>RES[k].icon+state.wallet[k]).join(' '):'Ressourcen sammeln');}
 draw();document.body.appendChild(box);subscribe(draw)}
function subscribe(fn){if(typeof fn!=='function')return ()=>{};subscribers.push(fn);return ()=>{subscribers=subscribers.filter(f=>f!==fn)}}
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===KEY){state=read();for(const fn of subscribers)try{fn(snap())}catch(err){}}});
const api={RES,UP,snapshot:snap,award,mark,unlocked,canCraft,craft,getBalance,subscribe,mountWallet};
if(typeof window!=='undefined')window.NautilakEconomy=api;
})();
