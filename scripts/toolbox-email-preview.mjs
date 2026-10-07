import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {TOOLBOX_EMAIL_COLORS as c} from './lib/toolbox-email.mjs';
import {toolboxEmail} from './lib/toolbox-publication.mjs';
const folder=process.argv[2]||'.private/toolbox-email-preview';
await mkdir(folder,{recursive:true,mode:0o700});
const log=JSON.parse(await readFile('data/toolbox-update-log.json','utf8'));
const contexts={update:{log,options:{status:'published',runUrl:'https://github.com/r4ph426/design-daily/actions/workflows/toolbox.yml'}},unchanged:{log:{date:log.date,changes:[],warnings:[]},options:{status:'unchanged'}},failed:{log:{date:log.date,changes:[],warnings:['Example error state for visual review. No test email is sent.']},options:{status:'failed'}}};
for(const [name,{log,options}] of Object.entries(contexts)){
 const message=toolboxEmail(log,options);
 await writeFile(`${folder}/${name}.html`,message.html,{mode:0o600});
 await writeFile(`${folder}/${name}.txt`,message.subject+'\n\n'+message.text,{mode:0o600});
}
const page=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>design / daily email preview</title><style>body{margin:0;background:${c.paper};font-family:'Inter',sans-serif;color:${c.ink}}nav{position:sticky;top:0;background:${c.white};padding:12px 16px;border-bottom:1px solid ${c.paper};display:flex;gap:8px;flex-wrap:wrap;z-index:2}button{font:inherit;font-size:13px;padding:12px;border:1px solid ${c.paper};background:${c.white};cursor:pointer}button[aria-pressed=true]{background:${c.sage}}p{font-size:12px;line-height:1.5;padding:0 16px}iframe{display:block;width:100%;border:0;min-height:900px}</style><nav aria-label="Email states"><button data-page="update" aria-pressed="true">Current update</button><button data-page="unchanged" aria-pressed="false">No changes</button><button data-page="failed" aria-pressed="false">Error state</button></nav><p>Local HTML preview. Current update uses the real published change log. Other states are labelled examples. No email is sent.</p><iframe title="Toolbox email" src="update.html"></iframe><script>const frame=document.querySelector('iframe');frame.onload=()=>{frame.style.height=(frame.contentDocument.documentElement.scrollHeight+16)+'px'};for(const b of document.querySelectorAll('button'))b.onclick=()=>{frame.src=b.dataset.page+'.html';for(const t of document.querySelectorAll('button'))t.setAttribute('aria-pressed',t===b?'true':'false')};</script></html>`;
await writeFile(`${folder}/index.html`,page,{mode:0o600});
console.log('Generated HTML and text previews; sent no email.');
