const field=document.querySelector('#app');
chrome.storage.local.get('appUrl').then(({appUrl})=>{field.value=appUrl||'https://r4ph426.github.io/design-daily/';});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',async()=>{
  try{
    const app=new URL(field.value);if(!['https:','http:'].includes(app.protocol))throw new Error('Use an https URL or your local app URL.');if(app.protocol==='http:'&&!['localhost','127.0.0.1'].includes(app.hostname))throw new Error('Remote app URLs must use HTTPS.');
    await chrome.storage.local.set({appUrl:app.origin+app.pathname});
    const tabs=await chrome.tabs.query({currentWindow:true,...(button.dataset.mode==='current'?{active:true}:button.dataset.mode==='selected'?{highlighted:true}:{})});
    const text=tabs.filter(t=>/^https?:\/\//.test(t.url||'')).map(t=>`${t.title||''}\n${t.url}`).join('\n\n');
    if(!text)throw new Error('No web pages selected. Chrome internal pages cannot be captured.');
    if(text.length>60000)throw new Error('This window is too large for one draft. Select fewer tabs or use Chrome bookmark HTML import.');
    app.search='';app.hash='/inspiration/capture?text='+encodeURIComponent(text);await chrome.tabs.create({url:app.href});window.close();
  }catch(e){document.querySelector('#status').textContent=e.message;}
}));
