import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';

const browser=await chromium.launch({channel:process.env.AW_BROWSER??'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});
 page.setDefaultTimeout(30000);
 await page.goto(process.env.AW_URL??'http://127.0.0.1:5178/');
 await page.locator('.experiment-launcher').click();
 await page.getByRole('textbox',{name:'姓名',exact:true}).fill('量表测试');
 await page.getByRole('textbox',{name:'学号',exact:true}).fill('SURVEY-001');
 await page.getByRole('button',{name:'进入教学'}).click();
 await page.getByRole('button',{name:'进入掌握效果测试'}).click();
 await page.getByRole('button',{name:'跳过掌握测试'}).click();
 await page.evaluate(async()=>{
  const f=await import('/src/study/flow.ts');
  f.experimentFlow.set({view:'complete',levels:{paper:4,files:3},records:[
   {participant:'SURVEY-001',environment:'paper',task:'comparison',technique:'peel',seconds:1,selfReported:true,events:[]},
   {participant:'SURVEY-001',environment:'files',task:'task1',technique:'parallel',seconds:1,selfReported:false,events:[]},
  ]});
 });
 assert.match(await page.locator('.experiment-survey').innerText(),/掀角查看/);
 assert.equal(await page.locator('.experiment-survey-item').count(),14);
 const rows=await page.locator('.experiment-survey-item').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {x:r.x,top:r.top,bottom:r.bottom};}));
 assert.ok(rows.every((row,index)=>row.x===rows[0].x&&(index===0||row.top>=rows[index-1].bottom)));
 assert.equal(await page.getByRole('button',{name:'提交本形式'}).isDisabled(),true);
 await page.locator('.experiment-survey-item').first().locator('label').nth(3).click();
 await page.getByRole('button',{name:'返回实验'}).click();
 await page.locator('.experiment-survey-launch').click();
 assert.match(await page.locator('.experiment-survey-progress').innerText(),/已答 1\/14/);
 const circles=await page.locator('.experiment-survey-item').first().locator('.experiment-survey-circle').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 assert.ok(circles.every(circle=>circle.y===circles[0].y&&circle.width===circle.height));
 for(let item=1;item<14;item++)await page.locator('.experiment-survey-item').nth(item).locator('label').nth(3).click();
 await page.getByRole('button',{name:'提交本形式'}).click();
 assert.match(await page.locator('.experiment-survey').innerText(),/并列呈现/);
 assert.equal(await page.locator('.experiment-survey').evaluate(node=>node.scrollTop),0);
 for(let item=0;item<14;item++)await page.locator('.experiment-survey-item').nth(item).locator('label').nth(2).click();
 await page.getByRole('button',{name:'提交本形式'}).click();
 assert.equal(await page.getByRole('heading',{name:'量表已完成'}).count(),1);
 const responses=await page.evaluate(()=>JSON.parse(localStorage.getItem('aquawindow.experiment.surveys.v1')??'[]'));
 assert.deepEqual(responses.map(item=>[item.key,item.answers.length,!!item.submittedAt]),[['paper:peel',14,true],['files:parallel',14,true]]);
 assert.ok(responses[0].answers.every(value=>value===4));
 assert.ok(responses[1].answers.every(value=>value===3));
 await page.getByRole('button',{name:'返回实验'}).click();
 await page.getByRole('button',{name:/实验管理/}).click();
 await page.getByRole('button',{name:'收集数据'}).click();
 await page.locator('[data-participant="SURVEY-001"] > summary').click();
 assert.equal(await page.locator('.experiment-data-table').filter({has:page.getByRole('columnheader',{name:'进度'})}).locator('tbody tr').count(),2);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出全部数据'}).click()]);
 const exported=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(exported.surveys.length,2);
 console.log('PASS: survey follows completed scenarios, saves and resumes 14 answers per used form, and appears in management');
}finally{await browser.close();}
