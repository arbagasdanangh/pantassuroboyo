const fs = require('fs'), path = require('path');
const { isAuthed } = require('../_auth');
const { get, put } = require('@vercel/blob');
const localFile = path.join(process.cwd(), 'data', 'proyek.json');
const onVercel = !!process.env.VERCEL;
async function readLocal(){ try{ const d=JSON.parse(fs.readFileSync(localFile,'utf8')); return Array.isArray(d)?d:[]; }catch(e){ return []; } }
async function readBlob(){
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
 nilai:Math.max(0,num(a.nilai)),pelaksana:String(a.pelaksana||'-').slice(0,80),target:String(a.target||'').slice(0,10),catatan:String(a.catatan||'').slice(0,300),
 riwayat:(Array.isArray(a.riwayat)?a.riwayat:[]).slice(-60).map(r=>({t:String(r&&r.t||'').slice(0,10),p:Math.max(0,Math.min(100,num(r&&r.p)))})).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.t))
});
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET') return res.json(await read());
 if(req.method==='PUT'){
  if(!isAuthed(req)) return res.status(401).json({error:'Sesi berakhir, silakan login kembali.'});
  if(!Array.isArray(req.body)||req.body.length>1000) return res.status(400).json({error:'Data tidak valid.'});
  const data=req.body.map(clean).filter(p=>p.nama);
  try{
   await put('proyek.json',JSON.stringify(data),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:0});
   return res.json({ok:true,count:data.length});
  }catch(e){
   console.error('Blob write failed:',e);
   return res.status(500).json({error:'Gagal menyimpan ke Vercel Blob.',detail:e?.message||String(e)});
  }
 }
 return res.status(405).end();
};
