import {fields,types,statuses,normalize} from './core.js';
import {parseDriveLinks,mergeDriveImages} from './drive.js';
export const importLabels={...fields,status:'狀態（只套用新紀錄）',email:'email',submittedAt:'表單提交時間',registrationId:'固定登記編號',requestedGiveaway:'希望領取的無料',formMessage:'表單留言',sourceConsent:'表單注意事項',driveImages:'Drive 圖片連結'};
const protectedFields=new Set(['give','time','place','notes','status','sourceConsent']);
const equal=(a,b)=>JSON.stringify(a??'')===JSON.stringify(b??'');
const email=v=>String(v||'').trim().toLowerCase();
const account=v=>normalize(v);
const identity=(a,b)=>Boolean(a.email&&b.email&&email(a.email)===email(b.email)||a.account&&b.account&&account(a.account)===account(b.account)&&normalize(a.platform)===normalize(b.platform));
export function changesForTarget(item,record,source){
  const previous=record.imports?.find(i=>i.sourceId===source.id&&i.key===item.key),changes=[];
  for(const [key,incoming]of Object.entries(item.values)){const before=record[key],prior=previous?.snapshot?.[key];if(previous&&equal(incoming,prior)||equal(before,incoming))continue;const blank=incoming===''||Array.isArray(incoming)&&!incoming.length,locked=protectedFields.has(key);changes.push({key,before,incoming,prior,locked,choice:key==='tags'||key==='driveImages'?'merge':!blank&&(before===undefined||before===''||previous&&equal(before,prior))?'incoming':'keep',conflict:!locked&&(blank||!previous||!equal(before,prior))})}return changes;
}
export function submissionTime(value,offset='+08:00'){
  const text=String(value||'').trim();if(!text)return '';
  if(/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(text)){const date=new Date(text);return Number.isNaN(+date)?null:date.toISOString()}
  const match=/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(?:(上午|下午|AM|PM)\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/i.exec(text);
  if(!match||!/^([+-](?:0\d|1[0-4]):[0-5]\d)$/.test(offset))return null;
  let [,y,m,d,ampm,h,min,sec='00']=match;h=Number(h);if(ampm){if(h<1||h>12)return null;h=h%12+(/下午|PM/i.test(ampm)?12:0)}if(h>23||+min>59||+sec>59)return null;
  const date=new Date(Date.UTC(+y,+m-1,+d));if(date.getUTCFullYear()!==+y||date.getUTCMonth()!==+m-1||date.getUTCDate()!==+d)return null;
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${String(h).padStart(2,'0')}:${min}:${sec}${offset}`).toISOString();
}
export function guessMapping(headers,saved={}){
  const aliases={name:['對方暱稱','暱稱','姓名'],account:['Threads帳號','社群帳號','帳號'],platform:['社群平台'],type:['方式','交換類型'],give:['實際交付的無料','我要給的物品'],receive:['對方的無料項目','對方提供的無料','我要領的物品'],email:['email','電子郵件地址','電子郵件'],submittedAt:['時間戳記','表單提交時間'],registrationId:['固定登記編號','登記編號'],requestedGiveaway:['交換選項','希望領取的無料'],formMessage:['表單留言'],sourceConsent:['注意事項'],driveImages:['對方的無料圖','Drive 圖片連結','圖片連結'],notes:['備註'],quantity:['數量'],time:['約定時間'],place:['約定地點'],tags:['標籤'],link:['個人頁連結'],status:['狀態']};
  const mapping={};for(const key of Object.keys(importLabels)){if(Object.hasOwn(saved,key)&&saved[key]===null)continue;const candidates=Object.hasOwn(saved,key)?[saved[key]]:aliases[key]||[];const index=headers.findIndex(h=>candidates.some(v=>v.toLowerCase()===h.trim().toLowerCase()));if(index>=0&&headers.filter(h=>h===headers[index]).length===1)mapping[key]=index}
  if(mapping.formMessage===undefined&&saved.formMessage!==null){const index=headers.findIndex(h=>h.includes('有什麼話想跟我說'));if(index>=0)mapping.formMessage=index}return mapping;
}
export function parseImportRows(csvRows,mapping,source){
  const headers=csvRows[0];if(mapping.name===undefined)throw Error('請先對應暱稱欄位');
  return csvRows.slice(1).map((cells,index)=>{
    const values={},errors=[],warnings=[];for(const [key,column]of Object.entries(mapping))values[key]=String(cells[column]??'').trim();
    if(cells.length!==headers.length)errors.push('欄位數量與標題不符');
    if(!values.name)errors.push('缺少暱稱');
    if(values.account!==undefined)values.account=values.account.replace(/^[@＠\s]+/u,'');
    if(values.email)values.email=email(values.email);
    if(mapping.platform===undefined)values.platform=source.platform||'Threads';
    if(mapping.type===undefined)values.type=source.defaultType||'對方來領取';
    else values.type=({'交換':'互相交換','領取':'對方來領取'})[values.type]||values.type;
    if(!types.includes(values.type))errors.push('無法辨識交換／領取類型');
    const rawTime=values.submittedAt;
    if(values.submittedAt){const parsed=submissionTime(values.submittedAt,source.offset);if(!parsed)errors.push('提交時間格式無法辨識，請確認來源時區');else values.submittedAt=parsed}
    if(values.quantity){if(!/^\d+$/.test(values.quantity)||+values.quantity<1||+values.quantity>9999)errors.push('數量須為 1–9999');else values.quantity=Number(values.quantity)}
    if(values.status&&!statuses.includes(values.status))errors.push('無法辨識狀態');
    if(values.tags!==undefined)values.tags=[...new Set(values.tags.split(/[\s,，]+/).map(v=>v.replace(/^[#＃]+/, '')).filter(Boolean))].join(' ');
    if(values.driveImages!==undefined){const parsed=parseDriveLinks(values.driveImages);values.driveImages=parsed.images;if(parsed.invalid.length)warnings.push(`${parsed.invalid.length} 個圖片連結無法辨識，將不匯入`)}
    const key=values.registrationId?'id:'+values.registrationId:values.submittedAt?'time:'+values.submittedAt:'';
    return {id:crypto.randomUUID(),line:index+2,values,key,rawTime,errors,warnings};
  });
}
export function planImport(data,rows,source){
  const records=data.records.filter(r=>r.eventId===source.eventId),seen=new Set(),seenIdentities=[];
  return rows.map(row=>{
    const item={...row,candidates:[],changes:[],category:'new',reason:'沒有相符紀錄',action:'new'};
    if(row.errors.length)return {...item,category:'invalid',action:'skip',reason:row.errors.join('；')};
    if(row.key&&seen.has(row.key))return {...item,category:'duplicate',action:'skip',reason:'此檔案重複的提交時間／登記編號，略過後續列'};
    if(row.key)seen.add(row.key);
    const exact=row.key?records.filter(r=>r.imports?.some(i=>i.sourceId===source.id&&i.key===row.key)):[];
    const candidates=exact.length?exact:records.filter(r=>identity(r,row.values));
    if(!candidates.length){const names=records.filter(r=>normalize(r.name)===normalize(row.values.name));if(names.length)item.candidates=names;const repeated=seenIdentities.some(v=>identity(v,row.values));seenIdentities.push(row.values);if(names.length||repeated||row.warnings.length)return {...item,category:'review',action:'',reason:repeated?'同一檔案有相同帳號／email，請確認是否另一次登記':names.length?'僅暱稱相同，請人工確認':'圖片連結有警告，請確認後新增'};return item}
    seenIdentities.push(row.values);item.candidates=candidates;
    if(candidates.length!==1)return {...item,category:'review',action:'',reason:'身分資訊對應多筆紀錄，請選擇目標'};
    const existing=candidates[0],previous=existing.imports?.find(i=>i.sourceId===source.id&&i.key===row.key);item.targetId=existing.id;
    const importedKeys=Object.keys(row.values);
    for(const key of importedKeys){const before=existing[key],incoming=row.values[key],prior=previous?.snapshot?.[key];const changedUpstream=!previous||!equal(incoming,prior);if(!changedUpstream||equal(before,incoming))continue;
      const blank=incoming===''||Array.isArray(incoming)&&!incoming.length;
      const locked=protectedFields.has(key);let choice=key==='tags'||key==='driveImages'?'merge':!blank&&(before===undefined||before===''||previous&&equal(before,prior))?'incoming':'keep';
      item.changes.push({key,before,incoming,prior,locked,choice,conflict:!locked&&(blank||!previous||!equal(before,prior))});
    }
    if(previous&&!item.changes.length&&equal(previous.snapshot,row.values)&&!row.warnings.length)return {...item,category:'unchanged',action:'skip',reason:'表單內容完全相同'};
    if(!previous||!identity(existing,row.values)||item.changes.some(c=>c.conflict)||row.warnings.length)return {...item,category:'review',action:'',reason:previous?'身分、空白內容或手動修改有差異，請確認':'既有紀錄尚未連結此回覆，請確認連結'};
    return {...item,category:'update',action:'merge',reason:'表單內容有更新，將保留現場整理資訊'};
  });
}
export function applyImport(data,plan,decisions,source,now=new Date().toISOString()){
  const next=structuredClone(data),counts={added:0,updated:0,skipped:0},targets=new Set();
  for(const item of plan){const decision=decisions[item.id]||{},action=Object.hasOwn(decision,'action')?decision.action:item.action;
    if(action==='skip'||item.category==='invalid'||item.category==='duplicate'){counts.skipped++;continue}
    if(!['new','merge'].includes(action))throw Error(`第 ${item.line} 列尚未選擇處理方式`);
    let record;
    if(action==='new'){record={...item.values,id:item.id,eventId:source.eventId,status:item.values.status||'待確認',quantity:item.values.quantity||1,images:[],driveImages:item.values.driveImages||[]};next.records.push(record);counts.added++}
    else{
      const targetId=Object.hasOwn(decision,'targetId')?decision.targetId:item.targetId;if(!item.candidates.some(r=>r.id===targetId))throw Error(`第 ${item.line} 列請選擇有效的目標紀錄`);
      if(targets.has(targetId))throw Error('多筆回覆將更新同一紀錄，請只保留一筆更新，其餘略過或另建');targets.add(targetId);
      record=next.records.find(r=>r.id===targetId&&r.eventId===source.eventId);if(!record)throw Error('目標紀錄已變更，請重新預覽');
      const previous=record.imports?.find(i=>i.sourceId===source.id&&i.key===item.key);
      const changes=changesForTarget(item,record,source);
      for(const change of changes){if(change.locked)continue;const choice=decision.fields?.[change.key]||change.choice;if(choice==='incoming')record[change.key]=change.incoming;else if(choice==='merge'&&change.key==='driveImages')record.driveImages=mergeDriveImages(record.driveImages,change.incoming);else if(choice==='merge'&&change.key==='tags')record.tags=[...new Set((String(record.tags||'')+' '+String(change.incoming||'')).split(/\s+/).filter(Boolean))].join(' ')}
      counts.updated++;
    }
    record.updatedAt=now;record.imports=record.imports||[];
    const entry={sourceId:source.id,key:item.key||'manual:'+item.id,snapshot:structuredClone(item.values),submittedAtRaw:item.rawTime||'',importedAt:now};
    const position=record.imports.findIndex(i=>i.sourceId===source.id&&i.key===entry.key);if(position>=0)record.imports[position]=entry;else record.imports.push(entry);
  }
  next.importSources=(next.importSources||[]).filter(s=>s.id!==source.id);next.importSources.push({...source,lastImportedAt:now});
  next.importBatches=[...(next.importBatches||[]),{id:crypto.randomUUID(),sourceId:source.id,eventId:source.eventId,date:now,...counts}].slice(-100);
  return {data:next,counts};
}
