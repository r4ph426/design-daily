import {checkWeeklyMail} from './lib/weekly-mail-check.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {weekWindow} from './lib/weekly.mjs';
import {weeklyEmail} from './lib/weekly-email.mjs';
import {deliverToolboxDaily} from './lib/toolbox-publication.mjs';
const read=async(p,fallback)=>{try{return JSON.parse(await readFile(p,'utf8'));}catch(error){if(error.code==='ENOENT')return fallback;throw error;}};
async function main(){
 if(process.argv.includes('--check')){const result=await checkWeeklyMail();console.log(`Weekly mail configuration verified for ${result.recipientCount} existing recipient(s). No email sent.`);return;}

 const now=new Date(),w=weekWindow(now),file=`public/data/weeks/${w.start}.json`,edition=await read(file,null);
 if(!edition||edition.weekStart!==w.start)throw new Error('This week has no verified edition to summarize.');
 const message=weeklyEmail(edition);
 await mkdir('.private/weekly-email',{recursive:true,mode:0o700});
 await writeFile('.private/weekly-email/preview.html',message.html,{mode:0o600});
 await writeFile('.private/weekly-email/preview.txt',message.text,{mode:0o600});
 if(!process.argv.includes('--send')){console.log('Weekly email preview written without sending.');return;}
 if(w.weekday!==5)throw new Error('Weekly email delivery is Friday-only.');
 if(process.env.WEEKLY_EMAIL_PERSIST_GIT!=='true')throw new Error('A durable GitHub delivery checkpoint is required to send.');
 // Freeze the exact version used by the email, retaining the successful-collection timestamp.
 edition.finalizedAt ||= now.toISOString();
 const stateFile='data/weekly-email-state.json',state=await read(stateFile,{});
 const persist=async next=>{
   await writeFile(stateFile+'.tmp',JSON.stringify(next,null,2)+'\n');await rename(stateFile+'.tmp',stateFile);
   await writeFile(file,JSON.stringify(edition,null,2)+'\n');
   const latest=await read('public/data/latest.json',null);
   const files=[stateFile,file];
   if(latest?.weekStart===w.start){await writeFile('public/data/latest.json',JSON.stringify(edition,null,2)+'\n');files.push('public/data/latest.json');}
   try{
     execFileSync('git',['config','user.name','design-daily bot'],{stdio:'pipe'});
     execFileSync('git',['config','user.email','design-daily-bot@users.noreply.github.com'],{stdio:'pipe'});
     execFileSync('git',['add','--',...files],{stdio:'pipe'});
     execFileSync('git',['commit','--only','-m','Record weekly email delivery','--',...files],{stdio:'pipe'});
     execFileSync('git',['push','origin','HEAD:refs/heads/main'],{stdio:'pipe'});
   }catch{throw new Error('Weekly delivery checkpoint could not be saved. Inspect state before retrying.');}
 };
 const result=await deliverToolboxDaily(message,{day:w.start,state,persist});
 console.log(result==='accepted'?'Weekly summary accepted by Brevo; inbox delivery is not yet confirmed.':'This weekly summary was already accepted; duplicate skipped.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
