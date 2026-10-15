'use strict';
/* ===== CONFIGURACIÓN: cambia aquí nombre, colores y física ===== */
const CFG={name:'Sky Bounce',body:'#5cb8ff',belly:'#e8f9ff',horn:'#ffd95a',fin:'#2f86dd',
skyLow:['#3b8cff','#c6ecff'],skyHigh:['#1a1d5c','#7a5cd6'],
g:1500,maxV:1900,drag:.1,thrust:2300,coinPts:10};

const $=id=>document.getElementById(id),R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(a,b)=>((a%b)+b)%b;
const cv=$('c'),cx=cv.getContext('2d'),KEY='skybounce.v1';
let save={best:0,coins:0,up:{power:0,energy:0,bounce:0}};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s)save={...save,...s,up:{...save.up,...s.up}}}catch(e){}
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}};
document.title=CFG.name;$('title').textContent=CFG.name;

/* ===== Sonido (Web Audio, sin archivos) ===== */
let ac;
function snd(f,d=.12,t='sine',s=0,v=.15){try{ac=ac||new AudioContext();const n=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(s)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+s),n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(ac.destination);o.start(n);o.stop(n+d)}catch(e){}}

/* ===== Pantalla ===== */
let W,H,D,S,vw,vh;
function resize(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D;S=Math.min(H/760,W/700);vw=W/S;vh=H/S}
addEventListener('resize',resize);resize();

/* ===== Estado ===== */
let mode='menu',P,cam,objs,parts,nextX,run,meter=0,down=false,shake=0,tm=0,timer=0,overT=0;
const maxEn=()=>100+save.up.energy*25;
const CL=Array.from({length:36},(_,i)=>({u:R(),v:R(),s:.7+R()*1.1,l:i%3}));
function reset(){P={x:0,y:-46,vx:0,vy:0,rot:-.4,en:maxEn(),r:30,dash:0,combo:0,mouth:0,thr:false};
objs=[];parts=[];nextX=600;run={coins:0,dist:0,score:0};cam={x:-vw*.28,y:-vh*.82};gen()}

function gen(){while(nextX<P.x+2600){const d=nextX/50,t=R(),k=t<.5?'cloud':t<.8?'jelly':t<.92?'fuel':'boost';
objs.push({k,x:nextX,y:-(120+R()*(450+Math.min(d*2,500))),r:k==='cloud'?46:k==='jelly'?40:30});
if(R()<.8){const n=3+(R()*4|0),cy=-(100+R()*700);for(let i=0;i<n;i++)objs.push({k:'coin',x:nextX+120+i*50,y:cy-Math.sin(i/(n-1)*Math.PI)*70,r:16})}
if(d>60&&R()<Math.min(.5,d/600)){const by=-(150+R()*800);objs.push({k:'bird',x:nextX+260,y:by,by,r:26,ph:R()*6})}
nextX+=420+Math.min(d,400)*.9+R()*300}}

/* ===== Física ===== */
function seg(ax,ay,bx,by,px,py){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1);const x=ax+t*dx-px,y=ay+t*dy-py;return x*x+y*y}
function spawn(x,y,n,c,sp,k){for(let i=0;i<n;i++){const a=R()*6.28,s=sp*(.3+R()*.7);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0,m:.5+R()*.4,c,k,s:3+R()*5})}}
const ftxt=(x,y,t,c)=>parts.push({k:'txt',x,y,vx:0,vy:-70,l:0,m:.8,c,t});

function phys(h){
const sink=mode==='sink';
P.thr=down&&P.en>0&&!sink;
if(P.thr){P.vy-=CFG.thrust*h;P.en=Math.max(0,P.en-32*h);if(R()<.4)spawn(P.x-30,P.y+8,1,'#fff',60,'dot')}
P.vy+=(P.dash>0?CFG.g*.25:CFG.g)*h;
if(P.dash>0){P.dash-=h;P.vx=Math.max(P.vx,1500);if(R()<.6)spawn(P.x-30,P.y,1,'#ffb347',120,'dot')}
P.vx-=P.vx*CFG.drag*h;
if(sink){P.vx*=.97;P.vy=Math.min(P.vy,350)}else P.vx=Math.max(P.vx,180);
P.vx=clamp(P.vx,0,CFG.maxV);P.vy=clamp(P.vy,-CFG.maxV,CFG.maxV);
const ox=P.x,oy=P.y;P.x+=P.vx*h;P.y+=P.vy*h;
if(!sink){collide(ox,oy);
if(P.y+10>0&&P.vy>0){mode='sink';timer=.9;spawn(P.x,0,18,'#9fe3ff',340,'dot');snd(220,.4,'sine',-120);shake=8}}
P.rot+=(clamp(Math.atan2(P.vy,Math.max(P.vx,200)),-.9,.9)-P.rot)*Math.min(1,h*10);
if(P.mouth>0)P.mouth-=h;
gen()}

function collide(ox,oy){for(const o of objs){if(o.dead||Math.abs(o.x-P.x)>320)continue;
const rr=o.r+P.r*(o.k==='coin'?1:.8);if(seg(ox,oy,P.x,P.y,o.x,o.y)>rr*rr)continue;const k=o.k;
if(k==='coin'){o.dead=1;run.coins++;run.score+=CFG.coinPts;snd(880+run.coins%8*60,.1,'square',300,.07);spawn(o.x,o.y,6,'#ffe14d',200,'star')}
else if(k==='fuel'){o.dead=1;P.en=Math.min(maxEn(),P.en+45);snd(520,.2,'triangle',500);spawn(o.x,o.y,8,'#7fe8ff',200,'dot');ftxt(o.x,o.y,'+Energía','#bff')}
else if(k==='boost'){o.dead=1;P.dash=1.2;snd(300,.45,'sawtooth',700,.1);shake=6;spawn(o.x,o.y,12,'#ff9a3c',300,'star');ftxt(o.x,o.y,'¡Turbo!','#ffd27a')}
else if(k==='bird'){o.dead=1;P.vx*=.5;P.vy=Math.max(P.vy,250);P.en=Math.max(0,P.en-15);P.combo=0;shake=10;snd(150,.25,'sawtooth',-80,.12);spawn(o.x,o.y,10,'#fff',250,'dot')}
else if(P.vy>-250&&tm-(o.cd||-9)>.3){o.cd=tm;o.sq=1;const j=k==='jelly';
P.vy=-(j?1250:900)*(1+.1*save.up.bounce);P.vx+=j?220:120;P.en=Math.min(maxEn(),P.en+8);P.mouth=.4;P.combo++;
const b=5*Math.min(P.combo,10);run.score+=b;snd(300+Math.min(P.combo,12)*45,.2,'triangle',250,.14);
spawn(o.x,o.y,8,'#fff',260,'star');if(P.combo>1)ftxt(o.x,o.y-40,'x'+P.combo+' +'+b,'#fff')}}}

function launch(){mode='play';const u=save.up.power,m=.45+.55*meter;
P.vx=(650+450*m)*(1+.1*u);P.vy=-(950+500*m)*(1+.06*u);snd(300,.3,'sawtooth',600,.1);shake=8;spawn(P.x,P.y+20,14,'#fff',260,'dot')}

function endGame(){mode='over';overT=tm;const nb=run.dist>save.best;save.coins+=run.coins;if(nb)save.best=run.dist;store();
$('otitle').textContent=nb?'¡Nuevo récord! 🏆':'¡Fin del vuelo!';
$('od').textContent=run.dist+' m';$('os').textContent=run.dist+run.score;$('ok').textContent='🪙 '+run.coins;$('ob').textContent=save.best+' m';
show('hud',0);show('over',1);snd(260,.5,'sine',-150,.12)}

function update(dt){
tm+=dt;shake=Math.max(0,shake-dt*30);
if(mode==='menu'||mode==='aim'){P.y=-46+Math.sin(tm*3)*5;P.rot=-.4+Math.sin(tm*2)*.05;meter=(Math.sin(tm*4)+1)/2}
else if(mode==='play'||mode==='sink'){phys(dt/2);phys(dt/2)}
if(mode==='sink'){timer-=dt;if(timer<=0)endGame()}
for(const o of objs){if(o.k==='bird')o.y=o.by+Math.sin(tm*2+o.ph)*40;if(o.sq)o.sq=Math.max(0,o.sq-dt*4)}
if(objs.length>140)objs=objs.filter(o=>o.x>P.x-700&&!o.dead);
for(const p of parts){p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k!=='txt')p.vy+=300*dt}
parts=parts.filter(p=>p.l<p.m);
cam.x=P.x-vw*.28;cam.y+=(Math.min(P.y-vh*.5,-vh*.82)-cam.y)*Math.min(1,dt*5);
if(mode==='play'||mode==='sink'){run.dist=Math.max(run.dist,P.x/50|0);
$('d').textContent=run.dist+' m';$('s').textContent=run.dist+run.score;$('k').textContent=run.coins;$('e').style.width=P.en/maxEn()*100+'%'}}

/* ===== Dibujo ===== */
const circ=(x,y,r)=>{cx.moveTo(x+r,y);cx.arc(x,y,r,0,7)};
function star(x,y,r,c){cx.fillStyle=c;cx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,q=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}cx.fill()}
const hex=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const mix=(a,b,t)=>'rgb('+hex(a).map((v,i)=>(v+(hex(b)[i]-v)*t)|0)+')';
function cloud(x,y,s){cx.beginPath();circ(x,y,30*s);circ(x+34*s,y-16*s,38*s);circ(x+72*s,y,32*s);circ(x+36*s,y+8*s,30*s);cx.fill()}

function drawObj(o){const k=o.k,q=o.sq||0;cx.save();cx.translate(o.x,o.y);
if(k==='coin'){cx.scale(Math.abs(Math.cos(tm*5+o.x*.01))*.8+.2,1);cx.fillStyle='#ffd23f';cx.strokeStyle='#e69a00';cx.lineWidth=4;cx.beginPath();cx.arc(0,0,o.r,0,7);cx.fill();cx.stroke();star(0,0,o.r*.6,'#fff3a6')}
else if(k==='cloud'){cx.scale(1+q*.3,1-q*.3);cx.fillStyle='#fff';cx.beginPath();circ(-24,6,24);circ(0,-8,30);circ(24,6,24);cx.fill();
cx.fillStyle='#345';cx.beginPath();circ(-9,-4,4);circ(9,-4,4);cx.fill();cx.strokeStyle='#345';cx.lineWidth=3;cx.beginPath();cx.arc(0,2,8,.2,Math.PI-.2);cx.stroke()}
else if(k==='jelly'){cx.scale(1+q*.3,1-q*.3);cx.strokeStyle='#ff9ad9';cx.lineWidth=5;cx.lineCap='round';
for(let i=-2;i<=2;i++){cx.beginPath();cx.moveTo(i*11,6);for(let y=1;y<=4;y++)cx.lineTo(i*11+Math.sin(tm*5+y+i)*5,6+y*9);cx.stroke()}
cx.fillStyle='#ff6fc1';cx.beginPath();cx.arc(0,6,o.r,Math.PI,0);cx.fill();cx.fillStyle='#fff';cx.beginPath();circ(-12,-4,5);circ(12,-4,5);cx.fill();cx.fillStyle='#345';cx.beginPath();circ(-11,-4,2.5);circ(13,-4,2.5);cx.fill()}
else if(k==='fuel'){cx.fillStyle='rgba(130,230,255,.55)';cx.strokeStyle='#fff';cx.lineWidth=4;cx.beginPath();cx.arc(0,0,o.r,0,7);cx.fill();cx.stroke();
cx.fillStyle='#fff';cx.beginPath();cx.moveTo(4,-14);cx.lineTo(-9,3);cx.lineTo(-1,3);cx.lineTo(-5,15);cx.lineTo(9,-3);cx.lineTo(1,-3);cx.fill()}
else if(k==='boost'){const s=1+.08*Math.sin(tm*8);cx.scale(s,s);cx.fillStyle='#ff7a1a';cx.strokeStyle='#ffd27a';cx.lineWidth=4;cx.beginPath();cx.arc(0,0,o.r,0,7);cx.fill();cx.stroke();
cx.fillStyle='#fff';cx.font='900 34px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('»',0,-3)}
else{const f=Math.sin(tm*12+o.ph)*.6;cx.fillStyle='#e8484f';cx.beginPath();cx.ellipse(0,0,28,20,0,0,7);cx.fill();
cx.fillStyle='#b82f3a';cx.save();cx.rotate(f);cx.beginPath();cx.ellipse(-4,-16,16,8,-.5,0,7);cx.fill();cx.restore();
cx.fillStyle='#ffc233';cx.beginPath();cx.moveTo(-24,-4);cx.lineTo(-42,2);cx.lineTo(-24,8);cx.fill();
cx.fillStyle='#fff';cx.beginPath();cx.arc(-12,-6,6,0,7);cx.fill();cx.fillStyle='#222';cx.beginPath();cx.arc(-14,-6,3,0,7);cx.fill()}
cx.restore()}

function drawP(){cx.save();cx.translate(P.x,P.y);cx.rotate(P.rot);cx.lineJoin='round';
if(P.dash>0){cx.fillStyle='rgba(255,170,60,.85)';cx.beginPath();cx.moveTo(-34,-12);cx.lineTo(-100-R()*30,0);cx.lineTo(-34,12);cx.fill()}
const fl=Math.sin(tm*14)*.3;
cx.fillStyle=CFG.fin;cx.save();cx.translate(-34,0);cx.rotate(fl);cx.beginPath();cx.moveTo(8,0);cx.quadraticCurveTo(-18,-30,-40,-26);cx.quadraticCurveTo(-30,-6,-34,0);cx.quadraticCurveTo(-30,6,-40,26);cx.quadraticCurveTo(-18,30,8,0);cx.fill();cx.restore();
cx.fillStyle=CFG.horn;cx.strokeStyle='#d99a1a';cx.lineWidth=3;cx.beginPath();cx.moveTo(30,-8);cx.lineTo(84,-16);cx.lineTo(32,4);cx.closePath();cx.fill();cx.stroke();
cx.beginPath();for(let i=0;i<4;i++){cx.moveTo(42+i*10,-10-i*1.2);cx.lineTo(46+i*10,-2-i*1.2)}cx.stroke();
cx.fillStyle=CFG.body;cx.strokeStyle='#2477c9';cx.lineWidth=3;cx.beginPath();cx.ellipse(0,0,40,29,0,0,7);cx.fill();cx.stroke();
cx.fillStyle=CFG.belly;cx.beginPath();cx.ellipse(4,13,30,12,0,0,Math.PI);cx.fill();
cx.fillStyle=CFG.fin;cx.save();cx.translate(-4,12);cx.rotate(-fl*1.5);cx.beginPath();cx.ellipse(0,10,8,15,.3,0,7);cx.fill();cx.restore();
cx.fillStyle='rgba(255,120,160,.5)';cx.beginPath();cx.arc(10,5,6,0,7);cx.fill();
const blink=tm%3<.12;
if(blink){cx.strokeStyle='#234';cx.lineWidth=3;cx.beginPath();cx.moveTo(10,-8);cx.lineTo(24,-8);cx.stroke()}
else{const big=P.vy>600?12:10;cx.fillStyle='#fff';cx.beginPath();cx.arc(17,-8,big,0,7);cx.fill();cx.fillStyle='#123';cx.beginPath();cx.arc(20,-8+clamp(P.vy/400,-1,2),5,0,7);cx.fill();cx.fillStyle='#fff';cx.beginPath();cx.arc(22,-11,1.8,0,7);cx.fill()}
cx.strokeStyle='#234';cx.fillStyle='#7a2040';cx.lineWidth=3;cx.beginPath();
if(P.thr||P.mouth>0||P.vy>700){cx.ellipse(25,10,6,5,0,0,7);cx.fill()}else{cx.arc(22,5,8,.2,Math.PI-.5);cx.stroke()}
cx.restore()}

function draw(){
cx.setTransform(D*S,0,0,D*S,0,0);
const t=clamp(-cam.y/7000,0,1),g=cx.createLinearGradient(0,0,0,vh);
g.addColorStop(0,mix(CFG.skyLow[0],CFG.skyHigh[0],t));g.addColorStop(1,mix(CFG.skyLow[1],CFG.skyHigh[1],t));
cx.fillStyle=g;cx.fillRect(0,0,vw,vh);
if(t>.3){cx.fillStyle='#fff';for(let i=0;i<50;i++){cx.globalAlpha=(t-.25)*(.5+.5*Math.sin(tm*2+i));cx.fillRect(mod(i*173.3,vw),mod(i*91.7,vh*.8),2.5,2.5)}}
const sx=vw+500,sy=vh+300;
for(const c of CL){const f=[.1,.25,.5][c.l];cx.globalAlpha=[.45,.7,.9][c.l];cx.fillStyle='#fff';cloud(mod(c.u*sx-cam.x*f,sx)-250,mod(c.v*sy-cam.y*f,sy)-150,c.s*(.6+.3*c.l))}
cx.globalAlpha=1;
cx.save();if(shake)cx.translate((R()-.5)*shake,(R()-.5)*shake);cx.translate(-cam.x,-cam.y);
const x0=cam.x-30,x1=cam.x+vw+30;
const wave=(c,a,ph,off)=>{cx.fillStyle=c;cx.beginPath();cx.moveTo(x0,cam.y+vh+60);for(let x=x0;x<=x1;x+=30)cx.lineTo(x,off+Math.sin(x*.02+tm*2+ph)*a);cx.lineTo(x1,cam.y+vh+60);cx.fill()};
if(cam.y+vh>-40){wave('#52c4f5',6,0,-6);}
for(let k=Math.max(1,Math.floor(cam.x/5000));k*5000<x1+200;k++){const x=k*5000;cx.fillStyle='#8a5a2b';cx.fillRect(x-4,-70,8,70);cx.fillStyle='#fff';cx.fillRect(x-50,-100,100,36);cx.fillStyle='#1c5fc4';cx.font='900 22px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(k*100+' m',x,-82)}
cx.fillStyle='#c98a4b';cx.fillRect(-140,-14,240,22);cx.fillStyle='#8a5a2b';cx.fillRect(-120,8,16,40);cx.fillRect(70,8,16,40);cx.fillRect(-140,-14,240,6);
for(const o of objs)if(!o.dead&&o.x>x0-100&&o.x<x1+100)drawObj(o);
for(const p of parts){cx.globalAlpha=1-p.l/p.m;if(p.k==='star')star(p.x,p.y,p.s*1.6,p.c);else if(p.k==='txt'){cx.fillStyle=p.c;cx.font='900 24px sans-serif';cx.textAlign='center';cx.fillText(p.t,p.x,p.y)}else{cx.strokeStyle=p.c;cx.lineWidth=2;cx.beginPath();cx.arc(p.x,p.y,p.s,0,7);cx.stroke()}}
cx.globalAlpha=1;
if(mode!=='over')drawP();
if(cam.y+vh>-40)wave('rgba(30,134,208,.85)',8,2,4);
cx.restore();
if(mode==='aim'){const x=vw/2-130,y=vh-90;cx.fillStyle='rgba(20,50,120,.5)';cx.fillRect(x-6,y-6,272,34);const gr=cx.createLinearGradient(x,0,x+260,0);gr.addColorStop(0,'#ffe45c');gr.addColorStop(1,'#ff5a3c');cx.fillStyle=gr;cx.fillRect(x,y,260,22);cx.fillStyle='#fff';cx.fillRect(x+meter*260-4,y-10,8,42);
cx.font='900 24px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=5;cx.strokeText('¡Toca o pulsa Espacio para lanzar!',vw/2,y-34);cx.fillText('¡Toca o pulsa Espacio para lanzar!',vw/2,y-34)}
if(mode==='play'&&run.dist<30){cx.font='900 22px sans-serif';cx.textAlign='center';cx.fillStyle='#fff';cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=5;cx.strokeText('Mantén pulsado para impulsarte',vw/2,vh-60);cx.fillText('Mantén pulsado para impulsarte',vw/2,vh-60)}}

/* ===== Interfaz y entrada ===== */
const UPG=[['power','Potencia','Lanzamiento más fuerte'],['energy','Energía','Más combustible'],['bounce','Rebote','Rebotes más potentes']];
function renderShop(){$('coins').textContent=save.coins;$('best').textContent=save.best;$('shop').innerHTML='';
UPG.forEach(([k,n,d])=>{const lv=save.up[k],cost=25*(lv+1)*(lv+1),b=document.createElement('button');b.className='up';b.disabled=lv>=5||save.coins<cost;
b.innerHTML=`<b>${n}</b> Nv.${lv}/5<small>${d}</small><span>${lv>=5?'MAX':cost+' 🪙'}</span>`;
b.onclick=()=>{save.coins-=cost;save.up[k]++;store();snd(660,.15,'triangle',400);renderShop()};$('shop').appendChild(b)})}
const show=(id,v)=>$(id).classList.toggle('hide',!v);
function start(){show('menu',0);show('hud',1);reset();mode='aim'}
function retry(){show('over',0);show('hud',1);reset();mode='aim'}
function toMenu(){show('over',0);show('hud',0);reset();mode='menu';show('menu',1);renderShop()}
$('play').onclick=start;$('retry').onclick=retry;$('tomenu').onclick=toMenu;

function press(){if(mode==='aim'){launch();return}down=true}
cv.addEventListener('pointerdown',e=>{e.preventDefault();press()});
addEventListener('pointerup',()=>down=false);addEventListener('pointercancel',()=>down=false);
const KS=['Space','ArrowUp','KeyW'];
addEventListener('keydown',e=>{if(e.repeat||!KS.includes(e.code))return;e.preventDefault();
if(mode==='menu')start();else if(mode==='over'){if(tm-overT>.5)retry()}else press()});
addEventListener('keyup',e=>{if(KS.includes(e.code))down=false});
addEventListener('blur',()=>down=false);

let last=0;
function loop(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;update(dt);draw();requestAnimationFrame(loop)}
reset();renderShop();requestAnimationFrame(loop);
