const {chromium}=require('C:/Users/Shurong_Liu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const OUT=path.resolve(__dirname,'../../authoring/bilingual-checks');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const {createApp}=await import('../server.mjs');const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 let browser;
 const checks=[],errors=[];
 try{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await desktop.newPage();page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(base);assert.equal(response.status(),200);
  await page.locator('#mode').filter({hasText:'规则检索模式'}).waitFor();assert.equal(await page.locator('.brand-name').innerText(),'开局搭子');assert.match(await page.locator('.brand').innerText(),/TableBuddy/);assert.match(await page.title(),/开局搭子 TableBuddy/);checks.push('网页可访问且准确显示未配置模型');
  await page.screenshot({path:path.join(OUT,'desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('#start-form button').click();await page.locator('#lesson').waitFor({state:'visible'});
  await page.locator('#more').click();assert.equal(await page.locator('#example').isVisible(),true);assert.match(await page.locator('#progress-text').innerText(),/1 \/ 6/);checks.push('开始教学和举例不跳步');
  await page.locator('#handover').click();assert.equal(await page.locator('#next').isVisible(),false);await page.locator('#resume').click();await page.locator('#next').click();assert.match(await page.locator('#setup-chips').innerText(),/4人，每人11/);checks.push('人工暂停、恢复与按人数提示');
  await page.reload();await page.locator('#restore').click();assert.match(await page.locator('#progress-text').innerText(),/2 \/ 6/);checks.push('刷新后恢复进度');
  await page.locator('#question').fill('没有筹码还能拒收吗');await page.locator('#ask').click();await page.locator('#answer').waitFor({state:'visible'});assert.match(await page.locator('#answer-sources').innerText(),/必须拿牌/);assert.match(await page.locator('#answer-mode').innerText(),/非模型回答/);checks.push('真实HTTP规则查询及出处显示');
  await page.locator('#question').fill('狼人杀预言家怎么玩');await page.locator('#ask').click();await page.waitForFunction(()=>document.querySelector('#answer-text').textContent.includes('没有找到依据'));checks.push('未知规则问题回退');
  const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;await file.saveAs(path.join(OUT,'browser-teaching-events.json'));checks.push('教学日志导出');
  for(let i=0;i<5;i++)await page.locator('#next').click();await page.locator('#complete').waitFor({state:'visible'});checks.push('六步教学完成');
  await desktop.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const mp=await mobile.newPage();mp.on('pageerror',error=>errors.push(error.message));await mp.goto(base);await mp.locator('#mode').filter({hasText:'规则检索模式'}).waitFor();
  for(const width of [360,390,430]){await mp.setViewportSize({width,height:844});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  checks.push('360、390、430像素宽无横向溢出');
  await mp.setViewportSize({width:390,height:844});await mp.screenshot({path:path.join(OUT,'mobile-setup.png'),fullPage:true,animations:'disabled'});
  await mp.locator('#experience').selectOption('familiar');await mp.locator('#players').selectOption('6');await mp.locator('#start-form button').click();assert.equal(await mp.locator('#explanation').innerText(),'结束时分数越低越好。');await mp.locator('#next').click();assert.match(await mp.locator('#setup-chips').innerText(),/每人9/);await mp.locator('#more').click();await mp.screenshot({path:path.join(OUT,'mobile-lesson.png'),fullPage:true,animations:'disabled'});checks.push('手机尺寸操作及熟手简版讲解');
  await mp.locator('#language').selectOption('en');assert.equal(await mp.locator('.brand-name').innerText(),'TableBuddy');assert.equal(await mp.locator('.brand-english').isVisible(),false);assert.ok(!(await mp.locator('.brand').innerText()).includes('开局搭子'));assert.ok(!(await mp.title()).includes('开局搭子'));assert.equal(await mp.locator('html').getAttribute('lang'),'en');assert.equal(await mp.locator('#step-title').innerText(),'Set up your table');assert.equal(await mp.locator('#example').isVisible(),true);assert.equal(await mp.locator('#setup-chips').innerText(),'6 players: 9 counters each.');checks.push('教学中切换英文保留步骤、人数和例子');
  for(const width of [360,390,430]){await mp.setViewportSize({width,height:844});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}checks.push('英文360、390、430像素宽无横向溢出');
  await mp.locator('#lesson-sources').evaluate(el=>{el.open=true;});assert.ok(!/[\u3400-\u9fff]/.test(await mp.locator('#source-list').innerText()));checks.push('教学规则出处完整切换英文');
  await mp.locator('#question').fill('Can I refuse with no counters?');await mp.locator('#ask').click();await mp.waitForFunction(()=>!document.querySelector('#answer').hidden);assert.match(await mp.locator('#answer-sources').innerText(),/must take/);assert.equal(await mp.locator('#answer-mode').innerText(),'Rule lookup · No model response');assert.ok(!/[\u3400-\u9fff]/.test(await mp.locator('#answer').innerText()));checks.push('英文问题返回英文提示与规则');
  await mp.reload();assert.equal(await mp.locator('#language').inputValue(),'en');await mp.locator('#restore').click();assert.equal(await mp.locator('#step-title').innerText(),'Set up your table');checks.push('刷新保留英文偏好和教学进度');
  await mp.route('**/api/assistant',route=>route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:'Too many requests. Please try again shortly.'})}));await mp.locator('#question').fill('Can I refuse?');await mp.locator('#ask').click();await mp.locator('#question-status').filter({hasText:'Too many requests'}).waitFor();checks.push('英文错误提示正确显示');await mp.unroute('**/api/assistant');
  await mp.route('**/api/assistant',async route=>{await new Promise(r=>setTimeout(r,200));try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'STALE RESPONSE',mode:'evidence',sources:[],needsHuman:true})});}catch(_) {}});await mp.locator('#ask').click();await mp.locator('#language').selectOption('zh');await mp.waitForTimeout(350);assert.equal(await mp.locator('#answer').isVisible(),false);assert.equal(await mp.locator('#ask').isDisabled(),false);assert.equal(await mp.locator('#step-title').innerText(),'准备好这一桌');checks.push('查询途中换语言不显示旧回复且可重新查询');await mp.unroute('**/api/assistant');
  await mp.locator('#language').selectOption('en');await mp.locator('#lesson-sources').evaluate(el=>{el.open=false;});await mp.setViewportSize({width:390,height:844});await mp.screenshot({path:path.join(OUT,'mobile-lesson-en.png'),fullPage:true,animations:'disabled'});
  const enContext=await browser.newContext({viewport:{width:1440,height:1000}});const ep=await enContext.newPage();ep.on('pageerror',error=>errors.push(error.message));await ep.goto(base);await ep.locator('#language').selectOption('en');await ep.screenshot({path:path.join(OUT,'desktop-en.png'),fullPage:true,animations:'disabled'});assert.ok(!/[\u3400-\u9fff]/.test((await ep.locator('body').innerText()).replace('中文','')));checks.push('英文首页无可见中文残留');await enContext.close();
  assert.deepEqual(errors,[]);checks.push('浏览器未捕获JavaScript运行错误');await mobile.close();
  fs.writeFileSync(path.join(OUT,'browser-checks.json'),JSON.stringify({date:'2026-10-27',environment:'桌面Chrome自动化及手机尺寸模拟，不是真机或微信内测试',checks,errors,modelMode:'evidence',liveModelTested:false},null,2));
  console.log(JSON.stringify({checks:checks.length,errors,screenshots:5,liveModelTested:false}));
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
