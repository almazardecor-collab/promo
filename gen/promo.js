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
/* formule 1 (P.nt) : salon + 2 guéridons, sans la table — ni ses pièces CP 15, ni ses peaux CP 3 */
function tabParts(){const L=[],U=[...(P&&P.nt?[]:[['T',P&&P.tb===120?DT.T.map(T120):DT.T,'Table']]),['G1',DT.G,'Guéridon 1'],['G2',DT.G,'Guéridon 2']];for(let k=0;k<nGx();k++)U.push(['G'+(3+k),DT.G,'Guéridon '+(3+k)]);
  for(const [u,src,nm] of U)for(const q of src){const base={ref:'TAB',cat:'acc',mat:'SOM',t:15,unit:u,tab:1};
    if(u==='T'&&q.rep==='PL-C2'){ringSplit(q.c[0],q.c[1],NSEG).forEach((o,k)=>L.push({...base,id:`T-PL-C2-${k+1}`,name:`${nm} — PL-C2 (segment ${k+1}/${NSEG})`,out:orient(o,true),holes:[]}));continue;}
    const pkL=(q.pr||[]).map(v=>({lay:v[3]?`PERCAGE_D${v[2]}_P${v[3]}`:`PERCAGE_TRAVERSANT_D${v[2]}`,pts:circ(v[0],v[1],v[2]/2)}));
    L.push({...base,id:`${u}-${q.rep}`,name:`${nm} — ${q.rep}`,out:orient(q.c[0],true),holes:q.c.slice(1).map(h=>orient(h,false)),...(pkL.length?{pkL}:{})});}
  return L;}
/* toutes les pièces CP 15 du salon, toujours dans le même ordre (le calepinage enregistré désigne les pièces par leur rang) */
/* règle du 19/11/2026 : aucune pièce plus longue que la plaque (241 cm utiles). Une banquette trop longue est divisée en deux banquettes
   égales — jamais de pièce coupée en deux avec un assemblage puzzle (tenons ronds). Le dessus dépasse la caisse : on vérifie sur les pièces. */
function build(c){const L0=(+c.SL||2440)-30;
  for(const L of [0,70,130,210,310,410,610].map(d=>L0-d)){P={...DEF,...c,Lmax:L};R=buildS(P);if(!(R.splits||[]).length)break;}
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

/* format des plaques CP 3 du lot (réglable selon l'arrivage) ; le format standard 122 × 300 garde exactement la plaque standard */
/* formule 1 (sans table) : les 18 peaux des 2 guéridons, imbriquées une fois pour toutes (moteur nest7, sans quart de tour : hauteur dans la longueur,
   demi-tour permis, 30 mm mini entre les peaux) sur 1 216 × 1 192 mm → une DEMI-plaque CP 3 (150 × 122) par salon : une plaque pour 2 salons formule 1 */
const F1C3=[{"id":"G1-L1-PEAU-EXT","u":"G1","nm":"L1-PEAU-EXT","o":[[28,364.8],[26.8,356.9],[25.7,349],[24.7,341.1],[23.7,333.2],[22.7,325.3],[21.9,317.3],[21,309.4],[20.3,301.5],[19.5,293.5],[18.9,285.6],[18.2,277.6],[17.7,269.6],[17.2,261.7],[16.7,253.7],[16.3,245.7],[16,237.8],[15.7,229.8],[15.4,221.8],[15.2,213.9],[15.1,205.9],[15,197.9],[15,189.9],[15,181.9],[15.1,174],[15.2,166],[15.4,158],[15.7,150],[16,142.1],[16.3,134.1],[16.7,126.1],[17.2,118.2],[17.7,110.2],[18.2,102.2],[18.9,94.3],[19.5,86.3],[20.3,78.4],[21,70.5],[21.9,62.5],[22.7,54.6],[23.7,46.7],[24.7,38.8],[25.7,30.8],[26.8,22.9],[28,15],[388.9,68.9],[388.1,74.3],[387.4,79.8],[386.7,85.3],[386,90.7],[385.3,96.2],[384.7,101.7],[384.1,107.2],[383.6,112.7],[383.1,118.2],[382.6,123.7],[382.2,129.2],[381.8,134.7],[381.5,140.2],[381.2,145.8],[380.9,151.3],[380.6,156.8],[380.4,162.3],[380.3,167.8],[380.1,173.4],[380,178.9],[380,184.4],[380,189.9],[380,195.4],[380,201],[380.1,206.5],[380.3,212],[380.4,217.5],[380.6,223.1],[380.9,228.6],[381.2,234.1],[381.5,239.6],[381.8,245.1],[382.2,250.6],[382.6,256.1],[383.1,261.6],[383.6,267.1],[384.1,272.6],[384.7,278.1],[385.3,283.6],[386,289.1],[386.7,294.6],[387.4,300.1],[388.1,305.5],[388.9,311]]},{"id":"G1-L2-PEAU-EXT","u":"G1","nm":"L2-PEAU-EXT","o":[[781.9,15],[783.1,22.9],[784.2,30.8],[785.2,38.7],[786.2,46.6],[787.2,54.5],[788,62.5],[788.9,70.4],[789.6,78.3],[790.4,86.3],[791,94.2],[791.7,102.2],[792.2,110.2],[792.7,118.1],[793.2,126.1],[793.6,134.1],[793.9,142],[794.2,150],[794.5,158],[794.7,165.9],[794.8,173.9],[794.9,181.9],[794.9,189.9],[794.9,197.9],[794.8,205.8],[794.7,213.8],[794.5,221.8],[794.2,229.8],[793.9,237.7],[793.6,245.7],[793.2,253.7],[792.7,261.6],[792.2,269.6],[791.7,277.6],[791,285.5],[790.4,293.5],[789.6,301.4],[788.9,309.3],[788,317.3],[787.2,325.2],[786.2,333.1],[785.2,341],[784.2,349],[783.1,356.9],[781.9,364.8],[421,310.9],[421.8,305.5],[422.5,300],[423.2,294.5],[423.9,289.1],[424.6,283.6],[425.2,278.1],[425.8,272.6],[426.3,267.1],[426.8,261.6],[427.3,256.1],[427.7,250.6],[428.1,245.1],[428.4,239.6],[428.7,234],[429,228.5],[429.3,223],[429.5,217.5],[429.6,212],[429.8,206.4],[429.9,200.9],[429.9,195.4],[429.9,189.9],[429.9,184.4],[429.9,178.8],[429.8,173.3],[429.6,167.8],[429.5,162.3],[429.3,156.7],[429,151.2],[428.7,145.7],[428.4,140.2],[428.1,134.7],[427.7,129.2],[427.3,123.7],[426.8,118.2],[426.3,112.7],[425.8,107.2],[425.2,101.7],[424.6,96.2],[423.9,90.7],[423.2,85.2],[422.5,79.7],[421.8,74.3],[421,68.8]]},{"id":"G1-L3-PEAU-EXT","u":"G1","nm":"L3-PEAU-EXT","o":[[840,364.8],[838.8,356.9],[837.7,349],[836.7,341.1],[835.7,333.2],[834.7,325.3],[833.9,317.3],[833,309.4],[832.3,301.5],[831.5,293.5],[830.9,285.6],[830.2,277.6],[829.7,269.6],[829.2,261.7],[828.7,253.7],[828.3,245.7],[828,237.8],[827.7,229.8],[827.4,221.8],[827.2,213.9],[827.1,205.9],[827,197.9],[827,189.9],[827,181.9],[827.1,174],[827.2,166],[827.4,158],[827.7,150],[828,142.1],[828.3,134.1],[828.7,126.1],[829.2,118.2],[829.7,110.2],[830.2,102.2],[830.9,94.3],[831.5,86.3],[832.3,78.4],[833,70.5],[833.9,62.5],[834.7,54.6],[835.7,46.7],[836.7,38.8],[837.7,30.8],[838.8,22.9],[840,15],[1200.9,68.9],[1200.1,74.3],[1199.4,79.8],[1198.7,85.3],[1198,90.7],[1197.3,96.2],[1196.7,101.7],[1196.1,107.2],[1195.6,112.7],[1195.1,118.2],[1194.6,123.7],[1194.2,129.2],[1193.8,134.7],[1193.5,140.2],[1193.2,145.8],[1192.9,151.3],[1192.6,156.8],[1192.4,162.3],[1192.3,167.8],[1192.1,173.4],[1192,178.9],[1192,184.4],[1192,189.9],[1192,195.4],[1192,201],[1192.1,206.5],[1192.3,212],[1192.4,217.5],[1192.6,223.1],[1192.9,228.6],[1193.2,234.1],[1193.5,239.6],[1193.8,245.1],[1194.2,250.6],[1194.6,256.1],[1195.1,261.6],[1195.6,267.1],[1196.1,272.6],[1196.7,278.1],[1197.3,283.6],[1198,289.1],[1198.7,294.6],[1199.4,300.1],[1200.1,305.5],[1200.9,311]]},{"id":"G2-L1-PEAU-EXT","u":"G2","nm":"L1-PEAU-EXT","o":[[383.9,345],[385.1,352.9],[386.2,360.8],[387.2,368.7],[388.2,376.6],[389.2,384.5],[390,392.5],[390.9,400.4],[391.6,408.3],[392.4,416.3],[393,424.2],[393.7,432.2],[394.2,440.2],[394.7,448.1],[395.2,456.1],[395.6,464.1],[395.9,472],[396.2,480],[396.5,488],[396.7,495.9],[396.8,503.9],[396.9,511.9],[396.9,519.9],[396.9,527.9],[396.8,535.8],[396.7,543.8],[396.5,551.8],[396.2,559.8],[395.9,567.7],[395.6,575.7],[395.2,583.7],[394.7,591.6],[394.2,599.6],[393.7,607.6],[393,615.5],[392.4,623.5],[391.6,631.4],[390.9,639.3],[390,647.3],[389.2,655.2],[388.2,663.1],[387.2,671],[386.2,679],[385.1,686.9],[383.9,694.8],[23,640.9],[23.8,635.5],[24.5,630],[25.2,624.5],[25.9,619.1],[26.6,613.6],[27.2,608.1],[27.8,602.6],[28.3,597.1],[28.8,591.6],[29.3,586.1],[29.7,580.6],[30.1,575.1],[30.4,569.6],[30.7,564],[31,558.5],[31.3,553],[31.5,547.5],[31.6,542],[31.8,536.4],[31.9,530.9],[31.9,525.4],[31.9,519.9],[31.9,514.4],[31.9,508.8],[31.8,503.3],[31.6,497.8],[31.5,492.3],[31.3,486.7],[31,481.2],[30.7,475.7],[30.4,470.2],[30.1,464.7],[29.7,459.2],[29.3,453.7],[28.8,448.2],[28.3,442.7],[27.8,437.2],[27.2,431.7],[26.6,426.2],[25.9,420.7],[25.2,415.2],[24.5,409.7],[23.8,404.3],[23,398.8]]},{"id":"G2-L2-PEAU-EXT","u":"G2","nm":"L2-PEAU-EXT","o":[[1183.9,347],[1185.1,354.9],[1186.2,362.8],[1187.2,370.7],[1188.2,378.6],[1189.2,386.5],[1190,394.5],[1190.9,402.4],[1191.6,410.3],[1192.4,418.3],[1193,426.2],[1193.7,434.2],[1194.2,442.2],[1194.7,450.1],[1195.2,458.1],[1195.6,466.1],[1195.9,474],[1196.2,482],[1196.5,490],[1196.7,497.9],[1196.8,505.9],[1196.9,513.9],[1196.9,521.9],[1196.9,529.9],[1196.8,537.8],[1196.7,545.8],[1196.5,553.8],[1196.2,561.8],[1195.9,569.7],[1195.6,577.7],[1195.2,585.7],[1194.7,593.6],[1194.2,601.6],[1193.7,609.6],[1193,617.5],[1192.4,625.5],[1191.6,633.4],[1190.9,641.3],[1190,649.3],[1189.2,657.2],[1188.2,665.1],[1187.2,673],[1186.2,681],[1185.1,688.9],[1183.9,696.8],[823,642.9],[823.8,637.5],[824.5,632],[825.2,626.5],[825.9,621.1],[826.6,615.6],[827.2,610.1],[827.8,604.6],[828.3,599.1],[828.8,593.6],[829.3,588.1],[829.7,582.6],[830.1,577.1],[830.4,571.6],[830.7,566],[831,560.5],[831.3,555],[831.5,549.5],[831.6,544],[831.8,538.4],[831.9,532.9],[831.9,527.4],[831.9,521.9],[831.9,516.4],[831.9,510.8],[831.8,505.3],[831.6,499.8],[831.5,494.3],[831.3,488.7],[831,483.2],[830.7,477.7],[830.4,472.2],[830.1,466.7],[829.7,461.2],[829.3,455.7],[828.8,450.2],[828.3,444.7],[827.8,439.2],[827.2,433.7],[826.6,428.2],[825.9,422.7],[825.2,417.2],[824.5,411.7],[823.8,406.3],[823,400.8]]},{"id":"G2-L3-PEAU-EXT","u":"G2","nm":"L3-PEAU-EXT","o":[[802,1022.8],[800.8,1014.9],[799.7,1007],[798.7,999.1],[797.7,991.2],[796.7,983.3],[795.9,975.3],[795,967.4],[794.3,959.5],[793.5,951.5],[792.9,943.6],[792.2,935.6],[791.7,927.6],[791.2,919.7],[790.7,911.7],[790.3,903.7],[790,895.8],[789.7,887.8],[789.4,879.8],[789.2,871.9],[789.1,863.9],[789,855.9],[789,847.9],[789,839.9],[789.1,832],[789.2,824],[789.4,816],[789.7,808],[790,800.1],[790.3,792.1],[790.7,784.1],[791.2,776.2],[791.7,768.2],[792.2,760.2],[792.9,752.3],[793.5,744.3],[794.3,736.4],[795,728.5],[795.9,720.5],[796.7,712.6],[797.7,704.7],[798.7,696.8],[799.7,688.8],[800.8,680.9],[802,673],[1162.9,726.9],[1162.1,732.3],[1161.4,737.8],[1160.7,743.3],[1160,748.7],[1159.3,754.2],[1158.7,759.7],[1158.1,765.2],[1157.6,770.7],[1157.1,776.2],[1156.6,781.7],[1156.2,787.2],[1155.8,792.7],[1155.5,798.2],[1155.2,803.8],[1154.9,809.3],[1154.6,814.8],[1154.4,820.3],[1154.3,825.8],[1154.1,831.4],[1154,836.9],[1154,842.4],[1154,847.9],[1154,853.4],[1154,859],[1154.1,864.5],[1154.3,870],[1154.4,875.5],[1154.6,881.1],[1154.9,886.6],[1155.2,892.1],[1155.5,897.6],[1155.8,903.1],[1156.2,908.6],[1156.6,914.1],[1157.1,919.6],[1157.6,925.1],[1158.1,930.6],[1158.7,936.1],[1159.3,941.6],[1160,947.1],[1160.7,952.6],[1161.4,958.1],[1162.1,963.5],[1162.9,969]]},{"id":"G1-L3-PEAU-LIS","u":"G1","nm":"L3-PEAU-LIS","o":[[429.3,473],[429.3,470.9],[429.2,468.8],[429.2,466.8],[429.1,464.7],[429.1,462.6],[429.1,460.5],[429.1,458.4],[429,456.3],[429,454.3],[429,452.2],[429,450.1],[429,448],[429,445.9],[429,443.8],[429,441.8],[429,439.7],[429.1,437.6],[429.1,435.5],[429.1,433.4],[429.1,431.3],[429.2,429.3],[429.2,427.2],[429.3,425.1],[429.3,423],[794.2,431.8],[794.1,433.2],[794.1,434.5],[794.1,435.9],[794.1,437.2],[794,438.6],[794,439.9],[794,441.3],[794,442.6],[794,444],[794,445.3],[794,446.7],[794,448],[794,449.4],[794,450.7],[794,452],[794,453.4],[794,454.7],[794,456.1],[794,457.4],[794.1,458.8],[794.1,460.1],[794.1,461.5],[794.1,462.8],[794.2,464.2]]},{"id":"G2-L1-PEAU-LIS","u":"G2","nm":"L1-PEAU-LIS","o":[[797.9,497],[797.9,499.1],[798,501.2],[798,503.2],[798.1,505.3],[798.1,507.4],[798.1,509.5],[798.1,511.6],[798.2,513.7],[798.2,515.7],[798.2,517.8],[798.2,519.9],[798.2,522],[798.2,524.1],[798.2,526.2],[798.2,528.2],[798.2,530.3],[798.1,532.4],[798.1,534.5],[798.1,536.6],[798.1,538.7],[798,540.7],[798,542.8],[797.9,544.9],[797.9,547],[433,538.2],[433.1,536.8],[433.1,535.5],[433.1,534.1],[433.1,532.8],[433.2,531.4],[433.2,530.1],[433.2,528.7],[433.2,527.4],[433.2,526],[433.2,524.7],[433.2,523.3],[433.2,522],[433.2,520.6],[433.2,519.3],[433.2,518],[433.2,516.6],[433.2,515.3],[433.2,513.9],[433.2,512.6],[433.1,511.2],[433.1,509.9],[433.1,508.5],[433.1,507.2],[433,505.8]]},{"id":"G2-L2-PEAU-LIS","u":"G2","nm":"L2-PEAU-LIS","o":[[429.3,621],[429.3,618.9],[429.2,616.8],[429.2,614.8],[429.1,612.7],[429.1,610.6],[429.1,608.5],[429.1,606.4],[429,604.3],[429,602.3],[429,600.2],[429,598.1],[429,596],[429,593.9],[429,591.8],[429,589.8],[429,587.7],[429.1,585.6],[429.1,583.5],[429.1,581.4],[429.1,579.3],[429.2,577.3],[429.2,575.2],[429.3,573.1],[429.3,571],[794.2,579.8],[794.1,581.2],[794.1,582.5],[794.1,583.9],[794.1,585.2],[794,586.6],[794,587.9],[794,589.3],[794,590.6],[794,592],[794,593.3],[794,594.7],[794,596],[794,597.4],[794,598.7],[794,600],[794,601.4],[794,602.7],[794,604.1],[794,605.4],[794.1,606.8],[794.1,608.1],[794.1,609.5],[794.1,610.8],[794.2,612.2]]},{"id":"G2-L3-PEAU-LIS","u":"G2","nm":"L3-PEAU-LIS","o":[[67.3,769],[67.3,766.9],[67.2,764.8],[67.2,762.8],[67.1,760.7],[67.1,758.6],[67.1,756.5],[67.1,754.4],[67,752.3],[67,750.3],[67,748.2],[67,746.1],[67,744],[67,741.9],[67,739.8],[67,737.8],[67,735.7],[67.1,733.6],[67.1,731.5],[67.1,729.4],[67.1,727.3],[67.2,725.3],[67.2,723.2],[67.3,721.1],[67.3,719],[432.2,727.8],[432.1,729.2],[432.1,730.5],[432.1,731.9],[432.1,733.2],[432,734.6],[432,735.9],[432,737.3],[432,738.6],[432,740],[432,741.3],[432,742.7],[432,744],[432,745.4],[432,746.7],[432,748],[432,749.4],[432,750.7],[432,752.1],[432,753.4],[432.1,754.8],[432.1,756.1],[432.1,757.5],[432.1,758.8],[432.2,760.2]]},{"id":"G1-CH1-PEAU-EXT","u":"G1","nm":"CH1-PEAU-EXT","o":[[751.8,645],[753.1,652.7],[754.3,660.5],[755.3,668.3],[756.3,676.1],[757.1,683.9],[757.9,691.7],[758.5,699.5],[759,707.4],[759.4,715.2],[759.7,723.1],[759.8,730.9],[759.9,738.8],[759.8,746.6],[759.7,754.5],[759.4,762.3],[759,770.1],[758.5,778],[757.9,785.8],[757.1,793.6],[756.3,801.4],[755.3,809.2],[754.3,817],[753.1,824.8],[751.8,832.5],[587,803.9],[587.9,798.5],[588.7,793.1],[589.5,787.7],[590.1,782.3],[590.7,776.9],[591.2,771.4],[591.6,766],[592,760.6],[592.3,755.1],[592.5,749.7],[592.6,744.2],[592.6,738.8],[592.6,733.3],[592.5,727.9],[592.3,722.4],[592,717],[591.6,711.5],[591.2,706.1],[590.7,700.7],[590.1,695.2],[589.5,689.8],[588.7,684.4],[587.9,679],[587,673.6]]},{"id":"G1-CH2-PEAU-EXT","u":"G1","nm":"CH2-PEAU-EXT","o":[[585.1,1024.5],[583.8,1016.8],[582.6,1009],[581.6,1001.2],[580.6,993.4],[579.8,985.6],[579,977.8],[578.4,970],[577.9,962.1],[577.5,954.3],[577.2,946.4],[577.1,938.6],[577,930.7],[577.1,922.9],[577.2,915],[577.5,907.2],[577.9,899.4],[578.4,891.5],[579,883.7],[579.8,875.9],[580.6,868.1],[581.6,860.3],[582.6,852.5],[583.8,844.7],[585.1,837],[749.9,865.6],[749,871],[748.2,876.4],[747.4,881.8],[746.8,887.2],[746.2,892.6],[745.7,898.1],[745.3,903.5],[744.9,908.9],[744.6,914.4],[744.4,919.8],[744.3,925.3],[744.3,930.7],[744.3,936.2],[744.4,941.6],[744.6,947.1],[744.9,952.5],[745.3,958],[745.7,963.4],[746.2,968.8],[746.8,974.3],[747.4,979.7],[748.2,985.1],[749,990.5],[749.9,995.9]]},{"id":"G1-CH3-PEAU-EXT","u":"G1","nm":"CH3-PEAU-EXT","o":[[537.8,775],[539.1,782.7],[540.3,790.5],[541.3,798.3],[542.3,806.1],[543.1,813.9],[543.9,821.7],[544.5,829.5],[545,837.4],[545.4,845.2],[545.7,853.1],[545.8,860.9],[545.9,868.8],[545.8,876.6],[545.7,884.5],[545.4,892.3],[545,900.1],[544.5,908],[543.9,915.8],[543.1,923.6],[542.3,931.4],[541.3,939.2],[540.3,947],[539.1,954.8],[537.8,962.5],[373,933.9],[373.9,928.5],[374.7,923.1],[375.5,917.7],[376.1,912.3],[376.7,906.9],[377.2,901.4],[377.6,896],[378,890.6],[378.3,885.1],[378.5,879.7],[378.6,874.2],[378.6,868.8],[378.6,863.3],[378.5,857.9],[378.3,852.4],[378,847],[377.6,841.5],[377.2,836.1],[376.7,830.7],[376.1,825.2],[375.5,819.8],[374.7,814.4],[373.9,809],[373,803.6]]},{"id":"G2-CH1-PEAU-EXT","u":"G2","nm":"CH1-PEAU-EXT","o":[[383.1,1156.5],[381.8,1148.8],[380.6,1141],[379.6,1133.2],[378.6,1125.4],[377.8,1117.6],[377,1109.8],[376.4,1102],[375.9,1094.1],[375.5,1086.3],[375.2,1078.4],[375.1,1070.6],[375,1062.7],[375.1,1054.9],[375.2,1047],[375.5,1039.2],[375.9,1031.4],[376.4,1023.5],[377,1015.7],[377.8,1007.9],[378.6,1000.1],[379.6,992.3],[380.6,984.5],[381.8,976.7],[383.1,969],[547.9,997.6],[547,1003],[546.2,1008.4],[545.4,1013.8],[544.8,1019.2],[544.2,1024.6],[543.7,1030.1],[543.3,1035.5],[542.9,1040.9],[542.6,1046.4],[542.4,1051.8],[542.3,1057.3],[542.3,1062.7],[542.3,1068.2],[542.4,1073.6],[542.6,1079.1],[542.9,1084.5],[543.3,1090],[543.7,1095.4],[544.2,1100.8],[544.8,1106.3],[545.4,1111.7],[546.2,1117.1],[547,1122.5],[547.9,1127.9]]},{"id":"G2-CH2-PEAU-EXT","u":"G2","nm":"CH2-PEAU-EXT","o":[[333.8,795],[335.1,802.7],[336.3,810.5],[337.3,818.3],[338.3,826.1],[339.1,833.9],[339.9,841.7],[340.5,849.5],[341,857.4],[341.4,865.2],[341.7,873.1],[341.8,880.9],[341.9,888.8],[341.8,896.6],[341.7,904.5],[341.4,912.3],[341,920.1],[340.5,928],[339.9,935.8],[339.1,943.6],[338.3,951.4],[337.3,959.2],[336.3,967],[335.1,974.8],[333.8,982.5],[169,953.9],[169.9,948.5],[170.7,943.1],[171.5,937.7],[172.1,932.3],[172.7,926.9],[173.2,921.4],[173.6,916],[174,910.6],[174.3,905.1],[174.5,899.7],[174.6,894.2],[174.6,888.8],[174.6,883.3],[174.5,877.9],[174.3,872.4],[174,867],[173.6,861.5],[173.2,856.1],[172.7,850.7],[172.1,845.2],[171.5,839.8],[170.7,834.4],[169.9,829],[169,823.6]]},{"id":"G2-CH3-PEAU-EXT","u":"G2","nm":"CH3-PEAU-EXT","o":[[179.1,1176.5],[177.8,1168.8],[176.6,1161],[175.6,1153.2],[174.6,1145.4],[173.8,1137.6],[173,1129.8],[172.4,1122],[171.9,1114.1],[171.5,1106.3],[171.2,1098.4],[171.1,1090.6],[171,1082.7],[171.1,1074.9],[171.2,1067],[171.5,1059.2],[171.9,1051.4],[172.4,1043.5],[173,1035.7],[173.8,1027.9],[174.6,1020.1],[175.6,1012.3],[176.6,1004.5],[177.8,996.7],[179.1,989],[343.9,1017.6],[343,1023],[342.2,1028.4],[341.4,1033.8],[340.8,1039.2],[340.2,1044.6],[339.7,1050.1],[339.3,1055.5],[338.9,1060.9],[338.6,1066.4],[338.4,1071.8],[338.3,1077.3],[338.3,1082.7],[338.3,1088.2],[338.4,1093.6],[338.6,1099.1],[338.9,1104.5],[339.3,1110],[339.7,1115.4],[340.2,1120.8],[340.8,1126.3],[341.4,1131.7],[342.2,1137.1],[343,1142.5],[343.9,1147.9]]},{"id":"G1-L1-PEAU-LIS","u":"G1","nm":"L1-PEAU-LIS","o":[[621.3,1101],[621.3,1098.9],[621.2,1096.8],[621.2,1094.8],[621.1,1092.7],[621.1,1090.6],[621.1,1088.5],[621.1,1086.4],[621,1084.3],[621,1082.3],[621,1080.2],[621,1078.1],[621,1076],[621,1073.9],[621,1071.8],[621,1069.8],[621,1067.7],[621.1,1065.6],[621.1,1063.5],[621.1,1061.4],[621.1,1059.3],[621.2,1057.3],[621.2,1055.2],[621.3,1053.1],[621.3,1051],[986.2,1059.8],[986.1,1061.2],[986.1,1062.5],[986.1,1063.9],[986.1,1065.2],[986,1066.6],[986,1067.9],[986,1069.3],[986,1070.6],[986,1072],[986,1073.3],[986,1074.7],[986,1076],[986,1077.4],[986,1078.7],[986,1080],[986,1081.4],[986,1082.7],[986,1084.1],[986,1085.4],[986.1,1086.8],[986.1,1088.1],[986.1,1089.5],[986.1,1090.8],[986.2,1092.2]]},{"id":"G1-L2-PEAU-LIS","u":"G1","nm":"L2-PEAU-LIS","o":[[987.9,1125],[987.9,1127.1],[988,1129.2],[988,1131.2],[988.1,1133.3],[988.1,1135.4],[988.1,1137.5],[988.1,1139.6],[988.2,1141.7],[988.2,1143.7],[988.2,1145.8],[988.2,1147.9],[988.2,1150],[988.2,1152.1],[988.2,1154.2],[988.2,1156.2],[988.2,1158.3],[988.1,1160.4],[988.1,1162.5],[988.1,1164.6],[988.1,1166.7],[988,1168.7],[988,1170.8],[987.9,1172.9],[987.9,1175],[623,1166.2],[623.1,1164.8],[623.1,1163.5],[623.1,1162.1],[623.1,1160.8],[623.2,1159.4],[623.2,1158.1],[623.2,1156.7],[623.2,1155.4],[623.2,1154],[623.2,1152.7],[623.2,1151.3],[623.2,1150],[623.2,1148.6],[623.2,1147.3],[623.2,1146],[623.2,1144.6],[623.2,1143.3],[623.2,1141.9],[623.2,1140.6],[623.1,1139.2],[623.1,1137.9],[623.1,1136.5],[623.1,1135.2],[623,1133.8]]}];
const c3B=()=>{const d=DT.CP3;return {SL:Math.round(+(P&&P.c3L))||d.SL,SW:Math.round(+(P&&P.c3W))||d.SW,mg:d.mg};};
const f1Box=()=>{let x=0,y=0;for(const q of F1C3)for(const v of q.o){if(v[0]>x)x=v[0];if(v[1]>y)y=v[1];}return {L:Math.ceil(x)+DT.CP3.mg,W:Math.ceil(y)+DT.CP3.mg};};
const c3S=()=>{const s=c3B();if(P&&P.nt){const h=Math.floor(s.SL/2),b=f1Box();if(h>=b.L&&s.SW>=b.W)return {...s,SL:h,half:1};}return s;},c3Def=()=>{const s=c3B();return s.SL===DT.CP3.SL&&s.SW===DT.CP3.SW;};
const stdIt=()=>(P&&P.nt?F1C3:DT.CP3.items).map(q=>{const p={id:q.id,ref:'TAB',name:q.nm||q.id,mat:'PEAU',t:3,out:orient(q.o,true),holes:(q.hs||[]).map(h=>orient(h,false)),unit:q.u,tab:1},bb=bbox(p.out);return {p,bb,w:bb.w,h:bb.h,x:bb.x0,y:bb.y0,rot:false,r2:false,std:1};});
function cp3Sheet(){const s=c3S(),sh={SL:s.SL,SW:s.SW,mg:s.mg,items:stdIt(),chutes:[],stock:null};return sh;}
/* peaux de la table et des 2 guéridons : la plaque standard telle quelle si elle tient dans le format du lot ; sinon coupée en tranches dans la longueur
   (mêmes positions relatives, donc mêmes écarts) ; si la plaque est trop étroite, rangées une à une (sans tourner, 25 mm entre les pièces) */
function cp3Std(){const s=c3S(),I=stdIt(),Y1=Math.max(...I.map(i=>i.bb.y1)),X1=Math.max(...I.map(i=>i.bb.x1));
  if(X1+s.mg<=s.SL+0.01&&Y1+s.mg<=s.SW+0.01)return [cp3Sheet()];
  if(Y1+s.mg>s.SW+0.01)return cp3Pack(I.map(i=>({...i,free:0})),[]);
  const out=[];let rest=I.slice();
  while(rest.length){const dx=Math.min(...rest.map(i=>i.bb.x0))-s.mg,fit=rest.filter(i=>i.bb.x1-dx<=s.SL-s.mg+0.01);
    if(!fit.length)throw new Error('peau '+rest[0].p.id+' plus grande que la plaque CP 3');
    out.push({SL:s.SL,SW:s.SW,mg:s.mg,items:fit.map(i=>({...i,x:i.x-dx})),chutes:[],stock:null});rest=rest.filter(i=>!fit.includes(i));}
  return out;}

/* plaques CP 3 en plus (même format que la plaque des tables) : peaux des guéridons en plus (copie de celles du guéridon 1, gardées dans le sens Y
   pour rester cintrables) ; 25 mm entre les pièces, placement toujours identique.
   Règle du 23/11/2026 : les peaux des dossiers ne sont plus sur les plaques CP 3 (le menuisier les coupe dans les chutes). */
function cp3Extra(){return cp3All().ext;}
function cp3All(){const s=c3S(),IT=[];
  const g1=DT.CP3.items.filter(q=>q.u==='G1');for(let k=0;k<nGx();k++)for(const q of g1){const u='G'+(3+k),p={id:q.id.replace(/^G1/,u),ref:'TAB',name:q.nm||q.id,mat:'PEAU',t:3,out:orient(q.o,true),holes:(q.hs||[]).map(h=>orient(h,false)),unit:u,tab:1},bb=bbox(p.out);IT.push({p,bb,w:bb.w,h:bb.h,free:0});}
  const std=cp3Std();
  // format standard : les peaux en plus vont sur des plaques à part (comme avant) ; autre format : elles remplissent d'abord la fin de la dernière plaque des tables
  return {std,ext:IT.length?cp3Pack(IT,c3Def()?[]:[std[std.length-1]]):[]};}
function cp3Pack(IT,init){const s=c3S(),G=25,mg=s.mg;
  const W=s.SL-2*mg,H=s.SW-2*mg,sheets=[],mk=()=>{const sh={SL:s.SL,SW:s.SW,mg,items:[],chutes:[],stock:null,fr:[{x:0,y:0,w:W+G,h:H+G}]};sheets.push(sh);return sh;};
  for(const sh of init){const x1=Math.max(...sh.items.map(i=>bbox(toSheet(i,i.p.out)).x1)),x=x1-mg+G;sh.fr=x<W+G-1?[{x,y:0,w:W+G-x,h:H+G}]:[];}
  for(const it of IT)if(Math.min(it.w,it.h)>H||Math.max(it.w,it.h)>W||(!it.free&&(it.w>W||it.h>H)))throw new Error('peau '+it.p.id+' plus grande que la plaque CP 3');
  IT.sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h||(a.p.id<b.p.id?-1:1));
  const put=(sh,it)=>{let best=null;for(const [ri,r] of sh.fr.entries())for(const rot of (it.free?[false,true]:[false])){const w=(rot?it.h:it.w)+G,h=(rot?it.w:it.h)+G;if(w>r.w+1e-6||h>r.h+1e-6)continue;const sc=Math.min(r.w-w,r.h-h);if(!best||sc<best.sc-1e-9||(Math.abs(sc-best.sc)<1e-9&&(r.x<best.r.x||(r.x===best.r.x&&r.y<best.r.y))))best={sc,ri,r,rot,w,h};}
    if(!best)return false;const {r,ri,rot,w,h}=best;sh.fr.splice(ri,1);
    // coupe guillotine : le reste le long de la plaque reste entier
    if(r.w-w>1)sh.fr.push({x:r.x+w,y:r.y,w:r.w-w,h:r.h});if(r.h-h>1)sh.fr.push({x:r.x,y:r.y+h,w,h:r.h-h});
    sh.items.push({p:it.p,bb:it.bb,w:it.w,h:it.h,x:mg+r.x,y:mg+r.y,rot,r2:false});return true;};
  for(const it of IT){let ok=false;for(const sh of init.concat(sheets))if(put(sh,it)){ok=true;break;}if(!ok&&!put(mk(),it))throw new Error('peau '+it.p.id+' impossible à placer');}
  // contrôle : dans la plaque, 25 mm mini entre les pièces (les peaux de la plaque standard gardent leur imbrication contrôlée)
  init.concat(sheets).forEach((sh,k)=>{const B=sh.items.map(i=>bbox(toSheet(i,i.p.out)));B.forEach((b,i)=>{if(b.x0<mg-0.01||b.y0<mg-0.01||b.x1>s.SL-mg+0.01||b.y1>s.SW-mg+0.01)throw new Error('plaque CP 3 : '+sh.items[i].p.id+' sort de la plaque');
      for(let j=0;j<i;j++){if(sh.items[i].std&&sh.items[j].std)continue;const c=B[j];if(b.x0<c.x1+G-0.01&&c.x0<b.x1+G-0.01&&b.y0<c.y1+G-0.01&&c.y0<b.y1+G-0.01)throw new Error('plaque CP 3 : moins de 25 mm entre '+sh.items[i].p.id+' et '+sh.items[j].p.id);}});delete sh.fr;});
  return sheets;}
const c3n=k=>k?'CP3-'+(k+1):'CP3';
/* plan des plaques CP 3 pour la fiche CNC : format standard → seulement les plaques en plus (la plaque des tables est fixe) ; autre format → toutes */
function planX(c){build(c);const A=cp3All();if(c3Def()&&!P.nt)return planOf(A.ext).map((p,k)=>({...p,n:k+2,prog:c3n(k+1)}));
  return planOf(A.std.concat(A.ext)).map((p,k)=>({...p,n:k+1,prog:c3n(k),all:1}));}

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
  const A3=cp3All();A3.std.concat(A3.ext).forEach((sx,k)=>{const rx=cncText(sx,PM('PEAU'),'PEAU',A),nx=code+'-'+c3n(k);bad.push(...checkCnc(nx,sx,rx));out.push({name:nx,text:rx.text,sh:sx,r:rx,mat:'PEAU'});});
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
  'Étiquettes 60 × 40 : '+nEtq+' pour la carcasse, dans l’ordre de sortie de chaque plaque. '+(P&&P.nt?'Formule 1 : pas de table. Guéridons':'Table et guéridons')+' : pas d’étiquette, aucune gravure.',''];
  for(const f of pg.out){const nc=f.sh.items.filter(i=>!i.p.tab).length;L.push(f.name+'.cnc  ←  '+(f.mat==='SOM'?'CP 15':'CP 3'+(f.sh.SL<c3B().SL?' DEMI-PLAQUE (couper une plaque CP 3 en 2, l’autre moitié sert au salon formule 1 suivant)':''))+', '+f.sh.SW+' × '+f.sh.SL+', profondeur '+f.r.D+' — '+f.sh.items.length+' pièces'+(nc&&(f.mat==='SOM'||nc<f.sh.items.length)?' dont '+nc+' étiquetées':nc?' étiquetées':'')+(f.r.nTab?', '+f.r.nTab+' attaches sur '+f.r.nTabP+' pièces':''));
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
return {c3S,CALV,build,parts,sig,enc,dec,mkSheets,checkPlan,calc,stop,plan,planX,progs,labels,files,filesLot,cp3Sheet,cp3Extra,cp3All,cncText,checkCnc,readCnc,planOf,open,tabParts};
})();
