import * as THREE from './three.module.min.js';
const R=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.fog=new THREE.Fog(0xcfeeff,40,100);
const cam=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.2,300);
{const g=new THREE.SphereGeometry(150,16,10);const c=[],p=g.attributes.position;const top=new THREE.Color(0x8ecbff),mid=new THREE.Color(0xd8f0ff),bot=new THREE.Color(0xffe6ef);
 for(let i=0;i<p.count;i++){const y=p.getY(i)/150;const col=y>0?mid.clone().lerp(top,Math.min(1,y*1.6)):mid.clone().lerp(bot,Math.min(1,-y*3));c.push(col.r,col.g,col.b)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));S.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false})))}
S.add(new THREE.HemisphereLight(0xfff6ee,0xb8e0c0,1.4));
const sun=new THREE.DirectionalLight(0xfff2dd,1.5);sun.castShadow=true;sun.shadow.bias=-0.0015;sun.shadow.normalBias=0.03;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,far:80});S.add(sun,sun.target);
const grad=new THREE.DataTexture(new Uint8Array([195,195,195,255,230,230,230,255,255,255,255,255]),3,1);grad.minFilter=grad.magFilter=THREE.NearestFilter;grad.needsUpdate=true;
const mats={};const M=c=>mats[c]||(mats[c]=new THREE.MeshToonMaterial({color:c,gradientMap:grad}));
const OL=new THREE.MeshBasicMaterial({color:0x3a2a22,side:THREE.BackSide});
const mesh=(g,c)=>{const m=new THREE.Mesh(g,M(c));m.castShadow=true;return m};
function outline(m,w){const o=new THREE.Mesh(m.geometry,OL);const sc=m.scale;o.scale.set(1+w/Math.max(.05,sc.x),1+w/Math.max(.05,sc.y),1+w/Math.max(.05,sc.z));m.add(o);return m}
const SPH=new THREE.SphereGeometry(1,20,14);
const ball=(c,sx,sy,sz,ol=0.025)=>{const m=mesh(SPH,c);m.scale.set(sx,sy,sz);if(ol)outline(m,ol);return m};
// ---------- voxel world ----------
const B=[null,
 {n:'草地',c:0x9fdc7c,side:0xc9a27a},{n:'泥土',c:0xc49a6c},{n:'沙子',c:0xfbe3a8},{n:'水',c:0x7fd0f0,t:1,soft:1},
 {n:'木头',c:0xb98a5e,top:0xe0c08f},{n:'树叶',c:0x8fd47a},{n:'石头',c:0xb8bcc6},{n:'砖块',c:0xe88f7a},
 {n:'木板',c:0xf0cd96},{n:'玻璃',c:0xd6f2ff,t:1},{n:'屋瓦',c:0xff8f9f},{n:'花叶',c:0xffc4d6}];
const W=44,H=20,WL=3;const OFF=W/2;
const vox=new Uint8Array(W*W*H);
const idx=(x,y,z)=>x+z*W+y*W*W;
const inb=(x,y,z)=>x>=0&&y>=0&&z>=0&&x<W&&y<H&&z<W;
const get=(x,y,z)=>inb(x,y,z)?vox[idx(x,y,z)]:0;
const set=(x,y,z,v)=>{if(inb(x,y,z))vox[idx(x,y,z)]=v};
const solid=(x,y,z)=>{if(y<0)return 1;const b=get(x,y,z);return b&&!B[b].soft};
function genWorld(){vox.fill(0);
 for(let x=0;x<W;x++)for(let z=0;z<W;z++){const dx=x-OFF+.5,dz=z-OFF+.5,d=Math.hypot(dx,dz);
  let h=d<13?WL+1+Math.round(1.2*Math.sin(x*.35)*Math.cos(z*.3)+ (d<8?1:0)):d<15.5?WL:1;
  for(let y=0;y<h;y++)set(x,y,z,y<h-3?7:2);
  if(d<13)set(x,h-1,z,1);else set(x,h-1,z,3);
  if(d>=13&&d<15.5){} }
 const ground=(x,z)=>{for(let y=H-1;y>=0;y--)if(get(x,y,z))return y+1;return 0};
 const tree=(x,z,lc)=>{const g=ground(x,z);for(let y=g;y<g+4;y++)set(x,y,z,5);
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=3;dy<=5;dy++){if(Math.abs(dx)+Math.abs(dz)+(dy===5?2:0)>3)continue;if(!get(x+dx,g+dy,z+dz))set(x+dx,g+dy,z+dz,lc)}};
 [[10,12,6],[33,14,6],[12,30,12],[30,32,6],[22,9,6],[34,24,12]].forEach(([x,z,c])=>tree(x,z,c));
 // house
 const hx=14,hz=17,g=ground(hx+2,hz+2);
 for(let x=hx-1;x<=hx+5;x++)for(let z=hz-1;z<=hz+5;z++){for(let y=g;y<g+8;y++)set(x,y,z,0);set(x,g-1,z,9)}
 for(let x=hx;x<=hx+4;x++)for(let z=hz;z<=hz+4;z++)for(let y=g;y<g+3;y++){const edge=x===hx||x===hx+4||z===hz||z===hz+4;if(!edge)continue;
  let b=8;if((x===hx||x===hx+4)&&(z===hz||z===hz+4))b=5;if(y===g+1&&!((x===hx||x===hx+4)&&(z===hz||z===hz+4))&&(x===hx+1||x===hx+3||z===hz+1||z===hz+3))b=10;
  if(z===hz+4&&x===hx+2&&y<g+2)b=0;set(x,y,z,b)}
 for(let k=0;k<3;k++)for(let x=hx-1+k;x<=hx+5-k;x++)for(let z=hz-1+k;z<=hz+5-k;z++)if(k===2||x===hx-1+k||x===hx+5-k||z===hz-1+k||z===hz+5-k)set(x,g+3+k,z,11);
 // farm
 for(let i=0;i<6;i++){const x=24+(i%3)*2,z=18+Math.floor(i/3)*2;const gg=ground(x,z);set(x,gg-1,z,2)}
}
const KEY='island3d-world-v1';
function save(){let s='';for(let i=0;i<vox.length;i+=8192)s+=String.fromCharCode.apply(null,vox.subarray(i,i+8192));localStorage.setItem(KEY,btoa(s))}
function load(){const s=localStorage.getItem(KEY);if(!s)return false;const b=atob(s);if(b.length!==vox.length)return false;for(let i=0;i<b.length;i++)vox[i]=b.charCodeAt(i);return true}
if(!load())genWorld();
const FACES=[[1,0,0,[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],.85],[-1,0,0,[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],.85],[0,1,0,[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],1],[0,-1,0,[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],.7],[0,0,1,[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],.92],[0,0,-1,[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],.92]];
const opMat=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:grad});
const trMat=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:grad,transparent:true,opacity:.55,depthWrite:false});
let opMesh,trMesh;const tc=new THREE.Color();
function hash(x,y,z){let h=x*374761393+y*668265263+z*2147483647;h=(h^(h>>13))*1274126177;return((h^(h>>16))&255)/255}
function build(){const A={p:[],n:[],c:[],i:[]},T={p:[],n:[],c:[],i:[]};
 for(let y=0;y<H;y++)for(let z=0;z<W;z++)for(let x=0;x<W;x++){const b=get(x,y,z);if(!b)continue;const bd=B[b];const L=bd.t?T:A;
  for(const[fx,fy,fz,cs,sh]of FACES){const nb=get(x+fx,y+fy,z+fz);if(nb&&(nb===b||!B[nb].t))continue;if(b===4&&fy!==1&&nb)continue;
   const v0=L.p.length/3;let col=bd.c;if(fy!==1&&bd.side&&get(x,y+1,z)===0)col=fy===0?bd.side:bd.side;if(fy===1&&bd.top)col=bd.top;
   tc.setHex(col).multiplyScalar(sh*(0.94+hash(x,y,z)*.08));
   const ey=b===4&&fy===1?-.12:0;
   for(const[a,bb,c]of cs){L.p.push(x+a-OFF,y+bb+(bb?ey:0),z+c-OFF);L.n.push(fx,fy,fz);L.c.push(tc.r,tc.g,tc.b)}
   L.i.push(v0,v0+1,v0+2,v0,v0+2,v0+3)}}
 const mk=(L,m,old)=>{if(old){S.remove(old);old.geometry.dispose()}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(L.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(L.c,3));g.setIndex(L.i);const me=new THREE.Mesh(g,m);S.add(me);return me};
 opMesh=mk(A,opMat,opMesh);opMesh.castShadow=opMesh.receiveShadow=true;trMesh=mk(T,trMat,trMesh)}
// grass side: top band handled by color choice above (grass block sides = dirt-ish)
build();
// sea
const water=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshToonMaterial({color:0x7fd6e8,gradientMap:grad,transparent:true,opacity:.85}));water.rotation.x=-Math.PI/2;water.position.y=WL-.25;water.receiveShadow=true;S.add(water);
const clouds=new THREE.Group();for(let i=0;i<5;i++){const c=new THREE.Group();for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,fog:false}));b.scale.set(6-k,2,4);b.position.x=k*4-4;b.position.y=k===1?1:0;c.add(b)}
 const ang=i*1.3;c.position.set(Math.cos(ang)*70,28+i*3,Math.sin(ang)*70);clouds.add(c)}S.add(clouds);
// ---------- characters ----------
function dog(col,ear){const g=new THREE.Group();const d=new THREE.Group();g.add(d);
 const body=ball(col,.62,.55,.72);body.position.y=.55;
 const head=ball(col,.72,.64,.66);head.position.set(0,1.35,.25);
 const eye=new THREE.Mesh(SPH,M(0x2a1e18));const e1=eye.clone();e1.scale.set(.06,.08,.04);e1.position.set(-.25,1.42,.88);const e2=e1.clone();e2.position.x=.25;
 const nose=ball(0x2a1e18,.07,.05,.04,0);nose.position.set(0,1.3,.91);
 const blush=new THREE.MeshBasicMaterial({color:0xffa3b5});
 const b1=new THREE.Mesh(SPH,blush);b1.scale.set(.11,.06,.03);b1.position.set(-.42,1.24,.79);b1.rotation.y=-.45;const b2=b1.clone();b2.position.x=.42;b2.rotation.y=.45;
 const e3=ball(ear,.14,.3,.2);e3.position.set(-.66,1.38,.2);e3.rotation.z=.35;const e4=ball(ear,.14,.3,.2);e4.position.set(.66,1.38,.2);e4.rotation.z=-.35;
 const tail=ball(col,.13,.13,.13,0);tail.position.set(0,.65,-.72);
 const legs=[];for(const[x,z]of[[-.28,.35],[.28,.35],[-.28,-.35],[.28,-.35]]){const l=ball(col,.15,.15,.17);l.position.set(x,.13,z);legs.push(l);d.add(l)}
 d.add(body,head,e1,e2,nose,b1,b2,e3,e4,tail);d.scale.setScalar(.55);g.userData={legs,tail,d};return g}
function baby(){const bb=new THREE.Group();const d=new THREE.Group();bb.add(d);const bbody=ball(0xffd1de,.38,.36,.36);bbody.position.y=.36;const bh=ball(0xfff1e6,.36,.33,.33);bh.position.y=.95;
 const ey=new THREE.Mesh(SPH,M(0x2a1e18));const y1=ey.clone();y1.scale.set(.04,.05,.03);y1.position.set(-.12,1,.31);const y2=y1.clone();y2.position.x=.12;
 const bl=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xffa3b5}));bl.scale.set(.06,.035,.02);const c1=bl.clone();c1.position.set(-.21,.9,.27);const c2=bl.clone();c2.position.set(.21,.9,.27);
 const bow=ball(0xff7aa2,.12,.08,.08);bow.position.y=1.3;d.add(bbody,bh,y1,y2,c1,c2,bow);d.scale.setScalar(.55);bb.userData={d};return bb}
const groundY=(x,z)=>{const bx=Math.floor(x+OFF),bz=Math.floor(z+OFF);for(let y=H-1;y>=0;y--)if(solid(bx,y,bz))return y+1;return 0};
function body(obj,r,h){return{obj,r,h,vy:0,onG:false}}
const me=dog(0xf6deb0,0xe8c48c),wife=dog(0xffffff,0xf3eeea),bb=baby();
S.add(me,wife,bb);
const P=body(me,.3,.9),Wf=body(wife,.3,.9),Bb=body(bb,.22,.75);
for(const[b,x,z]of[[P,0,7],[Wf,2,8],[Bb,-1,8]]){b.obj.position.set(x,groundY(x,z),z)}
function hits(x,y,z,b){for(let bx=Math.floor(x-b.r+OFF);bx<=Math.floor(x+b.r+OFF-1e-4);bx++)for(let bz=Math.floor(z-b.r+OFF);bz<=Math.floor(z+b.r+OFF-1e-4);bz++)for(let by=Math.floor(y);by<=Math.floor(y+b.h-1e-4);by++)if(solid(bx,by,bz))return true;return false}
function phys(b,mx,mz,dt){const p=b.obj.position;let blocked=false;
 for(const[ax,dv]of[['x',mx],['z',mz]]){if(!dv)continue;const n=p.clone();n[ax]+=dv;
  if(!hits(n.x,n.y,n.z,b)){p[ax]=n[ax]}else if(b.onG&&!hits(n.x,n.y+1.01,n.z,b)&&!hits(p.x,p.y+1.01,p.z,b)){p[ax]=n[ax];p.y+=1.01;b.vy=0}else blocked=true}
 b.vy-=26*dt;const ny=p.y+b.vy*dt;
 if(hits(p.x,ny,p.z,b)){if(b.vy<0){p.y=Math.floor(ny)+1;b.onG=true}else p.y=Math.ceil(ny+b.h)-b.h-1e-3;b.vy=0}else{p.y=ny;b.onG=false}
 if(p.y<-5){p.set(0,groundY(0,7),7);b.vy=0}
 p.x=Math.max(-OFF+.5,Math.min(OFF-.5,p.x));p.z=Math.max(-OFF+.5,Math.min(OFF-.5,p.z));return blocked}
function jump(b){if(b.onG){b.vy=8.2;b.onG=false}}
function animWalk(g,t,moving){const u=g.userData;if(u.legs){const k=moving?Math.sin(t*14)*.12:0;u.legs[0].position.y=u.legs[3].position.y=.13+Math.max(0,k);u.legs[1].position.y=u.legs[2].position.y=.13+Math.max(0,-k);u.tail.position.x=Math.sin(t*12)*.08}
 u.d.position.y=moving?Math.abs(Math.sin(t*14))*.05:0}
const ais=[{b:Wf,sp:2.2,tx:2,tz:8,wait:0},{b:Bb,sp:1.4,tx:-1,tz:8,wait:0}];
// ---------- UI ----------
const pal=document.getElementById('pal');let cur=8;const PAL=[1,2,3,4,5,6,12,7,8,9,10,11];
PAL.forEach(id=>{const bt=document.createElement('button');bt.innerHTML=`<i style="background:#${B[id].c.toString(16).padStart(6,'0')}"></i>${B[id].n}`;bt.dataset.id=id;bt.onclick=()=>{cur=id;setMode(false);[...pal.children].forEach(c=>c.classList.toggle('on',+c.dataset.id===cur))};if(id===cur)bt.classList.add('on');pal.appendChild(bt)});
let delMode=false;const modeB=document.getElementById('mode');function setMode(d){delMode=d;modeB.textContent=d?'⛏️ 拆除':'🧱 放置';modeB.classList.toggle('del',d)}
modeB.onclick=()=>setMode(!delMode);
document.getElementById('reset').onclick=()=>{if(confirm('重置小岛？盖的房子会清空')){genWorld();build();save()}};
const jb=document.getElementById('jump');jb.addEventListener('pointerdown',e=>{e.preventDefault();jump(P)});
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let jid=null,jx=0,jz=0;
let yaw=0.5,pitch=0.75,dist=14;const drags=new Map();let pinch0=0,dist0=dist;
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);upd(e);e.stopPropagation()});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)upd(e)});
const end=e=>{if(e.pointerId===jid){jid=null;jx=jz=0;knob.style.transform=''}};joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
function upd(e){const r=joy.getBoundingClientRect();let dx=e.clientX-r.left-60,dy=e.clientY-r.top-60;const d=Math.hypot(dx,dy),m=45;if(d>m){dx*=m/d;dy*=m/d}knob.style.transform=`translate(${dx}px,${dy}px)`;jx=dx/m;jz=dy/m}
const cv=R.domElement;
cv.addEventListener('pointerdown',e=>{drags.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()});if(drags.size===2){const[a,b]=[...drags.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=dist}});
cv.addEventListener('pointermove',e=>{const p=drags.get(e.pointerId);if(!p)return;
 if(drags.size===1){yaw-=(e.clientX-p.x)*.008;pitch=Math.min(1.4,Math.max(.1,pitch+(e.clientY-p.y)*.005))}
 p.x=e.clientX;p.y=e.clientY;if(drags.size===2){const[a,b]=[...drags.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);dist=Math.min(30,Math.max(3,dist0*pinch0/d))}});
const up=e=>{const p=drags.get(e.pointerId);if(p&&drags.size===1&&Math.hypot(e.clientX-p.sx,e.clientY-p.sy)<10&&performance.now()-p.t<400)tap(e.clientX,e.clientY);drags.delete(e.pointerId)};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>drags.delete(e.pointerId));
cv.addEventListener('wheel',e=>{dist=Math.min(30,Math.max(3,dist+e.deltaY*.02))},{passive:true});
const keys={};addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='Space'){jump(P);e.preventDefault()}});addEventListener('keyup',e=>keys[e.code]=0);
const ray=new THREE.Raycaster();
function tap(cx,cy){ray.setFromCamera({x:cx/innerWidth*2-1,y:-cy/innerHeight*2+1},cam);const h=ray.intersectObjects([opMesh,trMesh])[0];if(!h||h.distance>40)return;
 const n=h.face.normal,q=h.point;const s=delMode?-.5:.5;const x=Math.floor(q.x+n.x*s+OFF),y=Math.floor(q.y+n.y*s),z=Math.floor(q.z+n.z*s+OFF);
 if(delMode){if(y<=0)return;set(x,y,z,0)}else{if(get(x,y,z)||!inb(x,y,z))return;
  set(x,y,z,cur);if(!B[cur].soft&&[P,Wf,Bb].some(b=>hits(b.obj.position.x,b.obj.position.y,b.obj.position.z,b))){set(x,y,z,0);return}}
 build();save()}
// ---------- loop ----------
const bub=document.getElementById('bubble');const lines=['胖宝饿饿～','爸爸抱抱！','妈妈在哪呀','胖宝跑跑！','咿呀～','胖宝跳跳！'];let bubT=3,bubTxt='';
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
const clk=new THREE.Clock();let t=0;const v=new THREE.Vector3(),camT=new THREE.Vector3();let lookX=0;
function loop(){const dt=Math.min(clk.getDelta(),.05);t+=dt;
 let ix=jx+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iz=jz+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 const mag=Math.min(1,Math.hypot(ix,iz));let mx=0,mz=0;
 if(mag>.1){const s=Math.sin(yaw),c=Math.cos(yaw);const wx=ix*c+iz*s,wz=-ix*s+iz*c;const n=Math.hypot(wx,wz);mx=wx/n*mag*4.5*dt;mz=wz/n*mag*4.5*dt;me.rotation.y=Math.atan2(wx,wz)}
 phys(P,mx,mz,dt);animWalk(me,t,mag>.1);
 for(const a of ais){const p=a.b.obj.position;const dx=a.tx-p.x,dz=a.tz-p.z,d=Math.hypot(dx,dz);
  if(a.b===Wf&&Math.random()<.003){a.tx=p.x+(P.obj.position.x-p.x)*.8;a.tz=p.z+(P.obj.position.z-p.z)*.8}
  if(d<.3){phys(a.b,0,0,dt);a.wait-=dt;if(a.wait<=0){const ang=Math.random()*6.28,r=Math.random()*11;a.tx=Math.cos(ang)*r;a.tz=Math.sin(ang)*r;a.wait=1+Math.random()*3}animWalk(a.b.obj,t,false)}
  else{const bl=phys(a.b,dx/d*a.sp*dt,dz/d*a.sp*dt,dt);if(bl){if(a.b.onG&&Math.random()<.5)jump(a.b);else a.tx=p.x,a.tz=p.z}a.b.obj.rotation.y=Math.atan2(dx,dz);animWalk(a.b.obj,t,true)}}
 water.position.y=WL-.25+Math.sin(t)*.04;clouds.rotation.y=t*.01;
 camT.lerp(v.set(me.position.x+lookX,me.position.y+.8,me.position.z),Math.min(1,dt*10));
 cam.position.set(camT.x+dist*Math.cos(pitch)*Math.sin(yaw),camT.y+dist*Math.sin(pitch),camT.z+dist*Math.cos(pitch)*Math.cos(yaw));cam.lookAt(camT);
 sun.position.set(me.position.x+12,me.position.y+25,me.position.z+9);sun.target.position.copy(me.position);
 bubT-=dt;if(bubT<0){bubT=bubT<-2.5?4+Math.random()*4:bubT;if(bubT>0)bubTxt='';else if(!bubTxt)bubTxt=lines[Math.random()*lines.length|0]}
 if(bubTxt){v.copy(bb.position);v.y+=1.1;v.project(cam);bub.style.display=v.z<1?'block':'none';bub.textContent=bubTxt;bub.style.left=(v.x*.5+.5)*innerWidth+'px';bub.style.top=(-v.y*.5+.5)*innerHeight+'px'}else bub.style.display='none';
 R.render(S,cam);requestAnimationFrame(loop)}
if(location.search.includes('closeup')){dist=4;pitch=.2;yaw=0;lookX=.6;me.rotation.y=.25;wife.position.set(1.2,P.obj.position.y,7);wife.rotation.y=-.25;bb.position.set(.6,P.obj.position.y,7.8);ais.length=0;bubTxt='爸爸抱抱！'}
camT.set(me.position.x+lookX,me.position.y+.8,me.position.z);
window.__dbg={P,get,count:()=>vox.reduce((a,b)=>a+(b?1:0),0),screen:(x,y,z)=>{const q=new THREE.Vector3(x,y,z).project(cam);return[(q.x*.5+.5)*innerWidth,(-q.y*.5+.5)*innerHeight]},calls:()=>R.info.render,setView:(a,b,c)=>{yaw=a;pitch=b;dist=c}};
loop();
