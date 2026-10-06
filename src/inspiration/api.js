export const canUseLocalService=()=>typeof location!=='undefined'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
export async function api(route,body,method=body?'POST':'GET'){
  if(!canUseLocalService())throw new Error('Account connections and page enrichment require the local owner service. Captures remain private in this browser.');
  const response=await fetch(`/api/inspiration/${route}`,{method,headers:{'x-inspiration-client':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(route==='digest'||route==='sync'?120000:15000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Local service unavailable.');return data;
}
