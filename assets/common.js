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

/* jarak (km) antar koordinat */
const jarak=(a,b,c,d)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))};
const lalu=t=>{const d=Math.round((new Date(today())-new Date(t))/864e5);return d<=0?'hari ini':d==1?'kemarin':d<31?d+' hari lalu':tgl(t)};
/* pembaruan progres terbaru lintas proyek, dari riwayat */
const feed=D=>D.flatMap(p=>{const r=[...(p.riwayat||[])].sort((a,b)=>a.t<b.t?-1:1);return r.slice(1).map((q,i)=>({p,t:q.t,to:q.p,d:q.p-r[i].p}))}).sort((a,b)=>a.t<b.t?1:-1).slice(0,8);
const csvEsc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const unduh=(isi,nama,tipe)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([isi],{type:tipe}));a.download=nama;a.click()};
const csv=L=>'\ufeff'+[['Nama','Jenis','Kecamatan','Pelaksana','Progres %','Rencana %','Deviasi %','Status','Nilai (Juta Rp)','Target','Lat','Lng'],
 ...L.map(p=>[p.nama,p.jenis,p.kecamatan,p.pelaksana,p.progres,p.rencana,dev(p),LBL[st(p)],p.nilai,p.target,p.lat,p.lng])].map(r=>r.map(csvEsc).join(',')).join('\r\n');
/* teks laporan ringkas (untuk WhatsApp / email) */
const laporan=D=>{const a=avg(D,'progres'),r=avg(D,'rencana'),d=a-r,tg=[...D].filter(p=>p.progres<100).sort((x,y)=>dev(x)-dev(y)).filter(p=>dev(p)<0).slice(0,5),jt=D.filter(p=>{const x=sisa(p);return x!=null&&x<=30}).sort((x,y)=>sisa(x)-sisa(y));
 return `*LAPORAN PROGRES PROYEK RUMAH POMPA & DRAINASE – KOTA SURABAYA*\nPer ${tgl(today())}\n\nTotal ${D.length} proyek · progres rata-rata ${a}% (rencana ${r}%, deviasi ${d>0?'+':''}${d}%)\nBerjalan ${cnt(D,'berjalan')} · Perlu perhatian ${cnt(D,'perhatian')} · Terlambat ${cnt(D,'terlambat')} · Selesai ${cnt(D,'selesai')}\n`+
 (tg.length?`\n*Perlu ditindaklanjuti:*\n`+tg.map((p,i)=>`${i+1}. ${p.nama} (Kec. ${p.kecamatan}) – ${p.progres}% dari rencana ${p.rencana}% (${dev(p)}%)`).join('\n')+'\n':'\nSemua proyek sesuai rencana.\n')+
 (jt.length?`\n*Jatuh tempo ≤ 30 hari:*\n`+jt.map(p=>`• ${p.nama} – ${sisaTxt(p)} (${p.progres}%)`).join('\n')+'\n':'')};

/* tren progres rata-rata seluruh proyek berdasarkan riwayat */
const tren=D=>{const ds=[...new Set(D.flatMap(p=>(p.riwayat||[]).map(r=>r.t)))].sort();
 if(ds.length<2)return '<div class="small text-muted">Grafik tren muncul setelah progres diperbarui pada minimal dua tanggal berbeda.</div>';
 const v=ds.map(d=>{const a=D.map(p=>{const r=(p.riwayat||[]).filter(x=>x.t<=d).sort((x,y)=>x.t<y.t?-1:1);return r.length?r[r.length-1].p:null}).filter(x=>x!=null);return a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length):0});
 const W=600,H=150,L=28,R=W-10,T=10,B=H-20,t0=+new Date(ds[0]),t1=+new Date(ds[ds.length-1]),X=t=>L+(+new Date(t)-t0)/(t1-t0)*(R-L),Y=q=>B-q/100*(B-T),pts=ds.map((d,i)=>X(d).toFixed(1)+','+Y(v[i]).toFixed(1));
 return `<svg viewBox="0 0 ${W} ${H}" class="spark" role="img" aria-label="Tren progres rata-rata, terakhir ${v[v.length-1]} persen">${[0,50,100].map(g=>`<line class="sp-plan" x1="${L}" x2="${R}" y1="${Y(g)}" y2="${Y(g)}" style="opacity:.35"/><text class="sp-t" x="${L-4}" y="${Y(g)+3}" text-anchor="end">${g}%</text>`).join('')}
 <polygon class="sp-area" points="${X(ds[0])},${B} ${pts.join(' ')} ${X(ds[ds.length-1])},${B}"/><polyline class="sp-line" points="${pts.join(' ')}"/>
 ${ds.map((d,i)=>`<circle class="sp-dot" cx="${X(d).toFixed(1)}" cy="${Y(v[i]).toFixed(1)}" r="3"><title>${tgl(d)}: ${v[i]}%</title></circle>`).join('')}
 <text class="sp-t" x="${L}" y="${H-4}">${tgl(ds[0])}</text><text class="sp-t" x="${R}" y="${H-4}" text-anchor="end">${tgl(ds[ds.length-1])}</text></svg>`};
