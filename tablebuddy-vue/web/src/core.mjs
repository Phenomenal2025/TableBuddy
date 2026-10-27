import {game,gameFor,sourcesFor} from './game.mjs';
export function createSession(playerCount,experience,now=Date.now()) {
  if(!Number.isInteger(playerCount)||playerCount<game.minPlayers||playerCount>game.maxPlayers) throw new Error('本版本支持3至7人');
  if(!['new','mixed','familiar'].includes(experience)) throw new Error('经验选项无效');
  return {schema:2,gameId:game.id,gameVersion:game.version,playerCount,experience,stepIndex:0,examples:0,paused:false,status:'active',startedAt:now,logs:[]};
}
export function validSession(s) {
  return !!s&&s.schema===2&&s.gameId===game.id&&s.gameVersion===game.version&&
    Number.isInteger(s.playerCount)&&s.playerCount>=3&&s.playerCount<=7&&['new','mixed','familiar'].includes(s.experience)&&
    Number.isInteger(s.stepIndex)&&s.stepIndex>=0&&s.stepIndex<game.steps.length&&Number.isInteger(s.examples)&&s.examples>=0&&s.examples<=100&&
    typeof s.paused==='boolean'&&['active','completed'].includes(s.status)&&
    (s.status!=='completed'||s.stepIndex===game.steps.length-1)&&Number.isFinite(s.startedAt)&&Array.isArray(s.logs)&&s.logs.length<=300;
}
export function transition(session,event,now=Date.now()) {
  if(!validSession(session)) throw new Error('进度格式失效，请重新开始');
  if(!['next','back','more','handover','resume','question'].includes(event)) throw new Error('未知事件');
  const s=structuredClone(session);
  if(s.status==='completed'||(s.paused&&event!=='resume')) return s;
  if(event==='next') { if(s.stepIndex===game.steps.length-1)s.status='completed';else s.stepIndex++;s.examples=0; }
  if(event==='back'&&s.stepIndex>0){s.stepIndex--;s.examples=0;}
  if(event==='more') s.examples=Math.min(s.examples+1,100);
  if(event==='handover') s.paused=true;
  if(event==='resume') s.paused=false;
  s.logs.push({event,at:now,from:session.stepIndex,to:s.stepIndex});s.logs=s.logs.slice(-300);
  return s;
}
export function viewOf(s,language='zh') {
  if(!validSession(s))throw new Error('无效进度');
  const step=gameFor(language).steps[s.stepIndex];
  return {...step,explanation:s.experience==='familiar'?step.brief:step.text,sources:sourcesFor(step.sources,language),index:s.stepIndex+1,total:game.steps.length,showExample:s.examples>0,paused:s.paused,complete:s.status==='completed',chips:s.playerCount<=5?11:s.playerCount===6?9:7};
}
export function scoreCards(cards,chips) {
  if(!Array.isArray(cards)||cards.some(n=>!Number.isInteger(n)||n<3||n>35)||new Set(cards).size!==cards.length||!Number.isInteger(chips)||chips<0)throw new Error('牌为3至35不重复整数，筹码为非负整数');
  const sorted=[...cards].sort((a,b)=>a-b);
  return sorted.reduce((sum,n,i)=>sum+(i===0||n!==sorted[i-1]+1?n:0),0)-chips;
}
