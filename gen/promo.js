/* ===== promo.js — module promo de l'app (chargé à la fin du générateur salon v19, qui n'est pas modifié) =====
   - pièces CP 15 d'un salon promo : carcasse (générateur) + table + 2 guéridons standard (PROMO_DATA), couronne de table en 6 segments
   - calepinage : plan rapide du générateur tout de suite, puis moteur nest7 (forme réelle, trame 2 mm) en arrière-plan pour gagner une plaque
   - programmes .cnc (réglages v19 + attaches), plaque CP 3 standard, étiquettes 60 × 40 de la carcasse, plan des plaques pour la fiche
   - contrôle bloquant : écarts et marges exacts (nestCheck), toutes les pièces posées une fois, chaque .cnc relu et comparé au plan,
     pièces logées coupées avant l'ouverture qui les contient
   Règles validées par Abdou : marge 15, écart 8, aucune gravure sur table et guéridons, étiquettes pour la carcasse seulement. */
const PROMO=(()=>{
const DT=PROMO_DATA,CALV=2,NSEG=6;
const circ=(x,y,r,n)=>[...Array(n||24)].map((_,i)=>[x+r*Math.cos(2*Math.PI*i/(n||24)),y+r*Math.sin(2*Math.PI*i/(n||24))]);
function ringSplit(o,h,n){const b=bbox(o),cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,ro=Math.max(b.w,b.h)/2,bh=bbox(h),ri=Math.max(bh.w,bh.h)/2,out=[];
  for(let k=0;k<n;k++){const a0=2*Math.PI*k/n,a1=2*Math.PI*(k+1)/n,m=Math.max(8,Math.floor(96/n)),A=[...Array(m+1)].map((_,i)=>a0+(a1-a0)*i/m);
    out.push([...A.map(a=>[cx+ro*Math.cos(a),cy+ro*Math.sin(a)]),...A.slice().reverse().map(a=>[cx+ri*Math.cos(a),cy+ri*Math.sin(a)])]);}
  return out;}
/* table Ø 120 (au choix du client) : même fût ; plateau PL-C1 et couronne PL-C2 agrandis de 50 mm au rayon, perçages à la même place par rapport au centre */
const T120=q=>{if(q.rep!=='PL-C1'&&q.rep!=='PL-C2')return q;const R=600,sc=(C,k)=>C.map(v=>[+((v[0]-550)*k+R).toFixed(2),+((v[1]-550)*k+R).toFixed(2)]);
  return q.rep==='PL-C1'?{...q,c:[sc(q.c[0],R/550)],pr:(q.pr||[]).map(v=>[v[0]+50,v[1]+50,...v.slice(2)])}:{...q,c:[sc(q.c[0],R/550),sc(q.c[1],(R-50)/500)]};};
/* guéridons en plus (option, 0 à 4) : mêmes pièces que les guéridons 1 et 2 */
const nGx=()=>Math.min(4,Math.max(0,Math.round(+(P&&P.ng)||0)));
function tabParts(){const L=[],U=[['T',P&&P.tb===120?DT.T.map(T120):DT.T,'Table'],['G1',DT.G,'Guéridon 1'],['G2',DT.G,'Guéridon 2']];for(let k=0;k<nGx();k++)U.push(['G'+(3+k),DT.G,'Guéridon '+(3+k)]);
  for(const [u,src,nm] of U)for(const q of src){const base={ref:'TAB',cat:'acc',mat:'SOM',t:15,unit:u,tab:1};
    if(u==='T'&&q.rep==='PL-C2'){ringSplit(q.c[0],q.c[1],NSEG).forEach((o,k)=>L.push({...base,id:`T-PL-C2-${k+1}`,name:`${nm} — PL-C2 (segment ${k+1}/${NSEG})`,out:orient(o,true),holes:[]}));continue;}
    const pkL=(q.pr||[]).map(v=>({lay:v[3]?`PERCAGE_D${v[2]}_P${v[3]}`:`PERCAGE_TRAVERSANT_D${v[2]}`,pts:circ(v[0],v[1],v[2]/2)}));
    L.push({...base,id:`${u}-${q.rep}`,name:`${nm} — ${q.rep}`,out:orient(q.c[0],true),holes:q.c.slice(1).map(h=>orient(h,false)),...(pkL.length?{pkL}:{})});}
  return L;}
/* toutes les pièces CP 15 du salon, toujours dans le même ordre (le calepinage enregistré désigne les pièces par leur rang) */
/* règle du 19/11/2026 : aucune pièce plus longue que la plaque (241 cm utiles). Une banquette trop longue est divisée en deux banquettes
   égales — jamais de pièce coupée en deux avec un assemblage puzzle (tenons ronds). Le dessus dépasse la caisse : on vérifie sur les pièces. */
function build(c){for(const L of [2410,2340,2280,2200,2100,2000,1800]){P={...DEF,...c,Lmax:L};R=buildS(P);if(!(R.splits||[]).length)break;}
  if((R.splits||[]).length)throw new Error('une pièce reste plus longue que la plaque ('+R.splits.map(x=>x.id).join(', ')+')');return R;}
function parts(c){build(c);return R.parts.filter(p=>p.mat==='SOM'&&!p.only3d).concat(tabParts());}
const sig=L=>{let h=2166136261;const add=s=>{for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}};
  for(const p of L){const b=bbox(p.out);add(p.id+':'+Math.round(b.w*10)+'x'+Math.round(b.h*10)+':'+p.out.length+':'+(p.holes||[]).length+';');}return L.length+'-'+(h>>>0).toString(36);};
const enc=sheets=>sheets.map(s=>s.map(i=>[i.k,+(+i.x).toFixed(2),+(+i.y).toFixed(2),(i.rot?1:0)+(i.r2?2:0)].join(',')).join(';')).join('|');
const dec=s=>String(s).split('|').map(t=>t.split(';').map(u=>{const a=u.split(',');return {k:+a[0],x:+a[1],y:+a[2],rot:!!(a[3]&1),r2:!!(a[3]&2)};}));
function mkSheets(L,plc){return plc.map(s=>{const sh=mkSheet(P.SL,P.SW,P,null);sh.chutes=[];sh.items=s.map(i=>{const p=L[i.k];if(!p)throw new Error('pièce inconnue');const bb=bbox(p.out);return {p,bb,w:bb.w,h:bb.h,x:i.x,y:i.y,rot:i.rot,r2:i.r2,ts:1};});return sh;});}
/* contrôle exact du plan : chaque pièce posée une seule fois, rien hors plaque, écart ≥ sp partout */
function checkPlan(L,sheets){const bad=[],seen=new Set();let n=0;
  for(const [si,sh] of sheets.entries()){for(const it of sh.items){n++;if(seen.has(it.p))bad.push('pièce posée deux fois : '+it.p.id);seen.add(it.p);}
    for(const e of nestCheck(sh,P.sp))bad.push('plaque '+(si+1)+' : '+e);}
  if(n!==L.length)bad.push('pièces posées '+n+' / '+L.length);return bad;}

/* ---------- calcul en arrière-plan ---------- */
let WKS=[],JOB=0,CB=null;
function mkWorker(){
  const F=[bbox,area,splitFree,rng32,cpScore,mrBest,mkSheet,mrRun,mrOptimize,chutesOf,nest,segDist,inPoly,polyClear,pairItems,expandKids,toSheet,distRings,gridRects,voidRects,turnP,shapeKey,pairBest,polyClearE,nestCheck,nestParents,rnEdt,rnShape,rnGrid,rnOris,rnFind,rnFree,rescueLast,lastOnChute,tsNest];
  const src=`"use strict";importScripts(${JSON.stringify(new URL('nest7.js?v='+CALV,location.href).href)});let P={},NEST_DL=Infinity;const MATS=${JSON.stringify(MATS)};const PMx=${PMx.toString()};const scLess=${scLess.toString()};const nestLate=${nestLate.toString()};const shiftP=${shiftP.toString()};const stockFor=()=>[];
${F.map(f=>f.toString()).join('\n')}
onmessage=e=>{const d=e.data,parts=d.parts,S=d.P.SL*d.P.SW,ar=p=>Math.abs(area(p.out))-(p.holes||[]).reduce((s,h)=>s+Math.abs(area(h)),0),A=parts.reduce((s,p)=>s+ar(p),0);
  try{P=d.P;let tg=d.tg||0;
    if(!tg){const idx=new Map(parts.map((p,k)=>[p.id,k])),t0=Date.now(),r=nest(parts,{...d.P,cLast:0,useCh:0,nTS:0},400,{}).SOM;
      if(!r||r.big.length||!r.sheets.length){postMessage({id:d.id,step:'err',msg:'pièce plus grande que la plaque'});return;}
      const fast=r.sheets.map(sh=>sh.items.map(it=>({k:idx.get(it.p.id),x:it.x,y:it.y,rot:!!it.rot,r2:!!it.r2})));tg=fast.length-1;
      // une plaque de moins : seulement si la surface des pièces le permet (essais : atteinte jusqu'à 76,5 % de remplissage, jamais à 77 % et plus)
      const go=!d.fastOnly&&tg>=1&&A<=(d.fill||0.767*(d.P.SL-2*d.P.mg)*(d.P.SW-2*d.P.mg)/((d.P.SL-30)*(d.P.SW-30)))*tg*S;
      postMessage({id:d.id,step:'fast',sheets:fast,ms:Date.now()-t0,m2:A/1e6,go});
      if(!go){postMessage({id:d.id,step:'done',ok:false,why:'surface',tries:0,ms:0});return;}}
    const res=N7.search(parts.map(p=>({out:p.out,holes:p.holes||[]})),{SL:d.P.SL,SW:d.P.SW,mg:d.P.mg,sp:d.P.sp,g:2,nmax:tg,budget:d.budget,seed:d.seed||1,rot:d.rot||0,maxTries:d.maxTries,kMode:1,kScan:0.02,giveUp:{after:8,left:6}},(n,s,u)=>postMessage({id:d.id,step:'try',n,left:u}));
    postMessage({id:d.id,step:'done',ok:res.ok,sheets:res.ok?res.sheets:null,tries:res.tries,ms:res.ms,left:res.left.length});
  }catch(err){postMessage({id:d.id,step:'err',msg:String(err&&err.message||err)});}};`;
  const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  w.onmessage=e=>{const d=e.data;if(d.id!==JOB||!CB)return;CB(d,w);};w.onerror=e=>{if(CB)CB({id:JOB,step:'err',msg:'calcul interrompu ('+(e.message||'erreur')+')'},w);};
  WKS.push(w);return w;}
function stop(){WKS.forEach(w=>{try{w.terminate();}catch(e){}});WKS=[];CB=null;JOB++;}
/* calepinage d'un salon : cb({step:'fast',n,s,sig,m2} | {step:'try',n,left} | {step:'done',ok,n,s,tries,ms} | {step:'err',msg})
   la recherche de la plaque de moins tourne sur 2 calculs en parallèle quand l'appareil le permet (ordres de pose différents) : le premier qui réussit gagne */
function calc(c,o,cb){stop();const L=parts(c),sg=sig(L),id=++JOB,Pp=JSON.parse(JSON.stringify(P)),plain=L.map(p=>({id:p.id,mat:'SOM',out:p.out,holes:p.holes||[]}));
  const good=(sheets)=>{P=Pp;return checkPlan(L,mkSheets(L,sheets));},nW=(o&&o.workers)||Math.max(1,Math.min(2,(navigator.hardwareConcurrency||2)-1)),t0=Date.now();
  const base={id,parts:plain,P:Pp,budget:(o&&o.budget)||480000,maxTries:(o&&o.maxTries)||(nW>1?16:30),fill:o&&o.fill},tr=new Map();let pend=1,nTry=0,end=false;
  const fin=d=>{if(end)return;end=true;stop();cb(d);};
  CB=(d,w)=>{try{
      if(d.step==='fast'){const bad=good(d.sheets);if(bad.length){fin({step:'err',msg:'plan rapide refusé au contrôle ('+bad[0]+')'});return;}cb({step:'fast',n:d.sheets.length,s:enc(d.sheets),sig:sg,m2:d.m2,ms:d.ms});
        if(d.go)for(let k=1;k<nW;k++){pend++;mkWorker().postMessage({...base,tg:d.sheets.length-1,rot:4*k,seed:1+k});}}
      else if(d.step==='try'){tr.set(w,d.n);nTry=[...tr.values()].reduce((a,b)=>a+b,0);cb({step:'try',n:nTry,left:d.left});}
      else if(d.step==='done'){if(d.ok&&!good(d.sheets).length){fin({step:'done',ok:true,n:d.sheets.length,s:enc(d.sheets),sig:sg,tries:nTry,ms:Date.now()-t0,why:''});return;}
        if(d.why==='surface'||--pend<=0)fin({step:'done',ok:false,n:0,s:'',sig:sg,tries:nTry,ms:Date.now()-t0,why:d.why||''});}
      else{if(--pend<=0||!tr.size&&WKS.length<2)fin(d);}}catch(err){fin({step:'err',msg:String(err&&err.message||err)});}};
  try{mkWorker().postMessage({...base,seed:(o&&o.seed)||1,fastOnly:!!(o&&o.fastOnly)});}catch(err){fin({step:'err',msg:String(err&&err.message||err)});}
  return sg;}

/* ---------- programmes .cnc : mêmes réglages que le générateur v19, plus les attaches ---------- */
function tabIv(pp,tb){// attaches : intervalles relevés le long du contour, de préférence au milieu des segments droits
  const seg=[];let S=0;for(let i=1;i<pp.length;i++){const l=Math.hypot(pp[i][0]-pp[i-1][0],pp[i][1]-pp[i-1][1]);seg.push([S,l]);S+=l;}
  const Lt=tb.L;if(S<4*Lt)return [];
  const N=S<700?2:S<1600?3:4,cand=seg.filter(g=>g[1]>=Lt+8),cen=[];
  for(let k=0;k<N;k++){const tg=(k+0.5)*S/N;let best=null;
    for(const g of cand){const m=g[0]+g[1]/2,dd=Math.min(Math.abs(m-tg),S-Math.abs(m-tg));if(cen.some(c=>Math.abs(m-c)<3*Lt))continue;if(!best||dd<best[0])best=[dd,m];}
    cen.push(best&&best[0]<S/(2*N)?best[1]:tg);}
  return cen.map(c=>[Math.max(0.01,c-Lt/2),Math.min(S-0.01,c+Lt/2)]).sort((a,b)=>a[0]-b[0]);}
/* décalage sûr : le décalage simple du générateur peut faire une petite boucle qui mord dans la pièce quand le contour a des
   segments minuscules (contours de la table et des guéridons) ; les points trop près du contour sont retirés (la fraise passe au large),
   puis le parcours entier est recontrôlé segment par segment. Renvoie null si le parcours ne peut pas être garanti. */
function offSafe(Q,d,st){const need=Math.abs(d)-0.02,n=Q.length,out=d>0;
  const dPt=p=>{let m=1e18;for(let i=0;i<n;i++){const a=Q[i],b=Q[(i+1)%n],vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/l)):0,dx=p[0]-a[0]-t*vx,dy=p[1]-a[1]-t*vy,dd=dx*dx+dy*dy;if(dd<m)m=dd;}return Math.sqrt(m);};
  const okP=p=>dPt(p)>=need&&inPoly(p,Q)!==out;
  const okS=(a,b)=>{const x0=Math.min(a[0],b[0])-need,x1=Math.max(a[0],b[0])+need,y0=Math.min(a[1],b[1])-need,y1=Math.max(a[1],b[1])+need;
    for(let i=0;i<n;i++){const c=Q[i],e=Q[(i+1)%n];if(Math.max(c[0],e[0])<x0||Math.min(c[0],e[0])>x1||Math.max(c[1],e[1])<y0||Math.min(c[1],e[1])>y1)continue;if(segDist(a,b,c,e)<need)return false;}return true;};
  let Rr=offP(Q,d);const all=X=>X.every((p,i)=>okS(p,X[(i+1)%X.length]));
  if(Rr.every(okP)&&all(Rr))return Rr;
  if(st)st.rep=(st.rep||0)+1;
  for(let pass=0;pass<4;pass++){Rr=Rr.filter(okP);if(Rr.length<3)return null;
    // un segment de raccord qui passe encore trop près : on retire ses deux bouts et on recommence
    const drop=new Set();Rr.forEach((p,i)=>{if(!okS(p,Rr[(i+1)%Rr.length])){drop.add(i);drop.add((i+1)%Rr.length);}});
    if(!drop.size)return sArea(Rr)>0?Rr:null;
    Rr=Rr.filter((p,i)=>!drop.has(i));if(Rr.length<3)return null;}
  return null;}
/* opérations d'une plaque (copie de cncOps v19 ; table et guéridons : pas de dégagement d'angle ajouté, leurs contours viennent du Générateur Fûts) */
function ops(sh,PP,mat){PP={...PP,SL:sh.SL,SW:sh.SW};const R0=PP.fr/2,rd=PP.fr/2+0.05,o0=+PP.cnO||0,t=thkM(mat),D=t+(+PP.cnOv||0),st=Math.max(0.5,PP.fr*0.75),inn=[],ext=[],hostL=[],skip={},bad=[],fix={rep:0};let cur='';
  const cw=Q=>Q.slice().reverse();
  const hole=(pts,dep)=>{const c=circOf(pts);let rings=[];
    if(c){const rp=c.r+o0-R0;if(rp<-0.01){skip['trou trop petit Ø'+(2*c.r).toFixed(1)]=(skip['trou trop petit Ø'+(2*c.r).toFixed(1)]||0)+1;return;}
      rings.push(circP(c.cx,c.cy,Math.max(0,rp)));if(dep<D-1e-6)for(let r=rp-st;r>-st+0.01;r-=st)rings.push(circP(c.cx,c.cy,Math.max(0,r)));}
    else{const Q=cleanP(pts);let k=0;for(;;k++){const d=-(R0-o0)-k*st;const Rr=k===0?offSafe(Q,d,fix):offP(Q,d);if(!Rr){if(sArea(offP(Q,d))>0.5)bad.push('ouverture non garantie sur '+cur);break;}const a=sArea(Rr);if(!(a>0.5)||(k>0&&a>=sArea(rings[rings.length-1]||Rr)))break;rings.push(Rr);if(dep>=D-1e-6)break;}
      if(!rings.length){skip['poche trop étroite']=(skip['poche trop étroite']||0)+1;return;}
      if(dep<D-1e-6){const Lr=rings[rings.length-1];const xs=Lr.map(q=>q[0]),ys=Lr.map(q=>q[1]);const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
        const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;if(Math.min(w,h)>0.05)rings.push(w>=h?[[cx-(w-h)/2,cy],[cx+(w-h)/2,cy]]:[[cx,cy-(h-w)/2],[cx,cy+(h-w)/2]]);}
      rings=rings.map(Rr=>Rr.length>2?cw(Rr):Rr);}
    if(c)rings=rings.map(Rr=>Rr.length>2?cw(Rr):Rr);
    inn.push({rings,dep});};
  const par=nestParents(sh),lvl=sh.items.map(()=>0);for(let k=0;k<6;k++)par.forEach((b,i)=>{if(b)lvl[i]=lvl[b.j]+1;});
  const hostLv={};par.forEach((b,i)=>{if(b)hostLv[b.j+':'+b.hi]=Math.max(hostLv[b.j+':'+b.hi]||0,lvl[i]);});
  for(const [ii,it] of sh.items.entries()){const p=it.p,dg=PP.dog&&!p.tab;cur=p.id;
    for(const [hi,h] of (p.holes||[]).entries()){const S=toSheet(it,h),lv=hostLv[ii+':'+hi];
      if(lv){const n0=inn.length;hole(S,D);for(const o of inn.splice(n0))hostL.push({...o,lvl:lv,host:ii,hi});}else hole(S,D);
      for(const c of dogC(S,rd,dg))hole(circP(c[0],c[1],rd,0.001),D);}
    const So=toSheet(it,p.out);for(const c of dogC(So,rd,dg))hole(circP(c[0],c[1],rd,0.001),D);
    for(const q of (p.pkL||[])){const Ly=q.lay;let dep=null;
      if(/TRAVERSANT/.test(Ly))dep=D;else{const m=/_P(\d+(?:\.\d+)?)$/.exec(Ly)||/^POCHE_(\d+(?:\.\d+)?)MM$/.exec(Ly);if(m)dep=Math.min(+m[1],D);}
      if(dep==null||/FRAISAGE|V90/.test(Ly)){skip[Ly]=(skip[Ly]||0)+1;continue;}
      if(dep>=t-1e-6)dep=D;hole(toSheet(it,q.pts),dep);}
    for(const q of (p.pk||[])){skip['RAINURE dos']=(skip['RAINURE dos']||0)+1;}
    if((p.bev||[]).length)skip['ONGLET_45_V90']=(skip['ONGLET_45_V90']||0)+p.bev.length;
    if((p.fold||[]).length)skip['PLIAGE_V90']=(skip['PLIAGE_V90']||0)+p.fold.length;
    const Ro=offSafe(cleanP(So),R0,fix);if(!Ro){bad.push('contour non garanti pour '+p.id);continue;}
    ext.push({rings:[cw(Ro)],dep:D,it,ii,lvl:lvl[ii]});}
  return{inn,ext,hostL,skip,D,t,par,bad,fix:fix.rep};}
/* texte .cnc d'une plaque + ordre de sortie des pièces ; att = {on,L,H} */
function cncText(sh,PP,mat,att){PP={...PP,SL:sh.SL,SW:sh.SW};const{inn,ext,hostL,D,t,skip,par,bad:obad,fix}=ops(sh,PP,mat);const SW=PP.SW,SL=PP.SL;
  const X=q=>q[1]-SW/2,Y=q=>SL/2-q[0],f3=v=>(Math.abs(v)<0.0005?0:v).toFixed(3),Zs=f3(+PP.cnZ||8),pa=Math.max(0.5,+PP.cnPa||8);
  const L=['T1M6','G0Z'+Zs,'G0X0.000Y0.000S'+Math.round(+PP.cnS||15000)+'M3'];let lx='0.000',ly='0.000',first=true,cx=0,cy=0;
  const Fz='F'+(+PP.cnFz||3000).toFixed(1),Fc='F'+(+PP.cnF||4560).toFixed(1);
  const mv=(g,x,y,full,tail)=>{const sx=f3(x),sy=f3(y);let l=g;if(full||sx!==lx)l+='X'+sx;if(full||sy!==ly)l+='Y'+sy;lx=sx;ly=sy;if(tail)l+=tail;if(l!==g||tail)L.push(l);};
  const order=o2=>{const rest=o2.slice(),out=[];while(rest.length){let bi=0,bd=1e18;rest.forEach((o,i)=>{const s=o.rings[0][0],d=(X(s)-cx)**2+(Y(s)-cy)**2;if(d<bd){bd=d;bi=i;}});const o=rest.splice(bi,1)[0];out.push(o);const e=o.rings[o.rings.length-1][0];cx=X(e);cy=Y(e);}return out;};
  const aH=t<6?Math.min(1,+att.H||1):(+att.H||2),AT=att.on&&t-aH>0.4?{L:Math.max(5,+att.L||10),z:-(t-aH)}:null;let nTab=0,nTabP=0;
  // choix du 19/11/2026 : attaches seulement sur les petites pièces (petite surface ou pièce étroite) — les grands panneaux tiennent par leur poids
  const petit=it=>!att.small||Math.abs(area(it.p.out))<att.small.a||Math.min(it.bb.w,it.bb.h)<att.small.w;
  const ring=(Rr,z,tb)=>{const s=Rr[0];if(first){L.push('G0X'+f3(X(s))+'Y'+f3(Y(s))+'Z'+Zs);lx=f3(X(s));ly=f3(Y(s));first=false;}else{L.push('G0Z'+Zs);mv('G0',X(s),Y(s));}
    for(let zi=0;zi<z.length;zi++){const zz=z[zi];L.push('G1Z'+f3(zz)+Fz);const pts=Rr.length>2?[...Rr.slice(1),Rr[0]]:Rr.length===2?[Rr[1],Rr[0]]:[];let k=0;
      const go=q=>{if(k===0)mv('G1',X(q),Y(q),true,Fc);else mv('',X(q),Y(q));k++;};
      const iv=tb&&zi===z.length-1&&zz<tb.z-0.05?tabIv([Rr[0],...pts],tb):null;
      if(!iv||!iv.length){for(const q of pts)go(q);continue;}
      nTab+=iv.length;let up=false,s0=0,pv=Rr[0];
      for(const q of pts){const l=Math.hypot(q[0]-pv[0],q[1]-pv[1]),cuts=[];
        for(const [a,b] of iv){if(a>s0&&a<=s0+l)cuts.push([a,1]);if(b>s0&&b<=s0+l)cuts.push([b,0]);}
        cuts.sort((u,v)=>u[0]-v[0]);
        for(const [sv,isUp] of cuts){const r=l?(sv-s0)/l:0;go([pv[0]+(q[0]-pv[0])*r,pv[1]+(q[1]-pv[1])*r]);
          if(isUp&&!up){L.push('G1Z'+f3(tb.z)+Fz);up=true;k=0;}else if(!isUp&&up){L.push('G1Z'+f3(zz)+Fz);up=false;k=0;}}
        go(q);s0+=l;pv=q;}
      if(up)L.push('G1Z'+f3(zz)+Fz);}};
  // ordre : perçages et ouvertures simples, puis du plus emboîté au moins emboîté (pièces logées, puis l'ouverture qui les contenait…), pièces libres en dernier
  const oI=order(inn),oE=[];{const mx=Math.max(0,...ext.map(o=>o.lvl||0));for(let d=mx;d>=0;d--){oE.push(...order(ext.filter(o=>(o.lvl||0)===d)));if(d>0)oE.push(...order(hostL.filter(o=>o.lvl===d)));}}
  // règle du 18/11/2026 : le contour suivant ne démarre jamais près de la dernière pièce détourée (elle est libre et peut bouger)
  let prevR=null;const dSeg=(q,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy,tt=l?Math.max(0,Math.min(1,((q[0]-a[0])*vx+(q[1]-a[1])*vy)/l)):0;return Math.hypot(q[0]-a[0]-tt*vx,q[1]-a[1]-tt*vy);};
  const dRing=(q,Rr)=>{let m=1e18;for(let i=0;i<Rr.length;i++)m=Math.min(m,dSeg(q,Rr[i],Rr[(i+1)%Rr.length]));return m;};
  const farStart=Rr=>{if(!prevR||Rr.length<4)return Rr;let bk=0,bd=-1;for(let k=0;k<Rr.length;k++){const d=dRing(Rr[k],prevR);if(d>bd+1e-6){bd=d;bk=k;}}return bk?[...Rr.slice(bk),...Rr.slice(0,bk)]:Rr;};
  const isE=new Set(oE),seq=[];
  for(const o of [...oI,...oE]){const n=Math.max(1,Math.ceil(o.dep/pa-1e-9)),z=[...Array(n)].map((_,i)=>-o.dep*(i+1)/n);
    o.rings.forEach((Rr,ri)=>{const Q=isE.has(o)?farStart(Rr):Rr;if(isE.has(o))seq.push({o,b:bbox(Q.map(q=>[X(q),Y(q)]))});const tb=o.it&&ri===0&&AT&&petit(o.it)?AT:null;if(tb&&z[z.length-1]<tb.z-0.05)nTabP++;ring(Q,z,tb);});
    if(isE.has(o)){const big=o.rings.filter(Rr=>Rr.length>2).sort((a,b)=>b.length-a.length)[0];if(big)prevR=big;}}
  L.push('G0Z'+Zs,'G0X0.000Y0.000');
  return {text:L.join('\r\n')+'\r\n',out:oE.filter(o=>o.it).map(o=>o.it),seq,par,D,skip,nTab,nTabP,nIn:inn.length,obad,fix};}

/* relecture d'un .cnc : contours (suite de G1 entre deux G0), profondeur maxi, limites */
function readCnc(txt){const C=[];let x=0,y=0,z=0,cur=null,zmin=0,xm=0,ym=0;
  for(const l of txt.split(/\r\n/)){if(!l)continue;const mx=/X(-?[\d.]+)/.exec(l),my=/Y(-?[\d.]+)/.exec(l),mz=/Z(-?[\d.]+)/.exec(l);
    if(/^G0/.test(l)){if(mx)x=+mx[1];if(my)y=+my[1];if(mz)z=+mz[1];if(mx||my){cur={x0:x,y0:y,x1:x,y1:y,z:0,n:0};C.push(cur);}continue;}
    if(mz){z=+mz[1];if(z<zmin)zmin=z;if(cur&&z<cur.z)cur.z=z;}
    if(mx)x=+mx[1];if(my)y=+my[1];
    if(cur&&(mx||my)){cur.n++;if(x<cur.x0)cur.x0=x;if(x>cur.x1)cur.x1=x;if(y<cur.y0)cur.y0=y;if(y>cur.y1)cur.y1=y;}
    if(Math.abs(x)>xm)xm=Math.abs(x);if(Math.abs(y)>ym)ym=Math.abs(y);}
  return {C:C.filter(c=>c.n>0),zmin,xm,ym};}
/* contrôle bloquant d'un programme : renvoie la liste des erreurs (vide = bon) */
function checkCnc(name,sh,r){const bad=r.obad.map(e=>name+' : '+e),rd=readCnc(r.text),eps=0.02,R0=P.fr/2;
  if(rd.xm>sh.SW/2+0.01||rd.ym>sh.SL/2+0.01)bad.push(name+' : parcours hors plaque');
  if(Math.abs(-rd.zmin-r.D)>0.001)bad.push(name+' : profondeur '+(-rd.zmin)+' au lieu de '+r.D);
  // chaque pièce : un contour à pleine profondeur, à sa place et à sa taille (pièce + rayon de fraise)
  const full=rd.C.filter(c=>Math.abs(-c.z-r.D)<0.001),used=new Set(),pos=new Map();
  for(const [ii,it] of sh.items.entries()){const b=bbox(toSheet(it,it.p.out).map(q=>[q[1]-sh.SW/2,sh.SL/2-q[0]])),k=rd.C.findIndex((c,i)=>!used.has(i)&&Math.abs(-c.z-r.D)<0.001&&Math.abs(c.x0-(b.x0-R0))<eps&&Math.abs(c.x1-(b.x1+R0))<eps&&Math.abs(c.y0-(b.y0-R0))<eps&&Math.abs(c.y1-(b.y1+R0))<eps);
    if(k<0)bad.push(name+' : contour absent ou décalé pour '+it.p.id);else{used.add(k);pos.set(ii,k);}}
  if(full.length<sh.items.length)bad.push(name+' : '+full.length+' contours traversants pour '+sh.items.length+' pièces');
  // pièces logées : coupées avant le contour de la pièce qui les contient et avant l'ouverture qui les contient
  const idx=new Map();r.seq.forEach((s,i)=>{if(s.o.it)idx.set('p'+s.o.ii,i);else if(s.o.host!=null)idx.set('h'+s.o.host+':'+s.o.hi,i);});
  r.par.forEach((b,i)=>{if(!b)return;const a=idx.get('p'+i),h=idx.get('h'+b.j+':'+b.hi),o=idx.get('p'+b.j);
    if(a==null||h==null||o==null||!(a<h)||!(a<o))bad.push(name+' : '+sh.items[i].p.id+' logée dans '+sh.items[b.j].p.id+' doit être coupée avant');
    if(pos.has(i)&&pos.has(b.j)&&!(pos.get(i)<pos.get(b.j)))bad.push(name+' : ordre du fichier incorrect pour '+sh.items[i].p.id);});
  return bad;}

function cp3Sheet(){const s=DT.CP3,sh={SL:s.SL,SW:s.SW,mg:s.mg,items:[],chutes:[],stock:null};
  for(const q of s.items){const p={id:q.id,ref:'TAB',name:q.nm||q.id,mat:'PEAU',t:3,out:orient(q.o,true),holes:(q.hs||[]).map(h=>orient(h,false)),unit:q.u,tab:1},bb=bbox(p.out);sh.items.push({p,bb,w:bb.w,h:bb.h,x:bb.x0,y:bb.y0,rot:false,r2:false});}return sh;}

/* plaques CP 3 en plus (même format que la plaque des tables) : peaux des dossiers (pièces PEAU du générateur, libres de tourner) et peaux des guéridons
   en plus (copie de celles du guéridon 1, gardées dans le sens Y pour rester cintrables) ; 25 mm entre les pièces, placement toujours identique */
function cp3Extra(){const s=DT.CP3,G=25,mg=s.mg,IT=[];
  for(const p of R.parts)if(p.mat==='PEAU'&&!p.only3d&&p.out){const bb=bbox(p.out);IT.push({p,bb,w:bb.w,h:bb.h,free:1});}
  const g1=s.items.filter(q=>q.u==='G1');for(let k=0;k<nGx();k++)for(const q of g1){const u='G'+(3+k),p={id:q.id.replace(/^G1/,u),ref:'TAB',name:q.nm||q.id,mat:'PEAU',t:3,out:orient(q.o,true),holes:(q.hs||[]).map(h=>orient(h,false)),unit:u,tab:1},bb=bbox(p.out);IT.push({p,bb,w:bb.w,h:bb.h,free:0});}
  if(!IT.length)return [];
  const W=s.SL-2*mg,H=s.SW-2*mg,sheets=[],mk=()=>{const sh={SL:s.SL,SW:s.SW,mg,items:[],chutes:[],stock:null,fr:[{x:0,y:0,w:W+G,h:H+G}]};sheets.push(sh);return sh;};
  for(const it of IT)if(Math.min(it.w,it.h)>H||Math.max(it.w,it.h)>W||(!it.free&&(it.w>W||it.h>H)))throw new Error('peau '+it.p.id+' plus grande que la plaque CP 3');
  IT.sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h||(a.p.id<b.p.id?-1:1));
  const put=(sh,it)=>{let best=null;for(const [ri,r] of sh.fr.entries())for(const rot of (it.free?[false,true]:[false])){const w=(rot?it.h:it.w)+G,h=(rot?it.w:it.h)+G;if(w>r.w+1e-6||h>r.h+1e-6)continue;const sc=Math.min(r.w-w,r.h-h);if(!best||sc<best.sc-1e-9||(Math.abs(sc-best.sc)<1e-9&&(r.x<best.r.x||(r.x===best.r.x&&r.y<best.r.y))))best={sc,ri,r,rot,w,h};}
    if(!best)return false;const {r,ri,rot,w,h}=best;sh.fr.splice(ri,1);
    // coupe guillotine : le reste le long de la plaque reste entier
    if(r.w-w>1)sh.fr.push({x:r.x+w,y:r.y,w:r.w-w,h:r.h});if(r.h-h>1)sh.fr.push({x:r.x,y:r.y+h,w,h:r.h-h});
    sh.items.push({p:it.p,bb:it.bb,w:it.w,h:it.h,x:mg+r.x,y:mg+r.y,rot,r2:false});return true;};
  for(const it of IT){let ok=false;for(const sh of sheets)if(put(sh,it)){ok=true;break;}if(!ok&&!put(mk(),it))throw new Error('peau '+it.p.id+' impossible à placer');}
  // contrôle : dans la plaque, 25 mm mini entre les pièces
  sheets.forEach((sh,k)=>{const B=sh.items.map(i=>bbox(toSheet(i,i.p.out)));B.forEach((b,i)=>{if(b.x0<mg-0.01||b.y0<mg-0.01||b.x1>s.SL-mg+0.01||b.y1>s.SW-mg+0.01)throw new Error('plaque CP 3 n° '+(k+2)+' : '+sh.items[i].p.id+' sort de la plaque');
      for(let j=0;j<i;j++){const c=B[j];if(b.x0<c.x1+G-0.01&&c.x0<b.x1+G-0.01&&b.y0<c.y1+G-0.01&&c.y0<b.y1+G-0.01)throw new Error('plaque CP 3 n° '+(k+2)+' : moins de 25 mm entre '+sh.items[i].p.id+' et '+sh.items[j].p.id);}});delete sh.fr;});
  return sheets;}
const x3n=k=>'CP3-'+(k+2);
/* plan des plaques CP 3 en plus, pour la fiche CNC */
function planX(c){build(c);return planOf(cp3Extra()).map((p,k)=>({...p,n:k+2,prog:x3n(k)}));}

/* ---------- plan des plaques pour la fiche CNC (contours simplifiés, en mm entiers) ---------- */
function simp(Rg,tol){const n=Rg.length;if(n<8)return Rg.map(q=>[Math.round(q[0]),Math.round(q[1])]);
  let a=0,b=0,dm=-1;for(let i=1;i<n;i++){const d=Math.hypot(Rg[i][0]-Rg[0][0],Rg[i][1]-Rg[0][1]);if(d>dm){dm=d;b=i;}}
  const keep=new Uint8Array(n);keep[a]=keep[b]=1;
  const dp=(i0,i1)=>{const st=[[i0,i1]];while(st.length){const [u,v]=st.pop();const A=Rg[u%n],B=Rg[v%n],vx=B[0]-A[0],vy=B[1]-A[1],l=Math.hypot(vx,vy)||1;let m=-1,mi=-1;
      for(let i=u+1;i<v;i++){const q=Rg[i%n],d=Math.abs((q[0]-A[0])*vy-(q[1]-A[1])*vx)/l;if(d>m){m=d;mi=i;}}
      if(m>tol){keep[mi%n]=1;st.push([u,mi],[mi,v]);}}};
  dp(a,b);dp(b,n+a);const o=[];for(let i=0;i<n;i++)if(keep[i])o.push([Math.round(Rg[i][0]),Math.round(Rg[i][1])]);return o.length>=3?o:Rg.map(q=>[Math.round(q[0]),Math.round(q[1])]);}
function planOf(sheets){return sheets.map((sh,k)=>{let nh=0,npc=0,used=0;const it=sh.items.map(i=>{const p=i.p,O=toSheet(i,p.out),e={u:p.tab?(p.unit==='T'?'t':'g'):'c',o:simp(O,1)};for(const q of O)if(q[0]>used)used=q[0];
      const hs=(p.holes||[]).map(h=>{const S=toSheet(i,h),b=bbox(S);return simp(S,b.w*b.h<3000?0.4:1);});if(hs.length){e.h=hs;nh+=hs.length;}
      // tous les perçages faits par la CNC sont dessinés : inserts de vérins Ø 12 des semelles, vis, inserts (les fraisages, faits à la main, ne le sont pas)
      const pr=(p.pkL||[]).filter(q=>/PERCAGE/.test(q.lay)).map(q=>{const c=circOf(toSheet(i,q.pts));return c?[Math.round(c.cx*10)/10,Math.round(c.cy*10)/10,p.tab?Math.max(5,Math.round(c.r+2)):Math.max(3,Math.round(c.r))]:null;}).filter(Boolean);if(pr.length){e.p=pr;npc+=pr.length;}
      return e;});
    return {n:k+1,prog:String(k+1),SL:sh.SL,SW:sh.SW,used:Math.round(used),np:it.length,nh,npc,ne:sh.items.filter(i=>!i.p.tab).length,it};});}

/* salon prêt à sortir ses fichiers : pièces, plaques recalculées depuis le calepinage enregistré, contrôle exact */
function open(c,cal){const L=parts(c);if(sig(L)!==cal.sig)throw new Error('les cotes ou le modèle ont changé depuis le calepinage : il faut le recalculer');
  const sheets=mkSheets(L,dec(cal.s)),bad=checkPlan(L,sheets);if(bad.length)throw new Error('contrôle du plan refusé : '+bad[0]);return {L,sheets};}
function plan(c,cal){return planOf(open(c,cal).sheets);}
/* programmes d'un salon : [{name,text}], ordre de sortie des pièces, erreurs du contrôle */
function progs(c,cal,code,att){const {L,sheets}=open(c,cal),A={on:!att||att.on!==0,L:(att&&att.L)||10,H:(att&&att.H)||2,small:(att&&att.small)||null},out=[],bad=[];
  sheets.forEach((sh,k)=>{const r=cncText(sh,PM('SOM'),'SOM',A),name=code+'-'+(k+1);bad.push(...checkCnc(name,sh,r));out.push({name,text:r.text,sh,r,mat:'SOM'});});
  const s3=cp3Sheet(),r3=cncText(s3,PM('PEAU'),'PEAU',A),n3=code+'-CP3';bad.push(...checkCnc(n3,s3,r3));out.push({name:n3,text:r3.text,sh:s3,r:r3,mat:'PEAU'});
  cp3Extra().forEach((sx,k)=>{const rx=cncText(sx,PM('PEAU'),'PEAU',A),nx=code+'-'+x3n(k);bad.push(...checkCnc(nx,sx,rx));out.push({name:nx,text:rx.text,sh:sx,r:rx,mat:'PEAU'});});
  return {L,sheets,out,bad,att:A};}
/* étiquettes 60 × 40 de la carcasse, dans l'ordre de sortie de chaque plaque (table et guéridons : pas d'étiquette) */
function labels(pg,code,nom){const {jsPDF}=window.jspdf,W=60,H=40,E=[];P.cli=nom||('SALON '+code);P.refC='';
  pg.out.forEach((f,si)=>{const its=f.r.out.filter(it=>!it.p.tab),PP={...PM(f.mat),SL:f.sh.SL,SW:f.sh.SW};if(!its.length)return;
    E.push({hd:1,m:f.mat,si,sh:f.sh,PP,prg:f.name,prog:f.name,n:its.length});its.forEach((it,k)=>E.push({m:f.mat,si,sh:f.sh,PP,it,prg:f.name,prog:f.name,k:k+1,n:its.length}));});
  let g=0;const N=E.filter(e=>!e.hd).length;for(const e of E)if(!e.hd){e.g=++g;e.N=N;}
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:[W,H]});E.forEach((e,i)=>{if(i)doc.addPage([W,H],'landscape');drawPieceLabel(doc,0,0,W,H,e);});
  return {blob:doc.output('blob'),n:N};}
function note(pg,code,nom,nEtq){const L=['PROGRAMMES CNC — salon '+code+(nom?' ('+nom+')':''),'Format Lang (mm), fraise droite Ø'+P.fr+', origine au centre de la plaque, X = largeur, Y = longueur, Z0 sur le dessus.',
  'Départ de chaque détourage du côté le plus éloigné de la dernière pièce découpée. Pièces logées dans une ouverture : coupées avant cette ouverture.',
  pg.att.on?'Attaches : '+pg.att.L+' mm (dernier passage), '+pg.att.H+' mm d’épaisseur laissée (1 mm sur le CP 3), '+(pg.att.small?'seulement sur les petites pièces (moins de '+Math.round(pg.att.small.a/100)+' cm² ou moins de '+Math.round(pg.att.small.w/10)+' cm de large).':'sur toutes les pièces.'):'Sans attaches.',
  'Étiquettes 60 × 40 : '+nEtq+' pour la carcasse, dans l’ordre de sortie de chaque plaque. Table et guéridons : pas d’étiquette, aucune gravure.',''];
  for(const f of pg.out){const nc=f.sh.items.filter(i=>!i.p.tab).length;L.push(f.name+'.cnc  ←  '+(f.mat==='SOM'?'CP 15':'CP 3')+', '+f.sh.SW+' × '+f.sh.SL+', profondeur '+f.r.D+' — '+f.sh.items.length+' pièces'+(nc&&(f.mat==='SOM'||nc<f.sh.items.length)?' dont '+nc+' étiquetées':nc?' étiquetées':'')+(f.r.nTab?', '+f.r.nTab+' attaches sur '+f.r.nTabP+' pièces':''));
    const k=Object.entries(f.r.skip);if(k.length)L.push('   à faire à part : '+k.map(([a,b])=>b+' × '+a).join(', '));}
  return L.join('\r\n')+'\r\n';}
/* dossier CNC complet d'un salon : ZIP (programmes + étiquettes + note) ; refuse de sortir si le contrôle trouve une erreur */
async function files(c,cal,code,nom,att){const pg=progs(c,cal,code,att);if(pg.bad.length)throw new Error('contrôle des programmes refusé : '+pg.bad[0]+(pg.bad.length>1?' (+'+(pg.bad.length-1)+')':''));
  const lb=labels(pg,code,nom),zip=new JSZip();for(const f of pg.out)zip.file(f.name+'.cnc',f.text);
  zip.file(code+'-etiquettes-60x40.pdf',lb.blob);zip.file(code+'-LISEZMOI.txt',note(pg,code,nom,lb.n));
  return {zip:await zip.generateAsync({type:'blob',compression:'DEFLATE'}),pdf:lb.blob,nEtq:lb.n,names:pg.out.map(f=>f.name+'.cnc'),nTab:pg.out.reduce((s,f)=>s+f.r.nTab,0),nTabP:pg.out.reduce((s,f)=>s+f.r.nTabP,0),nP:pg.out.reduce((s,f)=>s+f.sh.items.length,0)};}
/* tous les salons d'un lot dans un seul ZIP (un contrôle refusé sur un salon bloque tout le ZIP) */
async function filesLot(list){const zip=new JSZip(),names=[];let nEtq=0;
  for(const a of list){const pg=progs(a.c,a.cal,a.code,a.att);if(pg.bad.length)throw new Error('contrôle des programmes refusé : '+pg.bad[0]);const lb=labels(pg,a.code,a.nom);nEtq+=lb.n;
    for(const f of pg.out){zip.file(f.name+'.cnc',f.text);names.push(f.name+'.cnc');}zip.file(a.code+'-etiquettes-60x40.pdf',lb.blob);zip.file(a.code+'-LISEZMOI.txt',note(pg,a.code,a.nom,lb.n));}
  return {zip:await zip.generateAsync({type:'blob',compression:'DEFLATE'}),names,nEtq};}
return {CALV,build,parts,sig,enc,dec,mkSheets,checkPlan,calc,stop,plan,planX,progs,labels,files,filesLot,cp3Sheet,cp3Extra,cncText,checkCnc,readCnc,planOf,open,tabParts};
})();
