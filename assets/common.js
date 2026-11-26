const LBL={berjalan:'Berjalan',perhatian:'Perlu Perhatian',terlambat:'Terlambat',selesai:'Selesai'};
const COL={berjalan:'#16a34a',perhatian:'#eab308',terlambat:'#dc2626',selesai:'#2563eb'};
const st=p=>p.progres>=100?'selesai':(p.progres-p.rencana<=-5?'terlambat':(p.progres-p.rencana<0?'perhatian':'berjalan'));
const rp=j=>'Rp '+(j>=1000?(j/1000).toFixed(2).replace('.',',')+' M':Math.round(j)+' Jt');
const tgl=t=>t?new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'-';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pill=p=>`<span class="pill st-${st(p)}">${LBL[st(p)]}</span>`;
const dev=p=>p.progres-p.rencana;
const cnt=(D,k)=>D.filter(p=>st(p)==k).length;
const avg=(D,k)=>D.length?Math.round(D.reduce((a,p)=>a+ +p[k],0)/D.length):0;
const today=()=>new Date().toISOString().slice(0,10);
/* sisa hari menuju target (negatif = lewat); null bila selesai / tanpa target */
const sisa=p=>(!p.target||p.progres>=100)?null:Math.ceil((new Date(p.target)-new Date(today()))/864e5);
const sisaTxt=p=>{const d=sisa(p);return d==null?'':d<0?`Lewat ${-d} hari`:d==0?'Jatuh tempo hari ini':`${d} hari lagi`};
/* catat progres hari ini ke riwayat (satu entri per tanggal) */
const catat=(r,prog)=>[...(r||[]).filter(x=>x.t!==today()),{t:today(),p:prog}].sort((a,b)=>a.t<b.t?-1:1).slice(-60);
/* grafik riwayat progres (SVG) */
const spark=p=>{const r=[...(p.riwayat||[])].sort((a,b)=>a.t<b.t?-1:1);
 if(r.length<2)return '<div class="small text-muted">Grafik riwayat muncul setelah progres diperbarui minimal dua kali.</div>';
 const W=300,H=96,L=8,R=W-8,T=10,B=H-18,t0=+new Date(r[0].t),t1=+new Date(r[r.length-1].t);
 const X=t=>L+(t1===t0?0:(+new Date(t)-t0)/(t1-t0))*(R-L),Y=v=>B-v/100*(B-T);
 const pts=r.map(q=>X(q.t).toFixed(1)+','+Y(q.p).toFixed(1)),last=r[r.length-1];
 return `<svg viewBox="0 0 ${W} ${H}" class="spark" role="img" aria-label="Riwayat progres, terakhir ${last.p} persen">
 <line class="sp-plan" x1="${L}" x2="${R}" y1="${Y(p.rencana)}" y2="${Y(p.rencana)}"/>
 <text class="sp-t" x="${R}" y="${Y(p.rencana)-3}" text-anchor="end">rencana ${p.rencana}%</text>
 <polygon class="sp-area" points="${X(r[0].t)},${B} ${pts.join(' ')} ${X(last.t)},${B}"/>
 <polyline class="sp-line" points="${pts.join(' ')}"/>
 ${r.map(q=>`<circle class="sp-dot" cx="${X(q.t).toFixed(1)}" cy="${Y(q.p).toFixed(1)}" r="3"><title>${tgl(q.t)}: ${q.p}%</title></circle>`).join('')}
 <text class="sp-t" x="${L}" y="${H-3}">${tgl(r[0].t)}</text><text class="sp-t" x="${R}" y="${H-3}" text-anchor="end">${tgl(last.t)}</text></svg>`};
/* tema terang/gelap */
const setTema=t=>{document.documentElement.setAttribute('data-bs-theme',t);try{localStorage.setItem('tema',t)}catch(e){}
 document.querySelectorAll('[data-tema] i').forEach(i=>i.className='bi bi-'+(t=='dark'?'sun-fill':'moon-stars-fill'))};
const initTema=cb=>document.querySelectorAll('[data-tema]').forEach(b=>{setTema(document.documentElement.getAttribute('data-bs-theme')||'light');
 b.onclick=()=>{setTema(document.documentElement.getAttribute('data-bs-theme')=='dark'?'light':'dark');cb&&cb()}});
async function getData(){try{const r=await fetch('/api/proyek',{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}
 try{return await (await fetch('/data/proyek.json')).json()}catch(e){return[]}}
