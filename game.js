import * as THREE from './three.module.min.js';
const R=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.BasicShadowMap;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0x8fd3ff);S.fog=new THREE.Fog(0x8fd3ff,40,90);
const cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.5,200);
S.add(new THREE.HemisphereLight(0xffffff,0x88aa66,0.9));
const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(10,20,8);sun.castShadow=true;sun.shadow.bias=-0.002;sun.shadow.normalBias=0.05;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16});S.add(sun);
const M=c=>new THREE.MeshLambertMaterial({color:c,flatShading:true});
const mesh=(g,c,sh=true)=>{const m=new THREE.Mesh(g,M(c));m.castShadow=sh;m.receiveShadow=true;return m};
// water + island
const water=mesh(new THREE.CircleGeometry(100,24),0x3fa9e0,false);water.rotation.x=-Math.PI/2;water.position.y=-0.3;S.add(water);
const RAD=14;const isl=mesh(new THREE.CylinderGeometry(RAD,RAD+1.5,1.2,14),0x7ccf5a,false);isl.position.y=-0.6;S.add(isl);
const sand=mesh(new THREE.CylinderGeometry(RAD+1.6,RAD+2.2,0.5,14),0xf2dc9b,false);sand.position.y=-0.75;S.add(sand);
// trees (instanced)
const treePos=[[-8,-6],[-10,2],[7,-9],[10,4],[-4,10],[5,10],[-11,-2],[0,-11]];
const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.3,1.4,6),M(0x8b5a2b),treePos.length);
const leaf=new THREE.InstancedMesh(new THREE.ConeGeometry(1.3,2.6,7),M(0x2f9e44),treePos.length);
const o=new THREE.Object3D();treePos.forEach(([x,z],i)=>{o.position.set(x,.7,z);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);o.position.y=2.6;o.updateMatrix();leaf.setMatrixAt(i,o.matrix)});
trunk.castShadow=leaf.castShadow=true;S.add(trunk,leaf);
// house
const house=new THREE.Group();const wall=mesh(new THREE.BoxGeometry(3,2,3),0xfff1d6);wall.position.y=1;
const roof=mesh(new THREE.ConeGeometry(2.6,1.6,4),0xe8665a);roof.position.y=2.8;roof.rotation.y=Math.PI/4;
const door=mesh(new THREE.BoxGeometry(.8,1.2,.1),0x9c6b3e,false);door.position.set(0,.6,1.51);
house.add(wall,roof,door);house.position.set(-5,0,-3);S.add(house);
// farm plots
const plots=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.2,1.4),M(0x8a5a36),6);
const crops=new THREE.InstancedMesh(new THREE.ConeGeometry(.25,.6,5),M(0xff8c1a),6);
for(let i=0;i<6;i++){const x=3+(i%3)*1.6,z=-4+Math.floor(i/3)*1.6;o.position.set(x,.1,z);o.rotation.set(0,0,0);o.updateMatrix();plots.setMatrixAt(i,o.matrix);o.position.y=.5;o.rotation.x=Math.PI;o.updateMatrix();crops.setMatrixAt(i,o.matrix)}
plots.receiveShadow=true;crops.castShadow=true;S.add(plots,crops);
const obstacles=[{x:-5,z:-3,r:2.2},...treePos.map(([x,z])=>({x,z,r:.8}))];
// dog factory
function dog(col,ear){const g=new THREE.Group();
 const body=mesh(new THREE.BoxGeometry(.9,.7,1.3),col);body.position.y=.65;
 const head=mesh(new THREE.BoxGeometry(.8,.75,.75),col);head.position.set(0,1.25,.65);
 const nose=mesh(new THREE.BoxGeometry(.2,.15,.15),0x222222,false);nose.position.set(0,1.18,1.08);
 const e1=mesh(new THREE.BoxGeometry(.2,.35,.12),ear);e1.position.set(-.3,1.7,.55);const e2=e1.clone();e2.position.x=.3;
 const tail=mesh(new THREE.BoxGeometry(.15,.15,.5),col);tail.position.set(0,.95,-.8);tail.rotation.x=-.6;
 const legs=[];for(const[x,z]of[[-.3,.45],[.3,.45],[-.3,-.45],[.3,-.45]]){const l=mesh(new THREE.BoxGeometry(.22,.4,.22),col);l.position.set(x,.2,z);legs.push(l);g.add(l)}
 g.add(body,head,nose,e1,e2,tail);g.userData={legs,tail};return g}
const me=dog(0xf5d9a0,0xd9a95c);me.position.set(0,0,3);S.add(me);
const wife=dog(0xffffff,0xeeeeee);wife.position.set(2,0,5);S.add(wife);
// baby
const bb=new THREE.Group();const bbody=mesh(new THREE.SphereGeometry(.45,8,6),0xffc8d6);bbody.position.y=.45;
const bhead=mesh(new THREE.SphereGeometry(.38,8,6),0xffe0bd);bhead.position.y=1.1;
const bow=mesh(new THREE.ConeGeometry(.15,.3,5),0xff5c8a);bow.position.y=1.5;bb.add(bbody,bhead,bow);bb.position.set(-2,0,4);S.add(bb);
// wander AI
function mkAI(obj,speed){return{obj,speed,tx:obj.position.x,tz:obj.position.z,wait:0}}
const ais=[mkAI(wife,2.2),mkAI(bb,1.3)];
function clampMove(p,nx,nz){const d=Math.hypot(nx,nz);if(d>RAD-1){nx*=(RAD-1)/d;nz*=(RAD-1)/d}
 for(const ob of obstacles){const dx=nx-ob.x,dz=nz-ob.z,dd=Math.hypot(dx,dz);if(dd<ob.r){nx=ob.x+dx/dd*ob.r;nz=ob.z+dz/dd*ob.r}}p.x=nx;p.z=nz}
function animWalk(g,t,moving){const k=moving?Math.sin(t*14)*.5:0;const L=g.userData.legs;if(L){L[0].rotation.x=L[3].rotation.x=k;L[1].rotation.x=L[2].rotation.x=-k;g.userData.tail.rotation.y=Math.sin(t*10)*.5}else g.position.y=moving?Math.abs(Math.sin(t*10))*.15:0}
// input
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let jid=null,jx=0,jz=0;
let yaw=0.6,pitch=0.75,dist=16;const drags=new Map();let pinch0=0,dist0=dist;
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);upd(e);e.stopPropagation()});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)upd(e)});
const end=e=>{if(e.pointerId===jid){jid=null;jx=jz=0;knob.style.transform=''}};joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
function upd(e){const r=joy.getBoundingClientRect();let dx=e.clientX-r.left-60,dy=e.clientY-r.top-60;const d=Math.hypot(dx,dy),m=45;if(d>m){dx*=m/d;dy*=m/d}knob.style.transform=`translate(${dx}px,${dy}px)`;jx=dx/m;jz=dy/m}
const cv=R.domElement;
cv.addEventListener('pointerdown',e=>{drags.set(e.pointerId,{x:e.clientX,y:e.clientY});if(drags.size===2){const[a,b]=[...drags.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=dist}});
cv.addEventListener('pointermove',e=>{const p=drags.get(e.pointerId);if(!p)return;
 if(drags.size===1){yaw-=(e.clientX-p.x)*.008;pitch=Math.min(1.35,Math.max(.25,pitch+(e.clientY-p.y)*.005))}
 p.x=e.clientX;p.y=e.clientY;if(drags.size===2){const[a,b]=[...drags.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);dist=Math.min(30,Math.max(7,dist0*pinch0/d))}});
const up=e=>drags.delete(e.pointerId);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{dist=Math.min(30,Math.max(7,dist+e.deltaY*.02))},{passive:true});
const keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
// bubble
const bub=document.getElementById('bubble');const lines=['胖宝饿饿～','爸爸抱抱！','妈妈在哪呀','胖宝跑跑！','咿呀～'];let bubT=3,bubTxt='';
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
const clk=new THREE.Clock();let t=0;const v=new THREE.Vector3();
function loop(){const dt=Math.min(clk.getDelta(),.05);t+=dt;
 let ix=jx+(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),iz=jz+(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
 const mag=Math.min(1,Math.hypot(ix,iz));
 if(mag>.1){const s=Math.sin(yaw),c=Math.cos(yaw);const wx=ix*c+iz*s,wz=-ix*s+iz*c;const n=Math.hypot(wx,wz);
  clampMove(me.position,me.position.x+wx/n*mag*5*dt,me.position.z+wz/n*mag*5*dt);me.rotation.y=Math.atan2(wx,wz)}
 animWalk(me,t,mag>.1);
 for(const a of ais){const p=a.obj.position;let tx=a.tx,tz=a.tz;
  if(a.obj===wife&&Math.random()<.002){a.tx=me.position.x+1.5;a.tz=me.position.z+1.5}
  const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
  if(d<.2){a.wait-=dt;if(a.wait<=0){const ang=Math.random()*6.28,r=Math.random()*(RAD-3);a.tx=Math.cos(ang)*r;a.tz=Math.sin(ang)*r;a.wait=1+Math.random()*3}animWalk(a.obj,t,false)}
  else{clampMove(p,p.x+dx/d*a.speed*dt,p.z+dz/d*a.speed*dt);a.obj.rotation.y=Math.atan2(dx,dz);animWalk(a.obj,t,true);if(Math.hypot(a.tx-p.x,a.tz-p.z)>d-0.001&&d>.2)a.tx=p.x,a.tz=p.z}}
 crops.rotation.y=0;water.position.y=-.3+Math.sin(t)*.05;
 cam.position.set(me.position.x+dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch),me.position.z+dist*Math.cos(pitch)*Math.cos(yaw));
 cam.lookAt(me.position.x,.8,me.position.z);sun.position.set(me.position.x+10,20,me.position.z+8);sun.target.position.copy(me.position);sun.target.updateMatrixWorld();
 bubT-=dt;if(bubT<0){bubT=bubT<-2.5?4+Math.random()*4:bubT;if(bubT>0)bubTxt='';else if(!bubTxt)bubTxt=lines[Math.random()*lines.length|0]}
 if(bubTxt){v.copy(bb.position);v.y=2;v.project(cam);bub.style.display='block';bub.textContent=bubTxt;bub.style.left=(v.x*.5+.5)*innerWidth+'px';bub.style.top=(-v.y*.5+.5)*innerHeight+'px'}else bub.style.display='none';
 R.render(S,cam);requestAnimationFrame(loop)}
window.__info=()=>R.info.render;loop();
