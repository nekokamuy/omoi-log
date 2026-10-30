export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cleanAccount=value=>String(value??'').trim().replace(/^[@＠\s]+/u,'');
export const displayAccount=value=>cleanAccount(value)?'@'+cleanAccount(value):'';
export function composeTime(hour,minute){if(hour===''&&minute==='')return '';if(!/^\d{2}$/.test(hour)||!/^\d{2}$/.test(minute)||Number(hour)>23||Number(minute)>59)return null;return `${hour}:${minute}`}
export function timePickerMarkup(value=''){
const match=/^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value||''),valid=match&&composeTime(match[1],match[2])!==null,hour=valid?match[1]:'',minute=valid?match[2]:'';
const options=(count,selected,suffix)=>Array.from({length:count},(_,i)=>{const v=String(i).padStart(2,'0');return `<option value="${v}" ${v===selected?'selected':''}>${v} ${suffix}</option>`}).join('');
return `<div class="time-field"><span id="appointment-time-label">約定時間</span><div class="time-picker" role="group" aria-labelledby="appointment-time-label"><select data-time-hour aria-label="約定時間：小時"><option value="">未設定</option>${options(24,hour,'時')}</select><span aria-hidden="true">:</span><select data-time-minute aria-label="約定時間：分鐘"><option value="">-- 分</option>${options(60,minute,'分')}</select></div><input type="hidden" name="time" value="${hour?`${hour}:${minute}`:''}"></div>`;
}
export function bindTimePicker(form){
const hour=form.querySelector('[data-time-hour]'),minute=form.querySelector('[data-time-minute]'),value=form.querySelector('[name="time"]');
const sync=event=>{if(event.target===hour){if(!hour.value)minute.value='';else if(!minute.value)minute.value='00'}const time=composeTime(hour.value,minute.value);hour.setCustomValidity(time===null?'請選擇小時與分鐘，或將小時改回未設定。':'');value.value=time??''};
hour.addEventListener('change',sync);minute.addEventListener('change',sync);
}
export function splitTags(value){return [...new Set(String(value??'').split(/[\s,，]+/u).map(tag=>tag.replace(/^[#＃]+/u,'')).filter(Boolean))]}
export function availableTags(records,currentTags=''){return [...new Set([...records.flatMap(record=>splitTags(record.tags)),...splitTags(currentTags)])].sort((a,b)=>a.localeCompare(b,'zh-Hant'))}
export function mergeTags(selected,custom){return [...new Set([...selected.flatMap(splitTags),...splitTags(custom)])].join(' ')}
export function tagPickerMarkup(records,currentTags=''){
const tags=availableTags(records,currentTags),selected=new Set(splitTags(currentTags));
const custom='<label>自訂 hashtag<input name="customTags" maxlength="1000" placeholder="例如：小卡 現場領取（空格分隔）"><span class="help">新增標籤會與勾選的標籤一起儲存，下次即可直接選取。</span></label>';
return `<fieldset class="wide tag-picker"><legend>選擇 hashtag（可複選）</legend>${tags.length?`<p class="help">以下為所有場次現有的標籤，可勾選或取消。</p><div class="tag-options">${tags.map(tag=>`<label class="tag-choice"><input type="checkbox" name="selectedTags" value="${escapeHTML(tag)}" ${selected.has(tag)?'checked':''}><span>#${escapeHTML(tag)}</span></label>`).join('')}</div><details class="custom-tags"><summary>找不到需要的標籤？自訂新增</summary>${custom}</details>`:`<p class="help">目前沒有可選的標籤，先自訂新增。</p>${custom}`}</fieldset>`;
}
export function recordNumber(record,records){return String(records.filter(r=>r.eventId===record.eventId).findIndex(r=>r.id===record.id)+1).padStart(2,'0')}
export function notesMarkup(notes){const text=String(notes??'').trim();if(!text)return '';const chars=Array.from(text);if(chars.length<=80)return `<div class="record-notes"><span class="section-caption">備註</span><p>${escapeHTML(text)}</p></div>`;return `<details class="record-notes notes-expand"><summary><span class="section-caption">備註</span><span class="notes-preview">${escapeHTML(chars.slice(0,80).join(''))}...</span><span class="when-closed disclosure-label">展開備註 ﹀</span><span class="when-open disclosure-label">收起備註 ﹀</span></summary><p>${escapeHTML(text)}</p></details>`}
export function imagesMarkup(images,{expanded=false}={}){if(!images?.length)return '';return `<details class="image-accordion" ${expanded?'open':''}><summary><span>${images.length}張圖片，</span><span class="when-closed">點選展開 ﹀</span><span class="when-open">點選收起 ︿</span></summary><div class="inline-gallery">${images.map((src,i)=>`<figure><img src="${escapeHTML(src)}" alt="圖片 ${i+1}" loading="lazy"><figcaption>${i+1} / ${images.length}</figcaption></figure>`).join('')}</div></details>`}
