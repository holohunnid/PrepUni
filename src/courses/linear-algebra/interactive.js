// ---------- helpers ----------
const NS='http://www.w3.org/2000/svg';
function cv(n){return getComputedStyle(document.body).getPropertyValue(n).trim();}
function rgba(hex,a){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');const n=parseInt(hex,16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent.appendChild(e);return e;}
function axes(svg,scale){const c=160;svg.innerHTML='';
  for(let i=-3;i<=3;i++){el('line',{x1:c+i*scale,y1:0,x2:c+i*scale,y2:320,stroke:cv('--border')},svg);el('line',{x1:0,y1:c+i*scale,x2:320,y2:c+i*scale,stroke:cv('--border')},svg);}
  el('line',{x1:0,y1:c,x2:320,y2:c,stroke:cv('--border2')},svg);el('line',{x1:c,y1:0,x2:c,y2:320,stroke:cv('--border2')},svg);
  return (x,y)=>[c+x*scale,c-y*scale];}
function fmt(x){return (Math.round(x*100)/100).toFixed(2);}
function bindSliders(ids,fn){ids.forEach(id=>{const s=document.getElementById(id);s.addEventListener('input',()=>{document.getElementById(id+'_v').textContent=parseFloat(s.value).toFixed(1);fn();});});}
function setSliders(ids,vals){ids.forEach((id,i)=>{document.getElementById(id).value=vals[i];document.getElementById(id+'_v').textContent=vals[i].toFixed(1);});}

// ---------- determinant ----------
const dIds=['d_a','d_b','d_c','d_d'];
function detDraw(){const [a,b,c,d]=dIds.map(i=>parseFloat(document.getElementById(i).value));
  const svg=document.getElementById('detsvg');const P=axes(svg,40);const det=a*d-b*c;
  const u=P(1,0),v=P(0,1),uv=P(1,1),o=P(0,0);
  el('polygon',{points:`${o} ${u} ${uv} ${v}`,fill:cv('--panel2'),stroke:cv('--dim'),'stroke-dasharray':'3 3'},svg);
  const A1=P(a,c),A2=P(b,d),A12=P(a+b,c+d);
  el('polygon',{points:`${o} ${A1} ${A12} ${A2}`,fill:det>=0?rgba(cv('--green'),.25):rgba(cv('--red'),.28),stroke:det>=0?cv('--green'):cv('--red')},svg);
  el('line',{x1:o[0],y1:o[1],x2:A1[0],y2:A1[1],stroke:cv('--blue'),'stroke-width':2.5},svg);
  el('line',{x1:o[0],y1:o[1],x2:A2[0],y2:A2[1],stroke:cv('--green'),'stroke-width':2.5},svg);
  const t1=el('text',{x:A1[0]+4,y:A1[1]-4,fill:cv('--blue'),'font-size':11},svg);t1.textContent='(a,c)';
  const t2=el('text',{x:A2[0]+4,y:A2[1]-4,fill:cv('--green'),'font-size':11},svg);t2.textContent='(b,d)';
  document.getElementById('detread').innerHTML=`<span>det = ad − bc = ${fmt(a*d)} − ${fmt(b*c)} = <b>${fmt(det)}</b></span><span>area = <b>${fmt(Math.abs(det))}</b></span><span>${Math.abs(det)<1e-9?'<span class="r">singular</span>':'invertible'}</span><span>orientation: ${det<0?'<span class="r">flipped</span>':'preserved'}</span>`;}
function detSet(a,b,c,d){setSliders(dIds,[a,b,c,d]);detDraw();}
bindSliders(dIds,detDraw);detDraw();

// ---------- eigen ----------
const eIds=['e_a','e_b','e_c','e_d'];
function eigDraw(){const [a,b,c,d]=eIds.map(i=>parseFloat(document.getElementById(i).value));
  const svg=document.getElementById('eigsvg');const P=axes(svg,40);const o=P(0,0);
  const tr=a+d,det=a*d-b*c,disc=tr*tr-4*det;
  let read=`<span>tr = <b>${fmt(tr)}</b></span><span>det = <b>${fmt(det)}</b></span><span>λ² − ${fmt(tr)}λ + ${fmt(det)} = 0</span>`;
  if(disc>=-1e-9){const s=Math.sqrt(Math.max(disc,0));const l1=(tr+s)/2,l2=(tr-s)/2;
    read+=`<span>λ₁ = <b>${fmt(l1)}</b>, λ₂ = <b>${fmt(l2)}</b></span>`;
    [l1,l2].forEach((l,k)=>{let vx,vy;
      if(Math.abs(b)>1e-9){vx=b;vy=l-a;}else if(Math.abs(c)>1e-9){vx=l-d;vy=c;}else{vx=k===0?1:0;vy=k===0?0:1; if(Math.abs(a-d)<1e-9){vx=k===0?1:0;vy=k===0?0:1;}}
      const n=Math.hypot(vx,vy)||1;vx/=n;vy/=n;const p1=P(vx*4,vy*4),p2=P(-vx*4,-vy*4);
      el('line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:cv('--green'),'stroke-width':1.5,'stroke-dasharray':k?'5 4':''},svg);
      const t=el('text',{x:P(vx*3.2,vy*3.2)[0]+4,y:P(vx*3.2,vy*3.2)[1]-4,fill:cv('--green'),'font-size':11},svg);t.textContent='λ='+fmt(l);
      read+=`<span>v${k+1} ∝ (${fmt(vx)}, ${fmt(vy)})</span>`;});
  } else {read+=`<span class="r">complex eigenvalues: ${fmt(tr/2)} ± ${fmt(Math.sqrt(-disc)/2)}i (no real eigenvectors)</span>`;}
  for(let k=0;k<16;k++){const th=k*Math.PI/8;const x=Math.cos(th),y=Math.sin(th);const X=a*x+b*y,Y=c*x+d*y;
    const p=P(x,y),q=P(X,Y);
    el('line',{x1:o[0],y1:o[1],x2:p[0],y2:p[1],stroke:cv('--dim'),'stroke-width':1},svg);
    const cross=Math.abs(x*Y-y*X);const col=cross<0.08?cv('--amber'):cv('--blue');
    el('line',{x1:o[0],y1:o[1],x2:q[0],y2:q[1],stroke:col,'stroke-width':1.4,opacity:.9},svg);
    el('circle',{cx:q[0],cy:q[1],r:2.2,fill:col},svg);}
  document.getElementById('eigread').innerHTML=read;}
function eigSet(a,b,c,d){setSliders(eIds,[a,b,c,d]);eigDraw();}
bindSliders(eIds,eigDraw);eigDraw();

// ---------- quadratic form ----------
const qIds=['q_a','q_b','q_c'];
function qDraw(){const [a,b,c]=qIds.map(i=>parseFloat(document.getElementById(i).value));
  const svg=document.getElementById('qsvg');svg.innerHTML='';const N=24,cell=320/N;
  let vals=[],mx=0;for(let i=0;i<N;i++){for(let j=0;j<N;j++){const x=-2+(i+.5)*4/N,y=2-(j+.5)*4/N;const v=a*x*x+2*b*x*y+c*y*y;vals.push(v);mx=Math.max(mx,Math.abs(v));}}
  let k=0;for(let i=0;i<N;i++){for(let j=0;j<N;j++){const v=vals[k++];const t=mx?Math.abs(v)/mx:0;const col=v>=0?rgba(cv('--green'),0.08+0.85*t):rgba(cv('--red'),0.08+0.85*t);el('rect',{x:i*cell,y:j*cell,width:cell+.5,height:cell+.5,fill:col},svg);}}
  el('line',{x1:0,y1:160,x2:320,y2:160,stroke:cv('--border2')},svg);el('line',{x1:160,y1:0,x2:160,y2:320,stroke:cv('--border2')},svg);
  const tr=a+c,det=a*c-b*b,s=Math.sqrt(Math.max(tr*tr-4*det,0));const l1=(tr+s)/2,l2=(tr-s)/2;
  [l1,l2].forEach(l=>{let vx,vy;if(Math.abs(b)>1e-9){vx=b;vy=l-a;}else{vx=Math.abs(l-a)<1e-9?1:0;vy=vx?0:1;}const n=Math.hypot(vx,vy)||1;vx/=n;vy/=n;
    el('line',{x1:160-vx*300,y1:160+vy*300,x2:160+vx*300,y2:160-vy*300,stroke:cv('--text'),'stroke-width':1,opacity:.7},svg);});
  let cls;const eps=1e-9;
  if(l1>eps&&l2>eps)cls='<span class="g">positive definite</span>';else if(l1<-eps&&l2<-eps)cls='<span class="r">negative definite</span>';else if(l1>eps&&l2<-eps)cls='<span class="a">indefinite</span>';else if(l2>-eps&&l1>eps)cls='positive semidefinite';else if(l1<eps&&l2<-eps)cls='negative semidefinite';else cls='zero form';
  document.getElementById('qread').innerHTML=`<span>λ₁ = <b>${fmt(l1)}</b>, λ₂ = <b>${fmt(l2)}</b></span><span>D₁ = a = <b>${fmt(a)}</b></span><span>D₂ = ac − b² = <b>${fmt(det)}</b></span><span>${cls}</span>`;}
function qSet(a,b,c){setSliders(qIds,[a,b,c]);qDraw();}
bindSliders(qIds,qDraw);qDraw();

// preset buttons in the module HTML call these via inline onclick
window.detSet = detSet;
window.eigSet = eigSet;
window.qSet = qSet;
// redraw with the new palette when the theme changes (dispatched by course.js)
window.addEventListener('themechange', () => { detDraw(); eigDraw(); qDraw(); });
