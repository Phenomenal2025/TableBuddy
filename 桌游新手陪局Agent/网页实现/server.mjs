import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {answerQuestion} from './src/assistant.mjs';
import {game} from './src/game.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const APP_VERSION='0.3.0';
const INSTANCE=createHash('sha256').update(ROOT).digest('hex').slice(0,12);
const ASSETS=new Map([['/',['public/index.html','text/html; charset=utf-8']],['/app.mjs',['public/app.mjs','text/javascript; charset=utf-8']],['/i18n.mjs',['public/i18n.mjs','text/javascript; charset=utf-8']],['/styles.css',['public/styles.css','text/css; charset=utf-8']],['/game.mjs',['src/game.mjs','text/javascript; charset=utf-8']],['/core.mjs',['src/core.mjs','text/javascript; charset=utf-8']]]);
function headers(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
export function createApp({config={},fetchImpl=fetch}={}) {
  const buckets=new Map();
  const server=http.createServer(async(req,res)=>{
    headers(res);
    const en=String(req.headers['accept-language']||'').toLowerCase().startsWith('en');
    const fail=(status,zh,english)=>json(res,status,{error:en?english:zh});
    try {
      const path=new URL(req.url,'http://localhost').pathname;
      if(req.method==='GET'&&path==='/api/status')return json(res,200,{app:'peiju-onboarding',instance:INSTANCE,version:APP_VERSION,gameId:game.id,modelConfigured:!!(config.apiKey&&config.model),mode:config.apiKey&&config.model?'model-ready':'evidence'});
      if(req.method==='POST'&&path==='/api/assistant') {
        if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host&&req.headers.origin!=='https://'+req.headers.host)return fail(403,'请求来源不匹配','Request origin does not match');
        if(!String(req.headers['content-type']||'').startsWith('application/json'))return fail(415,'请发送JSON','Send JSON content');
        const now=Date.now(),ip=req.socket.remoteAddress;
        for(const [key,value]of buckets)if(now-value.at>60000)buckets.delete(key);
        const bucket=buckets.get(ip)||{at:now,count:0};bucket.count++;buckets.set(ip,bucket);
        if(bucket.count>30)return fail(429,'请求过于频繁，请稍后再试','Too many requests. Please try again shortly.');
        if(Number(req.headers['content-length'])>8192){req.resume();return fail(413,'请求过长','Request body is too large');}
        const chunks=[];let size=0;
        for await(const chunk of req){size+=chunk.length;if(size>8192){fail(413,'请求过长','Request body is too large');req.resume();return;}chunks.push(chunk);}
        let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch(_){return fail(400,'JSON格式错误','Invalid JSON');}
        return json(res,200,await answerQuestion(body,config,fetchImpl));
      }
      if(req.method==='GET'&&ASSETS.has(path)){
        const [file,type]=ASSETS.get(path);const contents=await readFile(resolve(ROOT,file));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});return res.end(contents);
      }
      fail(404,'资源不存在','Resource not found');
    }catch(error){if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:(en?'Service temporarily unavailable':'服务暂时不可用')});else res.end();}
  });
  server.requestTimeout=20000;server.headersTimeout=10000;
  return server;
}
export async function startLocalService({host='127.0.0.1',port=3186,config={},attempts=10,log=()=>{}}={}) {
  if(!Number.isInteger(port)||port<0||port>65535)throw new Error('PORT必须是0至65535的整数');
  for(let offset=0;offset<attempts&&port+offset<=65535;offset++) {
    const candidate=port+offset,app=createApp({config});
    try {
      await new Promise((resolve,reject)=>{const fail=error=>reject(error);app.once('error',fail);app.listen(candidate,host,()=>{app.removeListener('error',fail);resolve();});});
      const actualPort=app.address().port;
      return {server:app,reused:false,url:'http://127.0.0.1:'+actualPort,port:actualPort,modelConfigured:!!(config.apiKey&&config.model)};
    }catch(error){
      if(error.code!=='EADDRINUSE')throw error;
      try {
        const response=await fetch('http://127.0.0.1:'+candidate+'/api/status',{signal:AbortSignal.timeout(700),redirect:'error'});
        const status=await response.json();
        if(response.ok&&status.app==='peiju-onboarding'&&status.instance===INSTANCE&&status.version===APP_VERSION)return {server:null,reused:true,url:'http://127.0.0.1:'+candidate,port:candidate,modelConfigured:status.modelConfigured};
      }catch(_){}
      log('端口 '+candidate+' 已被占用且不能直接复用，尝试下一个端口。');
    }
  }
  throw new Error('连续端口都不可用，请在.env设置其他PORT。');
}
function openBrowser(url) {
  if(process.platform!=='win32')return;
  const child=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{stdio:'ignore',detached:true,windowsHide:true});
  child.on('error',()=>console.log('浏览器未能自动打开，请手动访问上面的地址。'));child.unref();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{process.loadEnvFile(resolve(ROOT,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const config={apiKey:process.env.LLM_API_KEY,model:process.env.LLM_MODEL,apiUrl:process.env.LLM_API_URL,timeoutMs:Number(process.env.LLM_TIMEOUT_MS)||12000};
  const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT)||3186;
  try {
    const service=await startLocalService({host,port,config,log:console.log});
    console.log(service.reused?'本项目已在运行，直接使用已有服务。':'网页服务已启动，保持本窗口打开。');
    console.log('Local: '+service.url);
    console.log('Mode: '+(service.modelConfigured?'model-ready (not yet verified)':'evidence (no model call)'));
    if(service.reused)console.log('若修改过.env配置，请先关闭原服务窗口，再重新启动。');
    if(host==='0.0.0.0')console.log('LAN mode: use this computer LAN IP and port '+service.port+' on the same network.');
    if(process.argv.includes('--open'))openBrowser(service.url);
    if(service.server){const stop=()=>{service.server.closeAllConnections();service.server.close(()=>process.exit(0));};process.once('SIGINT',stop);process.once('SIGTERM',stop);}
  }catch(error){console.error('启动失败：'+(error.message||error.code));process.exitCode=1;}
}
