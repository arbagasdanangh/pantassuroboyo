const fs = require('fs'), path = require('path');
const { getSession, appendLog } = require('../_users');
const localFile = path.join(process.cwd(), 'data', 'proyek.json');
const { writeJson, readJson } = require('../_store');
const put=(name,body)=>writeJson(name,JSON.parse(body));
const onVercel = !!process.env.VERCEL;
async function readLocal(){ const r=await readJson('proyek.json',null); if(Array.isArray(r)) return r; try{ const d=JSON.parse(fs.readFileSync(localFile,'utf8')); return Array.isArray(d)?d:[]; }catch(e){ return []; } }
async function readBlob(){
  const { get } = require('@vercel/blob');
  const result = await get('proyek.json',{access:'private'});
  if(!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text());
}
async function read(){
  if(onVercel || process.env.BLOB_READ_WRITE_TOKEN){
    try { const data=await readBlob(); if(Array.isArray(data)) return data; }
    catch(e){ console.error('Blob read failed:',e.message); }
  }
  return readLocal();
}
const num=(v,d=0)=>(Number.isFinite(+v)?+v:d);
const clean=(a,i)=>({
 id:num(a.id,i+1), nama:String(a.nama||'').slice(0,120), jenis:a.jenis==='Drainase'?'Drainase':'Rumah Pompa',
 kecamatan:String(a.kecamatan||'').slice(0,60),lat:num(a.lat),lng:num(a.lng),
 progres:Math.max(0,Math.min(100,num(a.progres))),rencana:Math.max(0,Math.min(100,num(a.rencana))),
 nilai:Math.max(0,num(a.nilai)),pelaksana:String(a.pelaksana||'-').slice(0,80),target:String(a.target||'').slice(0,10),catatan:String(a.catatan||'').slice(0,300),upd:/^\d{4}-\d{2}-\d{2}T/.test(String(a.upd||''))?String(a.upd).slice(0,24):'',foto:/^https:\/\//.test(String(a.foto||''))?String(a.foto).slice(0,500):'',
 riwayat:(Array.isArray(a.riwayat)?a.riwayat:[]).slice(-60).map(r=>({t:String(r&&r.t||'').slice(0,10),p:Math.max(0,Math.min(100,num(r&&r.p)))})).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.t))
});
const sig=p=>JSON.stringify([p.nama,p.jenis,p.kecamatan,p.lat,p.lng,p.progres,p.rencana,p.nilai,p.pelaksana,p.target,p.catatan,p.foto]);
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET') return res.json(await read());
 if(req.method==='PUT'){
  try{
  const ses=await getSession(req);
  if(!ses) return res.status(401).json({error:'Sesi berakhir, silakan login kembali.'});
  if(!Array.isArray(req.body)||req.body.length>1000) return res.status(400).json({error:'Data tidak valid.'});
  const cur=(await read()).map(clean);
  const curMap=new Map(cur.map(p=>[p.id,p]));
  let data=req.body.map(clean).filter(p=>p.nama),dropped=0;
  const scope=ses.r==='admin'?ses.wilayah:[];
  if(scope.length){   /* admin berwilayah: hanya boleh mengubah proyek di kecamatannya */
   const inS=p=>scope.includes(p.kecamatan);
   data.forEach(p=>{const c=curMap.get(p.id);if(c&&inS(c)&&!inS(p))p.kecamatan=c.kecamatan});   /* tidak boleh memindahkan ke luar wilayah */
   const mine=data.filter(inS);dropped=data.filter(p=>!inS(p)&&!(curMap.get(p.id)&&!inS(curMap.get(p.id)))).length;
   const keep=cur.filter(p=>!inS(p)),used=new Set(keep.map(p=>p.id));let mx=Math.max(0,...cur.map(p=>p.id),...mine.map(p=>p.id));
   mine.forEach(p=>{if(used.has(p.id))p.id=++mx;used.add(p.id)});
   data=[...keep,...mine].sort((a,b)=>a.id-b.id);
  }
  /* jejak perubahan + penanda "diperbarui" yang dihitung server */
  const now=new Date().toISOString(),detail=[];let tambah=0,ubah=0,hapus=0;
  data.forEach(p=>{const c=curMap.get(p.id);
   if(!c){tambah++;p.upd=now;detail.push('Tambah: '+p.nama)}
   else if(sig(c)!==sig(p)){ubah++;p.upd=now;detail.push(c.progres!==p.progres?`Ubah progres ${p.nama}: ${c.progres}% → ${p.progres}%`:'Ubah data: '+p.nama)}
   else p.upd=c.upd||''});
  const ids=new Set(data.map(p=>p.id));cur.forEach(c=>{if(!ids.has(c.id)){hapus++;detail.push('Hapus: '+c.nama)}});
   await put('proyek.json',JSON.stringify(data),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:0});
   if(tambah+ubah+hapus)await appendLog({u:ses.u,r:ses.r,aksi:'proyek',ringkas:[tambah&&`${tambah} ditambah`,ubah&&`${ubah} diubah`,hapus&&`${hapus} dihapus`].filter(Boolean).join(', '),detail:detail.slice(0,40),lebih:Math.max(0,detail.length-40)});
   return res.json({ok:true,count:data.length,dropped,tambah,ubah,hapus});
  }catch(e){
   console.error('Blob write failed:',e);
   return res.status(500).json({error:'Gagal menyimpan ke Vercel Blob.',detail:e?.message||String(e)});
  }
 }
 return res.status(405).end();
};
