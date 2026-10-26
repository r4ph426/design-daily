export async function checkWeeklyMail(env=process.env,request=fetch){
 const {BREVO_API_KEY,TOOLBOX_EMAIL_FROM,TOOLBOX_EMAIL_TO}=env;
 const address=/^[^\s<>@,]+@[^\s<>@,]+\.[^\s<>@,]+$/;
 const recipients=[...new Set((TOOLBOX_EMAIL_TO||'').split(',').map(v=>v.trim()).filter(Boolean))];
 if(!BREVO_API_KEY||/\s/.test(BREVO_API_KEY)||!address.test(TOOLBOX_EMAIL_FROM||'')||!recipients.length||recipients.length>10||recipients.some(v=>!address.test(v)))throw new Error('Weekly email configuration is missing or invalid. Reuse the existing Brevo sender and Toolbox recipient secrets.');
 const response=await request('https://api.brevo.com/v3/senders',{headers:{'api-key':BREVO_API_KEY,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Brevo sender verification was unavailable (HTTP ${response.status}).`);
 const result=await response.json();
 if(!result.senders?.some(s=>s.email?.toLowerCase()===TOOLBOX_EMAIL_FROM.toLowerCase()&&s.active===true))throw new Error('The configured weekly email sender is not active in Brevo.');
 return {ready:true,recipientCount:recipients.length};
}
