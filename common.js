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
async function getData(){try{const r=await fetch('/api/proyek',{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}
 return await (await fetch('/data/proyek.json')).json()}
