const controllers=new Map();let loadImage;
function release(controller){controller.generation++;controller.targetIndex=null;for(const url of controller.urls.values())URL.revokeObjectURL(url);controller.urls.clear();controller.pending.clear();controller.element.querySelectorAll('img').forEach(img=>img.removeAttribute('src'))}
export function releaseGalleries(root){for(const [element,c]of controllers)if(element===root||root.contains(element)){release(c);controllers.delete(element)}}
export function galleryResources(){return [...controllers.values()].reduce((sum,c)=>sum+c.urls.size,0)}
function controllerFor(element){
  if(controllers.has(element))return controllers.get(element);
  const refs=JSON.parse(element.dataset.gallery),track=element.querySelector('.gallery-track');
  const c={element,refs,track,index:0,targetIndex:null,urls:new Map(),pending:new Set(),generation:0};controllers.set(element,c);
  const setIndex=index=>{c.index=Math.max(0,Math.min(refs.length-1,index));c.targetIndex=c.index;track.scrollTo({left:c.index*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});paint(c)};
  element.querySelector('[data-gallery-prev]').onclick=()=>setIndex(c.index-1);
  element.querySelector('[data-gallery-next]').onclick=()=>setIndex(c.index+1);
  track.addEventListener('scroll',()=>{if(track.clientWidth){if(c.targetIndex!==null){if(Math.abs(track.scrollLeft-c.targetIndex*track.clientWidth)<2)c.targetIndex=null;return}const next=Math.round(track.scrollLeft/track.clientWidth);if(next!==c.index){c.index=next;paint(c)}}},{passive:true});
  track.addEventListener('pointerdown',()=>{c.targetIndex=null},{passive:true});
  track.addEventListener('wheel',()=>{c.targetIndex=null},{passive:true});
  track.onkeydown=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setIndex(c.index+(event.key==='ArrowLeft'?-1:1))}};
  element.querySelectorAll('[data-gallery-retry]').forEach(button=>button.onclick=()=>paint(c));
  return c;
}
function paint(c){
  if(!c.element.open||!c.element.isConnected)return;
  c.element.querySelector('[data-gallery-count]').textContent=(c.index+1)+' / '+c.refs.length;
  c.element.querySelector('[data-gallery-prev]').disabled=c.index===0;c.element.querySelector('[data-gallery-next]').disabled=c.index===c.refs.length-1;
  const wanted=new Set([c.index-1,c.index,c.index+1].filter(i=>i>=0&&i<c.refs.length));
  for(const [i,url]of c.urls)if(!wanted.has(i)){c.track.children[i].querySelector('img').removeAttribute('src');URL.revokeObjectURL(url);c.urls.delete(i)}
  for(const i of wanted){if(c.urls.has(i)||c.pending.has(i))continue;c.pending.add(i);const generation=c.generation;const slide=c.track.children[i];slide.querySelector('[data-gallery-error]').hidden=true;
    loadImage(c.refs[i]).then(blob=>{
      if(generation!==c.generation||!c.element.open||!c.element.isConnected||Math.abs(i-c.index)>1)return;
      const url=URL.createObjectURL(blob);c.urls.set(i,url);const img=slide.querySelector('img');img.onerror=()=>{if(c.urls.get(i)===url){URL.revokeObjectURL(url);c.urls.delete(i);img.removeAttribute('src');slide.querySelector('[data-gallery-error]').hidden=false}};img.src=url;
    }).catch(()=>{if(generation===c.generation&&c.element.open)slide.querySelector('[data-gallery-error]').hidden=false}).finally(()=>{if(generation===c.generation)c.pending.delete(i)});
  }
}
export function installGalleries(loader){
  loadImage=loader;
  document.addEventListener('toggle',event=>{const element=event.target;if(!element.matches?.('details[data-gallery]'))return;const c=controllerFor(element);if(element.open){requestAnimationFrame(()=>{c.track.scrollLeft=c.index*c.track.clientWidth;paint(c)})}else release(c)},true);
  new MutationObserver(()=>{for(const [element,c]of controllers)if(!element.isConnected){release(c);controllers.delete(element)}}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{for(const c of controllers.values())if(c.element.open)c.track.scrollLeft=c.index*c.track.clientWidth});
}
