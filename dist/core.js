export const types=['互相交換','對方來領取','我要去領取'];
export const statuses=['待確認','已約定','已完成','已取消'];
export function concertCountdown(date,now=new Date()){
if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(now.getTime()))return null;
const [year,month,day]=date.split('-').map(Number),target=new Date(date+'T00:00:00Z');
if(Number.isNaN(target.getTime())||target.getUTCFullYear()!==year||target.getUTCMonth()!==month-1||target.getUTCDate()!==day)return null;
const today=new Date(0);today.setUTCFullYear(now.getFullYear(),now.getMonth(),now.getDate());today.setUTCHours(0,0,0,0);
const days=Math.round((target.getTime()-today.getTime())/86400000);
return days<0?null:{days,text:days===0?'就是今天!':`距離演唱會剩 ${days} 天`};
}
export function recordStatusGroup(record){return record.status==='已取消'?2:record.status==='已完成'?1:0}
export function statusBeforeCompletion(record){return statuses.includes(record.statusBeforeCompletion)&&record.statusBeforeCompletion!=='已完成'?record.statusBeforeCompletion:'待確認'}
export function changeRecordStatus(record,status){
if(!statuses.includes(status))throw Error('不支援的狀態');
const next={...record};
if(status==='已完成'&&record.status!=='已完成')next.statusBeforeCompletion=statuses.includes(record.status)?record.status:'待確認';
else if(status!=='已完成')delete next.statusBeforeCompletion;
next.status=status;return next;
}
export const fields={name:'對方暱稱',account:'社群帳號',platform:'社群平台',type:'交換類型',give:'我要給的物品',receive:'我要領的物品',quantity:'數量',time:'約定時間',place:'約定地點',tags:'標籤',notes:'備註',link:'個人頁連結'};
export function exportRecordsCSV(records,events){
const columns=['eventName','eventDate','eventVenue',...Object.keys(fields),'status','statusBeforeCompletion'];
const titles={...fields,eventName:'演唱會場次',eventDate:'場次日期',eventVenue:'演出地點',status:'狀態',statusBeforeCompletion:'完成前狀態'};
const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
const safe=value=>/^\s*[=+\-@]/.test(String(value??''))?"'"+value:value;
const rows=records.map(record=>{const event=events.find(e=>e.id===record.eventId);const item={...record,eventName:event?.name||'',eventDate:event?.date||'',eventVenue:event?.venue||''};return columns.map(key=>safe(item[key]))});
return '\uFEFF'+[columns.map(key=>titles[key]),...rows].map(row=>row.map(quote).join(',')).join('\r\n');
}
export function normalize(v){return String(v??'').normalize('NFKC').toLowerCase().replace(/[@#＃＠]/g,'').trim()}
export function matches(r,q){const text=normalize(Object.entries(r).filter(([key,value])=>key!=='statusBeforeCompletion'&&(typeof value==='string'||typeof value==='number')).map(([,value])=>value).join(' '));return normalize(q).split(/\s+/).every(t=>text.includes(t))}
export function parseCSV(text){text=text.replace(/^\uFEFF/,'');let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(!quoted&&cell!=='')throw Error('引號格式不正確');else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV 引號未閉合');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows}
export function duplicate(a,b){return normalize(a.account||a.name)===normalize(b.account||b.name)&&normalize(a.platform)===normalize(b.platform)&&a.type===b.type}
export function validBackup(d){const strings=(o,keys)=>o&&keys.every(k=>o[k]===undefined||typeof o[k]==='string');return d?.version===1&&Array.isArray(d.events)&&Array.isArray(d.records)&&d.events.every(e=>strings(e,['date','venue'])&&typeof e.id==='string'&&typeof e.name==='string')&&new Set(d.events.map(e=>e.id)).size===d.events.length&&new Set(d.records.map(r=>r?.id)).size===d.records.length&&d.records.every(r=>strings(r,[...Object.keys(fields).filter(k=>k!=='quantity'),'updatedAt','statusBeforeCompletion'])&&typeof r.id==='string'&&typeof r.name==='string'&&d.events.some(e=>e.id===r.eventId)&&types.includes(r.type)&&statuses.includes(r.status)&&Array.isArray(r.images)&&r.images.every(im=>typeof im==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(im)))}
