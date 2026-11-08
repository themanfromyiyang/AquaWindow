import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const browser=await chromium.launch({channel:process.env.AW_BROWSER??'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});
 page.setDefaultTimeout(30000);
 await page.goto(process.env.AW_URL??'http://127.0.0.1:5178/');
 await page.locator('.experiment-launcher').click();
 await page.getByRole('button',{name:'实验管理',exact:true}).click();
 const task=page.locator('details[data-eligibility-task="comparison"]');await task.locator('summary').click();
 await page.getByRole('textbox',{name:'图文对照 题目组 A 题目 1',exact:true}).fill('保留的题目配置');
 await page.getByRole('button',{name:'返回实验入口'}).click();
 await page.getByRole('textbox',{name:'姓名',exact:true}).fill('清空测试');
 await page.getByRole('textbox',{name:'学号',exact:true}).fill('CLEAR-001');
 await page.getByRole('button',{name:'进入教学'}).click();
 await page.getByRole('button',{name:'进入掌握效果测试'}).click();
 await page.getByRole('button',{name:'跳过掌握测试'}).click();
 await page.evaluate(()=>{
  localStorage.setItem('aquawindow.experiment.records.v1',JSON.stringify([{participant:'CLEAR-001',environment:'paper',task:'comparison',seconds:4}]));
  localStorage.setItem('aquawindow.file-studies.results.v1',JSON.stringify([{participant:'CLEAR-001',task:'task1',seconds:3}]));
  localStorage.setItem('aquawindow.experiment.learning.v1',JSON.stringify({'CLEAR-001':[{mode:'peel',seconds:2}]}));
  localStorage.setItem('aquawindow.experiment.surveys.v1',JSON.stringify([{participant:'CLEAR-001',key:'paper:peel',answers:[4]}]));
 });
 await page.reload();
 await page.locator('.experiment-launcher').click();
 await page.getByRole('button',{name:'实验管理',exact:true}).click();
 await page.getByRole('button',{name:'收集数据'}).click();
 assert.match(await page.locator('.experiment-manager-note').last().innerText(),/1 道正式题、1 条文件提交/);
 await page.getByRole('button',{name:'清空已收集数据'}).click();
 assert.ok(await page.evaluate(()=>localStorage.getItem('aquawindow.experiment.records.v1')));
 await page.getByRole('button',{name:'取消'}).click();
 assert.ok(await page.evaluate(()=>localStorage.getItem('aquawindow.experiment.records.v1')));
 await page.getByRole('button',{name:'清空已收集数据'}).click();
 await page.getByRole('button',{name:'确认清空'}).click();
 const state=await page.evaluate(async()=>({
  records:localStorage.getItem('aquawindow.experiment.records.v1'),
  files:localStorage.getItem('aquawindow.file-studies.results.v1'),
  learning:localStorage.getItem('aquawindow.experiment.learning.v1'),
  skips:localStorage.getItem('aquawindow.experiment.learning-skips.v1'),
  surveys:localStorage.getItem('aquawindow.experiment.surveys.v1'),
  participants:JSON.parse(localStorage.getItem('aquawindow.experiment.assignments.v1')??'[]'),
  eligibility:(await import('/src/study/assignments.ts')).assignmentStore.get().eligibility.paper.comparison,
  question:JSON.parse(localStorage.getItem('aquawindow.experiment.paper-questions.v3')??'{}').comparison[0][0].prompt,
 }));
 assert.deepEqual([state.records,state.files,state.learning,state.skips,state.surveys],[null,null,null,null,null]);
 assert.equal(state.participants.length,3);
 assert.ok(state.participants.every(person=>person.pending&&person.studentId===''));
 assert.deepEqual(state.eligibility,['standard','screenshot','figure-pin']);
 assert.equal(state.question,'保留的题目配置');
 assert.equal(await page.getByRole('button',{name:'清空已收集数据'}).isDisabled(),true);
 console.log('PASS: clear requires confirmation, removes collected records, restores empty slots, and preserves task configuration');
}finally{await browser.close();}
