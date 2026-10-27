export const game = {
  id: 'no-thanks-base', version: 'amigo-2024-base-v1',
  title: 'No Thanks!', subtitle: '基础玩法带新助手', minPlayers: 3, maxPlayers: 7,
  scope: '依据AMIGO 2024英文规则整理，仅含基础玩法；不含绿色、粉色特效卡。',
  source: { title: 'AMIGO 2024 English Rules', url: 'https://blog.amigo-spiele.de/content/ap/rule/02455-GB-AmigoRule.pdf' },
  rules: [
    {id:'R1',title:'人数',page:'1',text:'基础玩法支持3至7人。',terms:['人数','几人','几个人','两人','2人','八人','8人','三人','七人']},
    {id:'R2',title:'牌堆',page:'2',text:'数字牌为3至35。洗牌后不看牌移出9张，留下24张；基础局不加入特效卡。',terms:['准备','牌堆','移出','九张','9张','多少张','数字牌','特效','扩展','绿','粉','范围']},
    {id:'R3',title:'起始筹码',page:'3',text:'3至5人每人11枚，6人每人9枚，7人每人7枚。个人筹码数量保密。',terms:['起始','初始','筹码多少','几个筹码','11','六人','6人','七人','7人','保密','隐藏']},
    {id:'R4',title:'拒收',page:'4',text:'拒收时放1枚筹码到牌上，再由左手边玩家决定。',terms:['拒收','拒绝','不要','不拿','付','支付','跳过','左手','顺时针']},
    {id:'R5',title:'接收',page:'4',text:'拿牌时一起拿走牌上筹码，再翻新牌，仍由自己决定拿或拒收。',terms:['拿牌','拿走','接收','接受','收牌','接下来','轮到','翻','继续','下一个','下一位']},
    {id:'R6',title:'没有筹码',page:'7',text:'轮到自己且没有筹码时，必须拿牌。',terms:['没有筹码','没筹码','筹码用完','筹码为0','零筹码','0枚','0筹码']},
    {id:'R7',title:'结算',page:'8至9',text:'连续数字只计最小值，单张计牌面；扣掉剩余筹码数。',terms:['连续','连号','断开','最小','计分','分数','算分','结算','剩余','扣','负分','负数']},
    {id:'R8',title:'结束与胜负',page:'9至10',text:'最后一张牌被拿走后结算，总分最低者胜；并列者共享胜利。',terms:['结束','最后','获胜','赢家','胜负','最低','最高','并列','平局','相同']}
  ],
  steps: [
    {id:'goal',title:'这局怎么赢',brief:'结束时分数越低越好。',text:'先记住目标：尽量少得分。最后一张牌被拿走后才结算。',example:'甲结算为18分，乙为12分，乙的分数更低。',sources:['R8']},
    {id:'setup',title:'准备好这一桌',brief:'先核对人数、牌堆和起始筹码。',text:'洗好数字牌，随机移出9张但不查看。按本桌人数分筹码，个人数量保密。',example:'四人局每人11枚；六人局每人9枚。请按你手上的规则版本核对。',sources:['R1','R2','R3']},
    {id:'action',title:'轮到你时做什么',brief:'选拿牌，或付1枚筹码拒收。',text:'拿牌会一起拿走牌上筹码；拒收要付1枚，才交给左边的人。没筹码时只能拿。',example:'这张牌你不想拿，就放1枚筹码；如果手中没有筹码，就不能拒收。',sources:['R4','R5','R6']},
    {id:'turn',title:'拿牌后是谁继续',brief:'拿牌的人翻新牌，仍由自己决定。',text:'最容易弄混的是交接：拿牌后并不直接轮到别人。只有付筹码拒收，才交给左边的人。',example:'你刚收下一张牌，接着翻新牌；这次你选择拒收，才交给左边玩家。',sources:['R4','R5']},
    {id:'score',title:'算一次分数',brief:'连续牌只计最小值，再扣筹码。',text:'把连续数字分成一组，每组只算最小值；再加上单张，最后扣掉剩余筹码。',example:'牌为8、9、10、17，剩3枚筹码：8＋17－3＝22。',sources:['R7']},
    {id:'practice',title:'大家试一轮',brief:'请每位新手说清楚并试一次合法行动。',text:'把手机放回桌边，让大家试着拿牌或拒收。不确定的地方再查规则。组局者确认后结束本次教学。',example:'请组局者问：我没筹码还能拒收吗？刚拿完牌，应该由谁翻下一张？',sources:['R4','R5','R6','R8']}
  ]
};
const englishRules = {
  R1:{title:'Players',text:'The base game supports 3–7 players.',terms:['players','player count','two people','eight people']},
  R2:{title:'Deck setup',text:'Use cards 3–35. Remove 9 unseen; 24 remain. Exclude special cards.',terms:['deck','setup','number cards','remove','nine cards','special cards','expansion','green','pink']},
  R3:{title:'Starting counters',text:'Give 11 counters each for 3–5 players, 9 for 6, or 7 for 7. Keep personal counters secret.',terms:['starting','initial','counters','chips','tokens','secret','hidden']},
  R4:{title:'Refusing a card',text:'Pay 1 counter onto the card to refuse it. Play passes to your left.',terms:['refuse','refusing','decline','pass','pay','cost','clockwise','left']},
  R5:{title:'Taking a card',text:'Take the card and its counters. Reveal another card and decide again yourself.',terms:['take','taking','accept','collect','reveal','next card','whose turn','who goes']},
  R6:{title:'No counters left',text:'With no counters on your turn, you must take the card.',terms:['no counters','no chips','no tokens','out of counters','out of chips','out of tokens','zero counters','0 counters']},
  R7:{title:'Scoring',text:'Count only the lowest card in each consecutive run, plus single cards. Subtract remaining counters.',terms:['score','scoring','consecutive','sequence','chain','run','lowest card','subtract','remaining','negative']},
  R8:{title:'Ending and winning',text:'Score after the last card is taken. Lowest total wins; tied players share victory.',terms:['end','last card','win','winner','lowest total','highest','tie','tied']}
};
const englishSteps = [
  {title:'Know the goal',brief:'The lowest final score wins.',text:'Start with the goal: finish with the fewest points. Scoring happens after the last card is taken.',example:'If Alex finishes with 18 points and Sam with 12, Sam has the lower score.'},
  {title:'Set up your table',brief:'Check the players, deck and starting counters.',text:'Shuffle the number cards and remove 9 without looking. Give out counters for your player count and keep personal counters secret.',example:'With four players, give each 11 counters; with six, give each 9. Check the edition you are using.'},
  {title:'Choose your action',brief:'Take the card, or pay 1 counter to refuse it.',text:'Taking includes the counters on the card. Refusing costs 1 counter and passes play left. With no counters, you must take.',example:'To refuse a card, put 1 counter on it. If you have no counters, that option is unavailable.'},
  {title:'Who acts after taking?',brief:'The player who takes reveals and decides again.',text:'Taking a card does not pass play to someone else. Only paying a counter to refuse passes play to the left.',example:'You take a card and reveal the next one. You then refuse that new card, so play passes left.'},
  {title:'Try one scoring example',brief:'Count the lowest in each run, then subtract counters.',text:'Group consecutive numbers. Count each group’s lowest value, add single cards, then subtract your remaining counters.',example:'Cards 8, 9, 10 and 17 with 3 counters score 8 + 17 − 3 = 22.'},
  {title:'Try a practice round',brief:'Let each new player explain and try a legal action.',text:'Return your attention to the table. Try taking or refusing, and look up anything unclear. The host confirms when teaching is finished.',example:'Ask: can I refuse with no counters? After taking a card, who reveals the next one?'}
];
for(const rule of game.rules)rule.en=englishRules[rule.id];
for(let i=0;i<game.steps.length;i++)game.steps[i].en=englishSteps[i];
export function gameFor(language='zh') {
  if(language!=='en')return game;
  return {...game,subtitle:'A guide to the base game',scope:'Based on AMIGO’s 2024 English base rules. Green and pink special cards are excluded.',rules:game.rules.map(rule=>({...rule,...rule.en})),steps:game.steps.map(step=>({...step,...step.en}))};
}
export function sourcesFor(ids,language='zh') {
  return gameFor(language).rules.filter(rule=>ids.includes(rule.id)).map(({id,title,text,page})=>({id,title,text,page:language==='en'?page.replace('至','–'):page,url:game.source.url+'#page='+page.split('至')[0]}));
}
