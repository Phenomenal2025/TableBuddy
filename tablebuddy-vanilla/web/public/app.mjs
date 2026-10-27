import {game} from '/game.mjs';
import {createSession,validSession,transition,viewOf} from '/core.mjs';
import {translate} from '/i18n.mjs';
const $=id=>document.getElementById(id),KEY='peiju-session-v2',LANG_KEY='peiju-language';
let session=null,saved=null,asking=false,language='zh',modeKey='connecting',messageKey='',requestId=0,controller=null;
try{if(localStorage.getItem(LANG_KEY)==='en')language='en';}catch(_){}
const t=(key,values)=>translate(language,key,values);
function message(key){messageKey=key;$('message').textContent=key?t(key):'';}
try{const s=JSON.parse(localStorage.getItem(KEY));if(validSession(s)&&s.status==='active'){saved=s;$('restore').hidden=false;}}catch(_){message('readFailed');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(session));}catch(_){message('saveFailed');}}
function renderSources(target,sources){target.replaceChildren();for(const source of sources){const item=document.createElement('div');item.className='source-item';const title=document.createElement('strong');title.textContent=source.id+' · '+source.title;const text=document.createElement('p');text.textContent=source.text;const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t('sourcePage',{page:source.page});item.append(title,text,link);target.append(item);}}
function render(){
 $('setup').hidden=!!session;$('lesson').hidden=!session||session.status==='completed';$('complete').hidden=!session||session.status!=='completed';
 if(!session)return;const v=viewOf(session,language);
 $('step-title').textContent=v.title;$('explanation').textContent=v.explanation;$('example-text').textContent=v.example;$('example').hidden=!v.showExample;
 $('step-number').textContent=String(v.index).padStart(2,'0');$('progress-text').textContent=v.index+' / '+v.total;$('progress').value=v.index;$('progress').max=v.total;
 $('setup-chips').textContent=session.stepIndex===1?t('chips',{players:session.playerCount,chips:v.chips}):'';
 $('paused').hidden=!v.paused;$('resume').hidden=!v.paused;for(const id of ['next','more','handover'])$(id).hidden=v.paused;$('back').hidden=v.paused||session.stepIndex===0;
 $('next').textContent=t(v.index===v.total?'finish':'next');renderSources($('source-list'),v.sources);
}
function applyLanguage(){$('brand-english').hidden=language!=='zh';document.documentElement.lang=language==='en'?'en':'zh-CN';document.title=t('pageTitle');$('language').value=language;$('language').setAttribute('aria-label',t('languageLabel'));document.querySelector('label[for="language"]').textContent=t('languageLabel');for(const element of document.querySelectorAll('[data-i18n]'))element.textContent=t(element.dataset.i18n);for(const option of $('players').options)option.textContent=t('playerOption',{n:option.value});$('question').placeholder=t('placeholder');$('question').setCustomValidity('');$('mode').textContent=t(modeKey);$('message').textContent=messageKey?t(messageKey):'';render();}
$('language').addEventListener('change',()=>{language=$('language').value;requestId++;controller?.abort();asking=false;$('ask').disabled=false;$('question-status').textContent='';$('answer').hidden=true;try{localStorage.setItem(LANG_KEY,language);}catch(_){}applyLanguage();message('languageChanged');});
function event(name){if(!session)return;session=transition(session,name);save();render();}
$('start-form').addEventListener('submit',e=>{e.preventDefault();session=createSession(Number($('players').value),$('experience').value);save();render();message('started');});
$('restore').addEventListener('click',()=>{session=saved;render();message('restored');});
for(const name of ['next','more','back','handover','resume'])$(name).addEventListener('click',()=>event(name));
function restart(){if(!confirm(t('confirmReset')))return;try{localStorage.removeItem(KEY);}catch(_){message('clearFailed');return;}session=null;saved=null;$('restore').hidden=true;$('answer').hidden=true;render();message('resetDone');}
$('restart').addEventListener('click',restart);$('restart-complete').addEventListener('click',restart);
$('question').addEventListener('invalid',()=>{$('question').setCustomValidity($('question').value.trim()?'':t('emptyQuestion'));});
$('question').addEventListener('input',()=>{$('question').setCustomValidity('');});
$('export').addEventListener('click',()=>{if(!session){message('noLog');return;}const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),language,type:'teaching-events-not-user-research',session},null,2)],{type:'application/json'});const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='tablebuddy-session.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('exported');});
$('question-form').addEventListener('submit',async e=>{
 e.preventDefault();if(asking)return;const question=$('question').value.trim();if(!question)return;
 const id=++requestId,activeController=new AbortController();controller=activeController;let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;activeController.abort();},16000);
 asking=true;$('ask').disabled=true;$('question-status').textContent=t('searching');$('answer').hidden=true;
 try{const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json','Accept-Language':language},body:JSON.stringify({gameId:game.id,gameVersion:game.version,stepIndex:session?.stepIndex||0,question,language}),signal:activeController.signal});const answer=await response.json();if(id!==requestId)return;if(!response.ok)throw new Error(answer.error||t('queryFailed'));$('answer').hidden=false;$('answer-text').textContent=answer.text;$('answer-mode').textContent=t(answer.mode==='live'?'modelAnswer':answer.mode==='fallback'?'fallbackAnswer':'evidenceAnswer');renderSources($('answer-sources'),answer.sources);$('human-note').hidden=!answer.needsHuman;$('question-status').textContent='';if(session)event('question');}
 catch(error){if(id!==requestId)return;const text=timedOut?t('timeout'):error instanceof TypeError?t('network'):error.message;$('question-status').textContent=text+'. '+t('retrySuffix');}
 finally{clearTimeout(timer);if(id===requestId){asking=false;$('ask').disabled=false;controller=null;}}
});
fetch('/api/status').then(r=>r.json()).then(status=>{modeKey=status.modelConfigured?'configured':'evidence';$('mode').textContent=t(modeKey);}).catch(()=>{modeKey='disconnected';$('mode').textContent=t(modeKey);});
applyLanguage();
