import * as THREE from './three.module.min.js';
const R=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;document.body.prepend(R.domElement);
const S=new THREE.Scene();S.fog=new THREE.Fog(0xcfeeff,45,110);
const cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.3,300);
// sky gradient dome
{const g=new THREE.SphereGeometry(150,16,10);const c=[],p=g.attributes.position;const top=new THREE.Color(0x8ecbff),mid=new THREE.Color(0xd8f0ff),bot=new THREE.Color(0xffe6ef);
 for(let i=0;i<p.count;i++){const y=p.getY(i)/150;const col=y>0?mid.clone().lerp(top,Math.min(1,y*1.6)):mid.clone().lerp(bot,Math.min(1,-y*3));c.push(col.r,col.g,col.b)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));S.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false})))}
S.add(new THREE.HemisphereLight(0xfff6ee,0xb8e0c0,1.4));
const sun=new THREE.DirectionalLight(0xfff2dd,1.6);sun.position.set(10,20,8);sun.castShadow=true;sun.shadow.bias=-0.001;sun.shadow.normalBias=0.04;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18});S.add(sun);
const grad=new THREE.DataTexture(new Uint8Array([195,195,195,255,230,230,230,255,255,255,255,255]),3,1);grad.minFilter=grad.magFilter=THREE.NearestFilter;grad.needsUpdate=true;
const mats={};const M=c=>mats[c]||(mats[c]=new THREE.MeshToonMaterial({color:c,gradientMap:grad}));
const OL=new THREE.MeshBasicMaterial({color:0x3a2a22,side:THREE.BackSide});
const mesh=(g,c,sh=true)=>{const m=new THREE.Mesh(g,M(c));m.castShadow=sh;m.receiveShadow=true;return m};
// outline via inverted hull
function outline(m,w=0.04){const o=new THREE.Mesh(m.geometry,OL);o.scale.setScalar(1);o.userData.ol=w;m.add(o);
 o.onBeforeRender=()=>{};const sc=m.scale;o.scale.set(1+w/Math.max(.05,sc.x),1+w/Math.max(.05,sc.y),1+w/Math.max(.05,sc.z));return m}
const SPH=new THREE.SphereGeometry(1,20,14);
const ball=(c,sx,sy,sz,ol=0.025)=>{const m=mesh(SPH,c);m.receiveShadow=false;m.scale.set(sx,sy,sz);if(ol)outline(m,ol);return m};
// water
const water=new THREE.Mesh(new THREE.CircleGeometry(150,32),new THREE.MeshToonMaterial({color:0x7fd6e8,gradientMap:grad,transparent:true,opacity:.92}));water.rotation.x=-Math.PI/2;water.position.y=-0.35;water.receiveShadow=true;S.add(water);
const RAD=14;
const isl=mesh(new THREE.CylinderGeometry(RAD,RAD+.6,1.2,40),0xa8e08a,false);isl.position.y=-0.6;S.add(isl);
const sand=mesh(new THREE.CylinderGeometry(RAD+1.6,RAD+2.4,0.5,40),0xfbe7b8,false);sand.position.y=-0.78;S.add(sand);
// foam ring
const foam=new THREE.Mesh(new THREE.RingGeometry(RAD+2.3,RAD+2.9,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6}));foam.rotation.x=-Math.PI/2;foam.position.y=-0.32;S.add(foam);
// round trees (instanced)
const treePos=[[-8,-6],[-10,2],[7,-9],[10,4],[-4,10],[5,10],[-11,-2],[0,-11],[11,-4]];
const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.3,1.6,8),M(0xc79a6b),treePos.length);
const leaf=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.4,2),M(0x8fd47a),treePos.length*2);
const leafOL=new THREE.InstancedMesh(leaf.geometry,OL,treePos.length*2);
const o=new THREE.Object3D();const tc=[0xa6e08c,0xbcebaa,0xffc4d6];
treePos.forEach(([x,z],i)=>{o.scale.setScalar(1);o.position.set(x,.8,z);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);
 for(let k=0;k<2;k++){o.position.set(x+(k?.5:-.2),2.3+k*.9,z+(k?.2:0));o.scale.setScalar(k?.8:1.05);o.updateMatrix();leaf.setMatrixAt(i*2+k,o.matrix);leaf.setColorAt(i*2+k,new THREE.Color(tc[i%3===2?2:k]));
 o.scale.multiplyScalar(1.05);o.updateMatrix();leafOL.setMatrixAt(i*2+k,o.matrix)}});
trunk.castShadow=leaf.castShadow=true;S.add(trunk,leaf,leafOL);
// flowers
const FN=60,fl=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.13,1),M(0xffffff),FN);const fc=[0xff9fbf,0xfff07a,0xffffff,0xc9a7ff,0xffb07a];
for(let i=0;i<FN;i++){const ang=Math.random()*6.28,r=3+Math.random()*(RAD-4);o.position.set(Math.cos(ang)*r,.12,Math.sin(ang)*r);o.scale.setScalar(.8+Math.random()*.6);o.updateMatrix();fl.setMatrixAt(i,o.matrix);fl.setColorAt(i,new THREE.Color(fc[i%5]))}
S.add(fl);
// house
const house=new THREE.Group();const wall=outline(mesh(new THREE.BoxGeometry(3,2,3),0xfff4e0),.03);wall.position.y=1;
const roof=outline(mesh(new THREE.ConeGeometry(2.6,1.6,4),0xff9a9a),.03);roof.position.y=2.8;roof.rotation.y=Math.PI/4;
const door=mesh(new THREE.BoxGeometry(.8,1.2,.1),0xc08a5a,false);door.position.set(0,.6,1.51);
const win=mesh(new THREE.CircleGeometry(.35,16),0xbfe8ff,false);win.position.set(.9,1.3,1.52);
house.add(wall,roof,door,win);house.position.set(-5,0,-3);S.add(house);
// farm plots
const plots=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.2,1.4),M(0xc49065),6);
const crops=new THREE.InstancedMesh(new THREE.ConeGeometry(.25,.6,8),M(0xffa04d),6);
const tops=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.22,1),M(0x7fd36a),6);
for(let i=0;i<6;i++){const x=3+(i%3)*1.6,z=-4+Math.floor(i/3)*1.6;o.scale.setScalar(1);o.rotation.set(0,0,0);o.position.set(x,.1,z);o.updateMatrix();plots.setMatrixAt(i,o.matrix);
 o.position.y=.45;o.rotation.x=Math.PI;o.updateMatrix();crops.setMatrixAt(i,o.matrix);o.rotation.x=0;o.position.y=.85;o.updateMatrix();tops.setMatrixAt(i,o.matrix)}
plots.receiveShadow=true;crops.castShadow=true;S.add(plots,crops,tops);
// clouds
const clouds=new THREE.Group();for(let i=0;i<5;i++){const c=new THREE.Group();for(let k=0;k<3;k++){const b=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,fog:false}));b.scale.set(3-k*.5,1.6-k*.2,2);b.position.x=k*2.4-2.4;b.position.y=k===1?.6:0;c.add(b)}
 const ang=i*1.3;c.position.set(Math.cos(ang)*60,22+i*3,Math.sin(ang)*60);clouds.add(c)}S.add(clouds);
const obstacles=[{x:-5,z:-3,r:2.2},...treePos.map(([x,z])=>({x,z,r:.8}))];
// Line-puppy-inspired original dog
function dog(col,ear){const g=new THREE.Group();const d=new THREE.Group();g.add(d);
 const body=ball(col,.62,.55,.72);body.position.y=.55;
 const head=ball(col,.72,.64,.66);head.position.set(0,1.35,.25);
 const eye=new THREE.Mesh(SPH,M(0x2a1e18));const e1=eye.clone();e1.scale.set(.06,.08,.04);e1.position.set(-.25,1.42,.88);const e2=e1.clone();e2.position.x=.25;
 const nose=ball(0x2a1e18,.07,.05,.04,0);nose.position.set(0,1.3,.91);
 const blush=new THREE.MeshBasicMaterial({color:0xffa3b5,transparent:true,opacity:.85});
 const b1=new THREE.Mesh(SPH,blush);b1.scale.set(.11,.06,.03);b1.position.set(-.42,1.24,.79);b1.rotation.y=-.45;const b2=b1.clone();b2.position.x=.42;b2.rotation.y=.45;
 const e3=ball(ear,.14,.3,.2);e3.position.set(-.66,1.38,.2);e3.rotation.z=.35;const e4=ball(ear,.14,.3,.2);e4.position.set(.66,1.38,.2);e4.rotation.z=-.35;
 const tail=ball(col,.13,.13,.13,0);tail.position.set(0,.65,-.72);
 const legs=[];for(const[x,z]of[[-.28,.35],[.28,.35],[-.28,-.35],[.28,-.35]]){const l=ball(col,.15,.15,.17);l.position.set(x,.13,z);legs.push(l);d.add(l)}
 d.add(body,head,e1,e2,nose,b1,b2,e3,e4,tail);g.userData={legs,tail,d};return g}
const me=dog(0xf6deb0,0xe8c48c);me.position.set(0,0,3);S.add(me);
const wife=dog(0xffffff,0xf3eeea);wife.position.set(2,0,5);S.add(wife);
// baby 胖宝
const bb=new THREE.Group();{const bbody=ball(0xffd1de,.38,.36,.36);bbody.position.y=.36;const bh=ball(0xfff1e6,.36,.33,.33);bh.position.y=.95;
 const ey=new THREE.Mesh(SPH,M(0x2a1e18));const y1=ey.clone();y1.scale.set(.04,.05,.03);y1.position.set(-.12,1,.31);const y2=y1.clone();y2.position.x=.12;
 const bl=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xffa3b5}));bl.scale.set(.06,.035,.02);const c1=bl.clone();c1.position.set(-.21,.9,.27);const c2=bl.clone();c2.position.set(.21,.9,.27);
 const bow=ball(0xff7aa2,.12,.08,.08);bow.position.y=1.3;bb.add(bbody,bh,y1,y2,c1,c2,bow)}
bb.position.set(-2,0,4);S.add(bb);
// wander AI
function mkAI(obj,speed){return{obj,speed,tx:obj.position.x,tz:obj.position.z,wait:0}}
const ais=[mkAI(wife,2.2),mkAI(bb,1.3)];
function clampMove(p,nx,nz){const d=Math.hypot(nx,nz);if(d>RAD-1){nx*=(RAD-1)/d;nz*=(RAD-1)/d}
 for(const ob of obstacles){const dx=nx-ob.x,dz=nz-ob.z,dd=Math.hypot(dx,dz);if(dd<ob.r){nx=ob.x+dx/dd*ob.r;nz=ob.z+dz/dd*ob.r}}p.x=nx;p.z=nz}
function animWalk(g,t,moving){const L=g.userData.legs;if(L){const k=moving?Math.sin(t*14)*.12:0;L[0].position.y=L[3].position.y=.13+Math.max(0,k);L[1].position.y=L[2].position.y=.13+Math.max(0,-k);g.userData.d.position.y=moving?Math.abs(Math.sin(t*14))*.08:Math.sin(t*2)*.015;g.userData.tail.position.x=Math.sin(t*12)*.08}else g.position.y=moving?Math.abs(Math.sin(t*10))*.15:0}
// input
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let jid=null,jx=0,jz=0;
let lookX=0,yaw=0.6,pitch=0.75,dist=16;const drags=new Map();let pinch0=0,dist0=dist;
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
 water.position.y=-.35+Math.sin(t)*.04;foam.scale.setScalar(1+Math.sin(t*1.3)*.012);clouds.rotation.y=t*.01;
 cam.position.set(me.position.x+lookX+dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch),me.position.z+dist*Math.cos(pitch)*Math.cos(yaw));
 cam.lookAt(me.position.x+lookX,1,me.position.z);sun.position.set(me.position.x+10,20,me.position.z+8);sun.target.position.copy(me.position);sun.target.updateMatrixWorld();
 bubT-=dt;if(bubT<0){bubT=bubT<-2.5?4+Math.random()*4:bubT;if(bubT>0)bubTxt='';else if(!bubTxt)bubTxt=lines[Math.random()*lines.length|0]}
 if(bubTxt){v.copy(bb.position);v.y=2;v.project(cam);bub.style.display='block';bub.textContent=bubTxt;bub.style.left=(v.x*.5+.5)*innerWidth+'px';bub.style.top=(-v.y*.5+.5)*innerHeight+'px'}else bub.style.display='none';
 R.render(S,cam);requestAnimationFrame(loop)}
if(location.search.includes('closeup')){dist=6.5;pitch=.22;yaw=0;lookX=.9;me.rotation.y=.25;wife.position.set(1.9,0,3);wife.rotation.y=-.25;bb.position.set(.9,0,4.3);fl.visible=false;ais.length=0;bubTxt='爸爸抱抱！'}
window.__info=()=>R.info.render;loop();
