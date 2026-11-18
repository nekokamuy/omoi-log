import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageDimensions,compressImage,optimizeImages} from '../dist/image-processing.js';
test('縮放保持比例、不放大小圖與長條圖',()=>{assert.deepEqual(imageDimensions(4000,3000),{width:1920,height:1440});assert.deepEqual(imageDimensions(500,800),{width:500,height:800});assert.deepEqual(imageDimensions(900,6000,2560),{width:384,height:2560})});
test('保留原圖及 GIF 不解碼或重壓縮',async()=>{const original=new Blob(['gif'],{type:'image/gif'});assert.equal((await compressImage(original)).blob,original);const jpeg=new Blob(['jpeg'],{type:'image/jpeg'});assert.equal((await compressImage(jpeg,{mode:'original'})).blob,jpeg)});
test('最佳化取消前不讀取圖片、不變更資料',async()=>{let reads=0;const signal=AbortSignal.abort();const result=await optimizeImages({data:{records:[{images:['one']}]},image:()=>{reads++}},{signal});assert.equal(reads,0);assert.equal(result.cancelled,true);assert.equal(result.changed,0)});
test('相同模式不再重壓縮；失敗圖片略過並繼續保留其他圖片',async()=>{let writes=0;const result=await optimizeImages({data:{records:[{images:['done','broken','gif']}]},details:async ref=>{if(ref==='broken')throw Error('failed read');return {blob:new Blob(['gif'],{type:'image/gif'}),optimizedMode:ref==='done'?'balanced':null}},replaceImage:async()=>writes++});assert.equal(result.skipped,2);assert.equal(result.failed,1);assert.equal(result.processed,3);assert.equal(writes,0)});
