export function imageDimensions(width,height,maxEdge=1920){const scale=Math.min(1,maxEdge/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))}}
export async function compressImage(original,{mode='balanced'}={}){
  if(mode==='original'||original.type==='image/gif')return {blob:original,changed:false};
  const maxEdge=mode==='clear'?2560:1920,quality=mode==='clear'?.9:.82;
  let bitmap,image,url,canvas;
  try{
    if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(original);
    else{url=URL.createObjectURL(original);image=new Image();image.src=url;await image.decode()}
    const source=bitmap||image,width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
    if(!width||!height)throw Error('圖片無法解碼');
    const dimensions=imageDimensions(width,height,maxEdge);canvas=document.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.height;
    const context=canvas.getContext('2d');if(!context)throw Error('裝置無法處理圖片');context.drawImage(source,0,0,canvas.width,canvas.height);
    const encode=(type,q)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('圖片壓縮失敗')),type,q));
    let best=await encode('image/webp',quality);
    if(best.type!=='image/webp')best=await encode(original.type==='image/jpeg'?'image/jpeg':'image/png',quality);
    if(mode==='balanced'&&original.type==='image/jpeg'&&best.type==='image/webp'&&best.size>300*1024){const smaller=await encode('image/webp',.76);if(smaller.size<best.size)best=smaller}
    return best.size<original.size?{blob:best,changed:true,width:dimensions.width,height:dimensions.height}:{blob:original,changed:false,width,height};
  }finally{bitmap?.close();if(image)image.src='';if(url)URL.revokeObjectURL(url);if(canvas){canvas.width=1;canvas.height=1}}
}
export async function optimizeImages(store,{mode='balanced',signal,onProgress=()=>{}}={}){
  const ids=[...new Set(store.data.records.flatMap(r=>r.images))];const result={total:ids.length,processed:0,changed:0,skipped:0,failed:0,saved:0,cancelled:false};
  for(const ref of ids){
    if(signal?.aborted){result.cancelled=true;break}
    try{const details=await store.details(ref);if(details.optimizedMode===mode){result.skipped++}else{const before=details.blob,after=await compressImage(before,{mode});if(signal?.aborted){result.cancelled=true;break}if(after.changed){await store.replaceImage(ref,after.blob,{optimizedMode:mode});result.changed++;result.saved+=before.size-after.blob.size}else result.skipped++}}catch{result.failed++}
    result.processed++;onProgress({...result});await new Promise(resolve=>setTimeout(resolve,0));
  }
  return result;
}
