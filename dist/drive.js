export function driveAttachment(value){
  try{const url=new URL(typeof value==='string'?value:value?.url);if(url.protocol!=='https:'||url.hostname!=='drive.google.com')return null;
    const id=url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/)?.[1]||url.searchParams.get('id');
    if(!id||!/^[A-Za-z0-9_-]{5,200}$/.test(id))return null;
    url.hash='';return {kind:'drive',id,url:url.href};
  }catch{return null}
}
export function parseDriveLinks(text){
  const links=String(text??'').split(/[\s,，]+/u).map(v=>v.trim()).filter(Boolean),images=[],invalid=[];
  for(const link of links){const image=driveAttachment(link);if(image){if(!images.some(i=>i.id===image.id))images.push(image)}else invalid.push(link)}
  return {images,invalid};
}
export function mergeDriveImages(existing=[],incoming=[]){const result=new Map();for(const item of [...existing,...incoming]){const image=driveAttachment(item);if(!image)continue;const before=result.get(image.id);if(before&&new URL(before.url).searchParams.has('resourcekey')&&!new URL(image.url).searchParams.has('resourcekey'))continue;result.set(image.id,image)}return [...result.values()]}
export function drivePreviewURL(item){const image=driveAttachment(item);if(!image)return '';const url=new URL('https://drive.google.com/thumbnail');url.searchParams.set('id',image.id);url.searchParams.set('sz','w1600');const key=new URL(image.url).searchParams.get('resourcekey');if(key)url.searchParams.set('resourcekey',key);return url.href}
export function recordAttachments(record){return [...(record.images||[]),...mergeDriveImages(record.driveImages)]}
export function validDriveImages(value){return value===undefined||Array.isArray(value)&&value.every(image=>image&&typeof image==='object'&&image.kind==='drive'&&driveAttachment(image)?.id===image.id)}
