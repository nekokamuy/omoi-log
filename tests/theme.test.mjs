import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../dist/theme.js',import.meta.url),'utf8');
function setup(saved,{blocked=false}={}){
  const values=new Map(saved?[['omoi-log-theme',saved]]:[]),handlers={},storageHandlers={};
  const buttons=['dark','light'].map(value=>({dataset:{themeChoice:value},attributes:{},setAttribute(k,v){this.attributes[k]=v}}));
  const meta={content:''},document={documentElement:{dataset:{},style:{}},querySelector:()=>meta,querySelectorAll:()=>buttons,addEventListener:(name,fn)=>handlers[name]=fn};
  const window={addEventListener:(name,fn)=>storageHandlers[name]=fn};
  const localStorage={getItem:key=>{if(blocked)throw Error('Storage blocked');return values.get(key)},setItem:(key,value)=>{if(blocked)throw Error('Storage blocked');values.set(key,value)}};
  runInNewContext(source,{document,window,localStorage});
  return {document,window,meta,values,buttons,click:value=>handlers.click({target:{closest:()=>buttons.find(b=>b.dataset.themeChoice===value)}}),storageHandlers};
}
test('預設關燈，開燈後保存選擇並在下次載入還原',()=>{const first=setup();assert.equal(first.document.documentElement.dataset.theme,'dark');first.click('light');assert.equal(first.values.get('omoi-log-theme'),'light');assert.equal(first.document.documentElement.style.colorScheme,'light');assert.equal(first.meta.content,'#f6f5f0');assert.equal(first.buttons[1].attributes['aria-pressed'],'true');assert.equal(first.buttons[0].attributes['aria-pressed'],'false');const reopened=setup(first.values.get('omoi-log-theme'));assert.equal(reopened.document.documentElement.dataset.theme,'light');reopened.click('dark');assert.equal(reopened.values.get('omoi-log-theme'),'dark')});
test('畫面重繪同步選項；儲存受限時仍能切換外觀',()=>{const app=setup('light');app.buttons[1].attributes={};app.window.OmoiTheme.sync();assert.equal(app.buttons[1].attributes['aria-pressed'],'true');const limited=setup(null,{blocked:true});assert.doesNotThrow(()=>limited.click('light'));assert.equal(limited.document.documentElement.dataset.theme,'light')});
