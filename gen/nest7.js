/* ===== nest7 — calepinage en forme réelle à trame fine (moteur promo ALMAZAR) =====
   Chaque pièce est tramée à g mm avec sa vraie forme (vides compris), élargie de sp/2 + 0,71 g : deux trames qui ne se
   recouvrent pas garantissent au moins sp mm entre les deux pièces. Les pièces sont posées de la plus grande à la plus
   petite, dans la 1re plaque qui les reçoit, à la position qui touche le plus les pièces déjà posées et les bords
   (4 orientations). Plusieurs ordres de pose sont essayés ; le résultat est rejoué à l'identique (tirage à graine fixe).
   Le contrôle exact (écarts, marges) est fait ensuite par le générateur (nestCheck) : ce moteur ne valide rien lui-même. */
(function(G){'use strict';
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function bboxOf(P){var x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;for(var i=0;i<P.length;i++){var q=P[i];if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];}return {x0:x0,y0:y0,x1:x1,y1:y1,w:x1-x0,h:y1-y0};}
function areaOf(P){var a=0;for(var i=0;i<P.length;i++){var p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
/* même convention que toSheet() du générateur, posée en (0,0) */
function oriPts(pts,bb,rot,r2){var o=new Array(pts.length);for(var k=0;k<pts.length;k++){var q=pts[k],a=r2?bb.x0+bb.x1-q[0]:q[0],b=r2?bb.y0+bb.y1-q[1]:q[1];o[k]=rot?[bb.y1-b,a-bb.x0]:[a-bb.x0,b-bb.y0];}return o;}

/* trame d'une orientation : colonnes de plages [y0,y1] (cellules dont le centre est dans la matière ou à moins de b du contour) */
function raster(rings,w,h,g,b,nb){var nx=Math.ceil(w/g-1e-9)+2*nb,ny=Math.ceil(h/g-1e-9)+2*nb,M=new Uint8Array(nx*ny),b2=b*b,ix,iy,k,r,i;
  for(ix=0;ix<nx;ix++){var cx=(ix-nb+0.5)*g,ys=[];
    for(r=0;r<rings.length;r++){var R=rings[r];for(i=0;i<R.length;i++){var A=R[i],B=R[(i+1)%R.length];if((A[0]>cx)!==(B[0]>cx))ys.push(A[1]+(cx-A[0])*(B[1]-A[1])/(B[0]-A[0]));}}
    ys.sort(function(u,v){return u-v;});
    for(k=0;k+1<ys.length;k+=2){var a0=Math.max(0,Math.ceil(ys[k]/g+nb-0.5)),a1=Math.min(ny-1,Math.floor(ys[k+1]/g+nb-0.5));for(iy=a0;iy<=a1;iy++)M[ix*ny+iy]=1;}}
  for(r=0;r<rings.length;r++){var R2=rings[r];for(i=0;i<R2.length;i++){var P=R2[i],Q=R2[(i+1)%R2.length],vx=Q[0]-P[0],vy=Q[1]-P[1],l2=vx*vx+vy*vy;
      var x0=Math.max(0,Math.ceil((Math.min(P[0],Q[0])-b)/g+nb-0.5)),x1=Math.min(nx-1,Math.floor((Math.max(P[0],Q[0])+b)/g+nb-0.5)),y0=Math.max(0,Math.ceil((Math.min(P[1],Q[1])-b)/g+nb-0.5)),y1=Math.min(ny-1,Math.floor((Math.max(P[1],Q[1])+b)/g+nb-0.5));
      for(ix=x0;ix<=x1;ix++){var px=(ix-nb+0.5)*g-P[0];for(iy=y0;iy<=y1;iy++){if(M[ix*ny+iy])continue;var py=(iy-nb+0.5)*g-P[1],t=l2?(px*vx+py*vy)/l2:0;if(t<0)t=0;else if(t>1)t=1;var dx=px-t*vx,dy=py-t*vy;if(dx*dx+dy*dy<=b2)M[ix*ny+iy]=1;}}}}
  return {M:M,nx:nx,ny:ny};}
function runsOf(M,nx,ny){var cs=new Int32Array(nx+1),buf=[],n=0;for(var x=0;x<nx;x++){cs[x]=buf.length>>1;var y=0,o=x*ny;while(y<ny){if(M[o+y]){var e=y;while(e+1<ny&&M[o+e+1])e++;buf.push(y,e);n+=e-y+1;y=e+1;}else y++;}}cs[nx]=buf.length>>1;return {cs:cs,runs:Int16Array.from(buf),n:n};}
function ringOf(M,nx,ny){var Rg=new Uint8Array(nx*ny);for(var x=0;x<nx;x++)for(var y=0;y<ny;y++){if(M[x*ny+y])continue;var hit=0;for(var dx=-1;dx<=1&&!hit;dx++){var xx=x+dx;if(xx<0||xx>=nx)continue;for(var dy=-1;dy<=1;dy++){var yy=y+dy;if(yy<0||yy>=ny)continue;if(M[xx*ny+yy]){hit=1;break;}}}if(hit)Rg[x*ny+y]=1;}return Rg;}

function Engine(opt){this.SL=opt.SL;this.SW=opt.SW;this.MG=opt.mg;this.SP=opt.sp;this.g=opt.g||2;var g=this.g;
  this.b=this.SP/2+g*0.7072;this.nb=Math.ceil(this.b/g)+1;this.LU=this.SL-2*this.MG;this.WU=this.SW-2*this.MG;
  this.kScan=opt.kScan==null?4:opt.kScan;this.kMode=opt.kMode||0;this.NX=Math.ceil(this.LU/g)+2*this.nb+1;this.NY=Math.ceil(this.WU/g)+2*this.nb+1;this.shapes=new Map();this.nShape=0;}
Engine.prototype.shape=function(part){var bb=bboxOf(part.out),E=this,g=this.g,o=part.out,k=o.length+':'+Math.round(Math.abs(areaOf(o)))+':'+Math.round(bb.w*10)+'x'+Math.round(bb.h*10)+':'+(part.holes||[]).length+':';
  for(var i=0;i<o.length&&i<12;i++)k+=Math.round((o[i][0]-bb.x0)*10)+','+Math.round((o[i][1]-bb.y0)*10)+';';
  var S=this.shapes.get(k);if(S)return S;
  var area=Math.abs(areaOf(o));(part.holes||[]).forEach(function(h){area-=Math.abs(areaOf(h));});
  S={id:this.nShape++,area:area,bw:bb.w,bh:bb.h,oris:[]};var seen=[];
  [[false,false],[true,false],[false,true],[true,true]].forEach(function(c){var rot=c[0],r2=c[1],w=rot?bb.h:bb.w,h=rot?bb.w:bb.h;if(w>E.LU+1e-6||h>E.WU+1e-6)return;
    var rings=[oriPts(o,bb,rot,r2)].concat((part.holes||[]).map(function(hh){return oriPts(hh,bb,rot,r2);})),R=raster(rings,w,h,g,E.b,E.nb),ru=runsOf(R.M,R.nx,R.ny);
    var sig=R.nx+'x'+R.ny+':'+ru.cs.join(',')+':'+ru.runs.join(',');if(seen.indexOf(sig)>=0)return;seen.push(sig);
    var rr=runsOf(ringOf(R.M,R.nx,R.ny),R.nx,R.ny),im=Math.floor((E.LU-w)/g+1e-9),jm=Math.floor((E.WU-h)/g+1e-9);
    var xs=0,ks=0,Ls=-1;for(var x=0;x<R.nx;x++)for(var q=ru.cs[x];q<ru.cs[x+1];q++){var L=ru.runs[2*q+1]-ru.runs[2*q]+1;if(L>Ls){Ls=L;xs=x;ks=q;}}
    var po=[],bitsN=1;while((1<<bitsN)<R.nx)bitsN++;for(var v=0;v<(1<<bitsN);v++){var rv=0;for(var bq=0;bq<bitsN;bq++)if(v>>bq&1)rv|=1<<(bitsN-1-bq);if(rv<R.nx&&ru.cs[rv]!==ru.cs[rv+1])po.push(rv);}
    S.oris.push({sid:S.id,oi:S.oris.length,rot:rot,r2:r2,w:w,h:h,nx:R.nx,ny:R.ny,n:ru.n,cs:ru.cs,runs:ru.runs,rcs:rr.cs,rruns:rr.runs,nr:rr.n,im:im,jm:jm,W:(jm>>5)+1,xs:xs,b0:ru.runs[2*ks],b1:ru.runs[2*ks+1],po:Int32Array.from(po)});});
  this.shapes.set(k,S);return S;};

function Sheet(E){this.E=E;var NX=E.NX,NY=E.NY,nb=E.nb,g=E.g;this.B=new Uint8Array(NX*NY);this.C=new Uint16Array(NX*(NY+1));this.items=[];this.fail=new Set();this.maps=new Map();this.free=NX*NY;this.area=0;this.cum=[0];this.fr=new Array(NX).fill(null);this.fc=0;
  var bx=nb+Math.ceil(E.LU/g)+nb-1,by=nb+Math.ceil(E.WU/g)+nb-1,x,y;
  for(x=0;x<NX;x++)for(y=0;y<NY;y++)if(x===0||y===0||x>=bx||y>=by)this.B[x*NY+y]=1;
  for(x=0;x<NX;x++)this.sum(x);for(x=0;x<NX*NY;x++)if(!this.B[x])this.fc++;}
Sheet.prototype.sum=function(x){var NY=this.E.NY,o=x*NY,c=x*(NY+1),s=0;this.C[c]=0;for(var y=0;y<NY;y++){s+=this.B[o+y];this.C[c+y+1]=s;}};
Sheet.prototype.freeRuns=function(c){var f=this.fr[c];if(f)return f;var NY=this.E.NY,o=c*NY,buf=[],y=0;while(y<NY){if(!this.B[o+y]){var e=y;while(e+1<NY&&!this.B[o+e+1])e++;buf.push(y,e);y=e+1;}else y++;}return this.fr[c]=Int16Array.from(buf);};
/* positions libres de o par balayage des plages libres (plaque déjà bien remplie) : cb(i,j) dans l'ordre i puis j ; cb renvoie true pour arrêter */
Sheet.prototype.scan=function(o,cb){var NY1=this.E.NY+1,C=this.C,im=o.im,jm=o.jm,xs=o.xs,b0=o.b0,b1=o.b1,L=b1-b0+1,po=o.po,np=po.length,cs=o.cs,runs=o.runs;
  for(var i=0;i<=im;i++){var fr=this.freeRuns(i+xs);
    for(var f=0;f<fr.length;f+=2){if(fr[f+1]-fr[f]+1<L)continue;var ja=fr[f]-b0,jb=fr[f+1]-b1;if(ja<0)ja=0;if(jb>jm)jb=jm;
      for(var j=ja;j<=jb;j++){var ok=true;
        for(var q=0;q<np&&ok;q++){var x=po[q],base=(i+x)*NY1+j;for(var k=cs[x];k<cs[x+1];k++)if(C[base+runs[2*k+1]+1]!==C[base+runs[2*k]]){ok=false;break;}}
        if(ok&&cb(i,j))return;}}}};
/* carte des positions interdites de l'orientation o sur cette plaque : complétée seulement avec les pièces posées depuis le dernier appel */
Sheet.prototype.map=function(o){var key=o.sid*4+o.oi,m=this.maps.get(key);if(!m){m={bits:new Uint32Array((o.im+1)*o.W),upto:0};this.maps.set(key,m);}
  var bits=m.bits,W=o.W,im=o.im,jm=o.jm,nx=o.nx,cs=o.cs,runs=o.runs;
  for(;m.upto<this.items.length;m.upto++){var it=this.items[m.upto],p=it.o,pi=it.i,pj=it.j,pcs=p.cs,pr=p.runs,pnx=p.nx;
    var ia=pi-nx+1,ib=pi+pnx-1;if(ia<0)ia=0;if(ib>im)ib=im;
    for(var i=ia;i<=ib;i++){var base=i*W,lj0=1,lj1=0,xa=pi-i,xb=xa+pnx-1;if(xa<0)xa=0;if(xb>nx-1)xb=nx-1;
      for(var x=xa;x<=xb;x++){var q=cs[x],qe=cs[x+1];if(q===qe)continue;var u=i+x-pi,a=pcs[u],ae=pcs[u+1];
        for(var k=a;k<ae;k++){var a0=pj+pr[2*k],a1=pj+pr[2*k+1];
          for(var l=q;l<qe;l++){var j0=a0-runs[2*l+1],j1=a1-runs[2*l];if(j0<0)j0=0;if(j1>jm)j1=jm;if(j0>j1||(j0>=lj0&&j1<=lj1))continue;lj0=j0;lj1=j1;
            var w0=j0>>5,w1=j1>>5,m0=-1<<(j0&31),m1=-1>>>(31-(j1&31));
            if(w0===w1)bits[base+w0]|=m0&m1;else{bits[base+w0]|=m0;for(var w=w0+1;w<w1;w++)bits[base+w]=-1;bits[base+w1]|=m1;}}}}}}
  return m;};
/* meilleure position de o : mode 0 = remplir dans la longueur, 1 = dans la largeur ; touch > 0 = score de contact */
Sheet.prototype.contact=function(o,i,j){var NY1=this.E.NY+1,C=this.C,rcs=o.rcs,rr=o.rruns,s=0;for(var x=0;x<o.nx;x++){var q0=rcs[x],q1=rcs[x+1];if(q0===q1)continue;var cb=(i+x)*NY1+j;for(var l=q0;l<q1;l++)s+=C[cb+rr[2*l+1]+1]-C[cb+rr[2*l]];}return s/o.nr;};
Sheet.prototype.find=function(o,mode,touch){var E=this.E,me=this;if(o.im<0||o.jm<0||o.n>this.free)return null;
  var mm=this.maps.get(o.sid*4+o.oi),pend=this.cum[this.items.length]-this.cum[mm?mm.upto:0];
  if(this.items.length&&(E.kMode?this.fc*E.kScan<pend:this.fc*E.kScan<pend*o.nx)){var bst=null,bsc=-1e9,g0=E.g;
    this.scan(o,function(i,j){if(!touch){if(mode===0){bst=[i,j,0];return true;}if(!bst||j<bst[1])bst=[i,j,0];return false;}
      var sc=me.contact(o,i,j)-touch*(mode===0?(i*g0+o.w)/E.LU:(j*g0+o.h)/E.WU);if(sc>bsc){bsc=sc;bst=[i,j,sc];}return false;});
    return bst;}
  var m=this.map(o),bits=m.bits,W=o.W,im=o.im,jm=o.jm,last=-1>>>(31-(jm&31)),i,w,j,f;
  if(!touch){if(mode===0){for(i=0;i<=im;i++)for(w=0;w<W;w++){f=~bits[i*W+w]&(w===W-1?last:-1);if(f){j=w*32+(31-Math.clz32(f&-f));return [i,j,0];}}return null;}
    var bj=-1,bi=-1;for(i=0;i<=im;i++)for(w=0;w<W;w++){f=~bits[i*W+w]&(w===W-1?last:-1);if(f){j=w*32+(31-Math.clz32(f&-f));if(bj<0||j<bj){bj=j;bi=i;}break;}}
    return bj<0?null:[bi,bj,0];}
  var NY1=E.NY+1,C=this.C,nx=o.nx,rcs=o.rcs,rr=o.rruns,nr=o.nr,g=E.g,best=null,bs=-1e9,any=false;
  var Fp=new Uint32Array(W),Fc=new Uint32Array(W),Fn=new Uint32Array(W),t;
  var load=function(dst,ii){if(ii<0||ii>im){dst.fill(0);return;}for(var q=0;q<W;q++)dst[q]=~bits[ii*W+q]&(q===W-1?last:-1);};
  load(Fc,0);load(Fn,1);Fp.fill(0);
  for(i=0;i<=im;i++){
    for(w=0;w<W;w++){var c=Fc[w];if(!c)continue;any=true;
      var up=(c<<1)|(w>0?Fc[w-1]>>>31:0),dn=(c>>>1)|(w<W-1?Fc[w+1]<<31:0);
      var p=Fp[w],pu=(p<<1)|(w>0?Fp[w-1]>>>31:0),pd=(p>>>1)|(w<W-1?Fp[w+1]<<31:0);
      var n=Fn[w],nu=(n<<1)|(w>0?Fn[w-1]>>>31:0),nd=(n>>>1)|(w<W-1?Fn[w+1]<<31:0);
      var cand=c&~(up&dn&p&pu&pd&n&nu&nd);
      while(cand){var bit=cand&-cand;cand^=bit;j=w*32+(31-Math.clz32(bit));
        var s=0;for(var x=0;x<nx;x++){var q0=rcs[x],q1=rcs[x+1];if(q0===q1)continue;var cb=(i+x)*NY1+j;for(var l=q0;l<q1;l++)s+=C[cb+rr[2*l+1]+1]-C[cb+rr[2*l]];}
        var sc=s/nr-touch*(mode===0?(i*g+o.w)/E.LU:(j*g+o.h)/E.WU);
        if(sc>bs){bs=sc;best=[i,j,sc];}}}
    t=Fp;Fp=Fc;Fc=Fn;Fn=t;load(Fn,i+2);}
  return any?best:null;};
Sheet.prototype.put=function(o,i,j,ref){var NY=this.E.NY,cs=o.cs,runs=o.runs;for(var x=0;x<o.nx;x++){var a=cs[x],e=cs[x+1];if(a===e)continue;var base=(i+x)*NY+j;for(var k=a;k<e;k++)for(var y=runs[2*k];y<=runs[2*k+1];y++)this.B[base+y]=1;this.sum(i+x);}
  this.free-=o.n;this.fc-=o.n;for(var c=i;c<i+o.nx;c++)this.fr[c]=null;this.cum.push(this.cum[this.cum.length-1]+o.nx);this.items.push({o:o,i:i,j:j,ref:ref});};

var ORD={area:function(s){return s.area;},bbox:function(s){return s.bw*s.bh;},maxdim:function(s){return Math.max(s.bw,s.bh)*1e3+s.area/1e3;},mix:function(s){return s.bw*s.bh*0.5+s.area*0.5;},
  len:function(s){var m=Math.max(s.bw,s.bh);return s.bw*s.bh+0.25*m*m;},len2:function(s){var m=Math.max(s.bw,s.bh);return s.bw*s.bh+0.6*m*m;}};
function runSeq(E,seq,mode,touch,nmax,dl,cnt){var sheets=[],unp=[],rem=new Map(cnt);
  for(var n=0;n<seq.length;n++){var it=seq[n],S=it.sh,done=false;if(dl&&Date.now()>dl)return null;
    for(var si=0;si<nmax&&!done;si++){if(si===sheets.length)sheets.push(new Sheet(E));var sh=sheets[si];if(sh.fail.has(S.id))continue;var best=null;
      for(var k=0;k<S.oris.length;k++){var ps=sh.find(S.oris[k],mode,touch);if(ps&&(!best||ps[2]>best.ps[2]))best={o:S.oris[k],ps:ps};}
      if(!best){sh.fail.add(S.id);continue;}
      sh.put(best.o,best.ps[0],best.ps[1],it.k);sh.area+=S.area;done=true;}
    if(!done)unp.push(it);
    var lf=rem.get(S.id)-1;rem.set(S.id,lf);if(!lf)for(var q=0;q<sheets.length;q++)for(var z=0;z<S.oris.length;z++)sheets[q].maps.delete(S.id*4+z);}
  while(sheets.length&&!sheets[sheets.length-1].items.length)sheets.pop();
  return {sheets:sheets,unp:unp};}

/* recherche : parts = [{out,holes}] ; opt = {SL,SW,mg,sp,g,nmax,budget (ms),seed,orders,maxTries} ; onStep(n,plaques,restantes)
   renvoie {ok, sheets:[[{k,x,y,rot,r2}]], left:[k…], tries, ms} — la meilleure passe (le moins de surface non posée) */
function search(parts,opt,onStep){var t0=Date.now(),E=new Engine(opt),g=E.g,items=[],cnt=new Map();
  for(var k=0;k<parts.length;k++){var S=E.shape(parts[k]);if(!S.oris.length)return {ok:false,big:k,sheets:[],left:[k],tries:0,ms:Date.now()-t0};items.push({k:k,sh:S,W:1});cnt.set(S.id,(cnt.get(S.id)||0)+1);}
  var rnd=rng32(opt.seed||1),orders=opt.orders||['len','bbox'],cfgs=[],best=null,n=0,dl=t0+(opt.budget||60000),maxT=opt.maxTries||1e9;
  orders.forEach(function(o){[0,1].forEach(function(m){[0.3,1.0].forEach(function(t){cfgs.push([o,m,t]);});});});
  while(n<maxT&&Date.now()<dl){var c=n<cfgs.length?cfgs[n]:cfgs[Math.floor(rnd()*cfgs.length)],jit=n<cfgs.length?0:[0.05,0.15,0.3][Math.floor(rnd()*3)];
    var key=new Map();items.forEach(function(it){key.set(it,-ORD[c[0]](it.sh)*it.W*(1+(jit?(rnd()*2-1)*jit:0)));});
    var seq=items.slice().sort(function(a,b){return key.get(a)-key.get(b);}),r=runSeq(E,seq,c[1],c[2],opt.nmax,dl,cnt);n++;if(!r)break;
    r.unp.forEach(function(u){u.W=Math.min(40,u.W*1.6);});items.forEach(function(it){it.W=1+(it.W-1)*0.9;});
    var sc=r.unp.reduce(function(s,u){return s+u.sh.area;},0);
    if(!best||sc<best.sc)best={sc:sc,r:r};
    if(onStep)onStep(n,r.sheets.length,r.unp.length);
    if(!r.unp.length)break;
    // abandon rapide : après les ordres de base, s'il reste encore beaucoup de pièces à poser, la plaque de moins n'est pas atteignable
    if(opt.giveUp&&n>=opt.giveUp.after&&best.r.unp.length>opt.giveUp.left)break;}
  if(!best)return {ok:false,sheets:[],left:[],tries:n,ms:Date.now()-t0};
  return {ok:!best.r.unp.length,sheets:best.r.sheets.map(function(sh){return sh.items.map(function(it){return {k:it.ref,x:E.MG+it.i*g,y:E.MG+it.j*g,rot:it.o.rot,r2:it.o.r2};});}),left:best.r.unp.map(function(u){return u.k;}),tries:n,ms:Date.now()-t0};}
G.N7={search:search,Engine:Engine,Sheet:Sheet,raster:raster,oriPts:oriPts};
if(typeof module!=='undefined'&&module.exports)module.exports=G.N7;
})(typeof self!=='undefined'?self:globalThis);
