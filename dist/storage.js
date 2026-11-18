import {validBackup} from './core.js';

export function dataURLToBlob(source){
  const match=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(source);
  if(!match)throw Error('圖片資料格式不正確');
  const binary=atob(match[2]),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:'image/'+match[1]});
}
export async function blobToDataURL(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
  for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return 'data:'+blob.type+';base64,'+btoa(binary);
}
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('儲存交易已取消'))});
const refs=data=>new Set(data.records.flatMap(r=>r.images||[]));

export class ImageStore{
  constructor(db){this.db=db;this.pending=new Map();this.pendingModes=new Map();this.data={version:2,events:[],records:[]};this.known=new Set();this.writing=false}
  static async open(name='omoi-log',factory=indexedDB){
    const db=await new Promise((resolve,reject)=>{
      const r=factory.open(name,2);
      r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('data'))db.createObjectStore('data');if(!db.objectStoreNames.contains('records'))db.createObjectStore('records',{keyPath:'id'});if(!db.objectStoreNames.contains('images')){const images=db.createObjectStore('images',{keyPath:'id'});images.createIndex('size','size')}};
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('請先關閉其他 OmoiLog 分頁，再重新載入以升級儲存格式。'));
    });
    db.onversionchange=()=>db.close();const store=new ImageStore(db);
    try{const tx=db.transaction(['data','records','images']);const done=complete(tx);const [meta,records,keys]=await Promise.all([request(tx.objectStore('data').get('main')),request(tx.objectStore('records').getAll()),request(tx.objectStore('images').getAllKeys())]);await done;store.known=new Set(keys);
      if(meta?.version===1){await store.save(meta);store.migrated=true}
      else if(meta){if(meta.version!==2)throw Error('無法讀取此版本的資料');const {recordOrder,...rest}=meta;const positions=new Map((recordOrder||[]).map((id,index)=>[id,index]));records.sort((a,b)=>(positions.get(a.id)??Infinity)-(positions.get(b.id)??Infinity));store.data={...rest,records};for(const ref of refs(store.data))if(!store.known.has(ref))throw Error('部分圖片資料遺失，請使用完整備份還原。')}
      return store;
    }catch(error){db.close();throw error}
  }
  stage(blob,{optimizedMode=null}={}){if(!(blob instanceof Blob)||!blob.type.startsWith('image/'))throw Error('無效的圖片檔案');const ref='img:'+crypto.randomUUID();this.pending.set(ref,blob);this.pendingModes.set(ref,optimizedMode);return ref}
  discardPending(){this.pending.clear();this.pendingModes.clear()}
  async details(ref){const tx=this.db.transaction('images');const row=await request(tx.objectStore('images').get(ref));if(!row?.blob)throw Error('找不到圖片');return row}
  async image(ref){if(this.pending.has(ref))return this.pending.get(ref);if(typeof ref==='string'&&ref.startsWith('data:'))return dataURLToBlob(ref);const tx=this.db.transaction('images');const row=await request(tx.objectStore('images').get(ref));if(!row?.blob)throw Error('找不到圖片');return row.blob}
  async save(input){
    if(this.writing)throw Error('另一筆資料正在儲存，請稍後再試');this.writing=true;
    const created=[];
    try{
      let next=input;
      if(input.version===1){if(!validBackup(input))throw Error('備份檔案格式不正確');next={...input,version:2,records:input.records.map(record=>({...record,images:record.images.map(source=>{const ref=this.stage(dataURLToBlob(source));created.push(ref);return ref})}))}}
      if(next.version!==2)throw Error('無法儲存此版本的資料');
      const used=refs(next),previous=refs(this.data);
      for(const ref of used)if(!this.pending.has(ref)&&!this.known.has(ref))throw Error('圖片尚未完整儲存，未變更資料');
      next={...next,revision:(this.data.revision||0)+1};
      const tx=this.db.transaction(['data','records','images'],'readwrite'),done=complete(tx);let conflict;
      const check=tx.objectStore('data').get('main');check.onsuccess=()=>{if((check.result?.revision||0)!==(this.data.revision||0)){conflict=Error('另一個分頁已更新資料。請重新載入後再儲存，原資料未被覆蓋。');tx.abort()}};
      const {records,...meta}=next;
      try{tx.objectStore('data').put({...meta,recordOrder:records.map(r=>r.id)},'main');
      const oldRecords=new Map(this.data.records.map(r=>[r.id,r]));
      for(const record of records){if(JSON.stringify(oldRecords.get(record.id))!==JSON.stringify(record))tx.objectStore('records').put(record);oldRecords.delete(record.id)}
      for(const key of oldRecords.keys())tx.objectStore('records').delete(key);
      for(const ref of used)if(this.pending.has(ref)){const blob=this.pending.get(ref);tx.objectStore('images').put({id:ref,blob,size:blob.size,type:blob.type,optimizedMode:this.pendingModes.get(ref)||null})}
      for(const ref of previous)if(!used.has(ref))tx.objectStore('images').delete(ref);
      }catch(error){tx.abort();await done.catch(()=>{});throw error}
      try{await done}catch(error){throw conflict||error}this.data=next;this.known=used;for(const ref of used){this.pending.delete(ref);this.pendingModes.delete(ref)}return next;
    }catch(error){for(const ref of created){this.pending.delete(ref);this.pendingModes.delete(ref)}throw error}finally{this.writing=false}
  }
  async replaceImage(ref,blob,{optimizedMode=null}={}){
    if(!this.known.has(ref))throw Error('圖片已移除');
    const tx=this.db.transaction('images','readwrite'),done=complete(tx),check=tx.objectStore('images').getKey(ref);check.onsuccess=()=>{if(check.result===undefined)tx.abort()};tx.objectStore('images').put({id:ref,blob,size:blob.size,type:blob.type,optimizedMode});await done;
  }
  async usage(){
    const tx=this.db.transaction('images'),done=complete(tx);let bytes=0,count=0;
    await new Promise((resolve,reject)=>{const r=tx.objectStore('images').index('size').openKeyCursor();r.onsuccess=()=>{const c=r.result;if(!c)return resolve();bytes+=c.key;count++;c.continue()};r.onerror=()=>reject(r.error)});await done;return {bytes,count};
  }
  async exportBackup(){
    const snapshot=this.data;const parts=[new Blob(['{"version":1,"events":',JSON.stringify(snapshot.events),',"records":['])];
    for(let i=0;i<snapshot.records.length;i++){
      const {images,...record}=snapshot.records[i];parts.push(new Blob([(i?',':'')+JSON.stringify(record).slice(0,-1)+',"images":[']));
      for(let j=0;j<images.length;j++)parts.push(new Blob([(j?',':'')+JSON.stringify(await blobToDataURL(await this.image(images[j])))]));
      parts.push(new Blob([']}']));
    }
    parts.push(new Blob([']}']));return new Blob(parts,{type:'application/json'});
  }
  close(){this.db.close()}
}
