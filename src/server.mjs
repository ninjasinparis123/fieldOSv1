import { createServer } from 'node:http';
import { audit, RULES } from './audit.mjs';
const MAX_BODY=16384;
const info = {
  name:'Agent Commons by Nautilak – Reliability Audit',
  status:'pilot',
  verification:'SELF_REPORTED_ONLY',
  usage:'POST /api/preview with JSON { "permissions":"yes", "timeouts":"no" }. Allowed answers: yes, no, unknown.',
  endpoints:['GET /healthz','GET /docs','POST /api/preview','GET /api/preview','GET /.well-known/agent-service.json'],
  payment_status:'disabled — mainnet and testnet payments unavailable',
  note:'No independent security scan, code execution, AI model call or paid checkout.'
};
const send=(res,status,data)=>{const body=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'});res.end(body);};
async function readJSON(req){
  if (!(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) throw new TypeError('Content-Type must be application/json');
  let s='';
  for await(const chunk of req){s += chunk.toString('utf8');if(Buffer.byteLength(s)>MAX_BODY)throw new RangeError('Request body too large');}
  const parsed=JSON.parse(s||'{}');
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new TypeError('JSON object required');
  return parsed;
}
export const handler=async(req,res)=>{
  try{
    const u=new URL(req.url,'http://localhost');
    if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
    if(req.method==='GET' && u.pathname==='/healthz') return send(res,200,{ok:true,service:'agent-commons-audit',paid_mainnet_enabled:false});
    if(req.method==='GET' && u.pathname==='/') return send(res,200,info);
    if(req.method==='GET' && u.pathname==='/docs') return send(res,200,{...info,fields:RULES.map(r=>({key:r.id,label:r.label,values:['yes','no','unknown']})),privacy:'Do not send API keys, private keys, personal data or company secrets.'});
    if(req.method==='GET' && u.pathname==='/.well-known/agent-service.json') return send(res,200,{...info,interface:'HTTP JSON (read-only audit preview)',a2a_agent_card:false});
    if(u.pathname==='/api/preview' && ['POST','GET'].includes(req.method)){
      const input=req.method==='POST' ? await readJSON(req) : Object.fromEntries(u.searchParams.entries());
      return send(res,200,audit(input));
    }
    if(u.pathname==='/api/report') return send(res,503,{paid:false,error:'Paid report intentionally disabled; no payment processor or wallet is connected.'});
    return send(res,404,{error:'Not found'});
  }catch(err){
    return send(res,err instanceof RangeError?413:400,{error:err instanceof SyntaxError?'Malformed JSON':String(err.message||'Invalid request')});
  }
};
const port=Number.parseInt(process.env.PORT||'10000',10);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
createServer(handler).listen(port,'0.0.0.0',()=>console.log('Agent Commons Audit API listening on '+port+' (payments disabled)'));
