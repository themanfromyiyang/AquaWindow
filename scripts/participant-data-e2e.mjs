import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});
 await page.addInitScript(()=>{
  localStorage.setItem('aquawindow.experiment.records.v1',JSON.stringify(['ONE','TWO'].map((participant,index)=>({participant,environment:'paper',task:'comparison',technique:'standard',questionSet:0,questionIndex:0,response:index?'B':'A',correct:!index,seconds:10+index}))));
  localStorage.setItem('aquawindow.experiment.surveys.v1',JSON.stringify([{participant:'ONE',key:'paper:standard',environment:'paper',technique:'standard',label:'普通窗口',answers:Array(14).fill(4),submittedAt:'2026-11-08'}]));
 });
 await page.goto('http://127.0.0.1:5178/');
 await page.locator('.experiment-launcher').click();
 await page.getByRole('button',{name:'实验管理',exact:true}).click();
 await page.getByRole('button',{name:'收集数据',exact:true}).click();
 assert.equal(await page.locator('.experiment-participant-data').count(),2);
 const one=page.locator('[data-participant="ONE"]');
 await one.locator(':scope > summary').click();
 assert.ok(!(await one.innerText()).includes('TWO'));
 await one.getByText('查看评分',{exact:true}).click();
 assert.equal(await one.locator('.experiment-survey-detail li').count(),14);
 const download=page.waitForEvent('download');await one.getByRole('button',{name:'导出该被试数据'}).click();
 const data=JSON.parse(await readFile(await(await download).path(),'utf8'));
 assert.equal(data.participant.studentId,'ONE');
 assert.equal(data.stages.length,1);assert.equal(data.stages[0].participant,'ONE');
 assert.equal(data.surveys.length,1);
 console.log('PASS: participant cards isolate records and survey scores; individual export includes only selected participant');
}finally{await browser.close();}
