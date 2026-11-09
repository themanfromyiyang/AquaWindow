import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const expected=JSON.parse(await readFile(new URL('../src/study/fixedAssignments.json',import.meta.url),'utf8')).eligibility;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.addInitScript(()=>localStorage.setItem('aquawindow.experiment.eligibility.v1',JSON.stringify({paper:{comparison:['peel']},files:{task1:['primary-secondary']}})));
 await page.goto(process.env.AW_URL??'http://127.0.0.1:5178/');
 await page.locator('.experiment-launcher').click();
 await page.getByRole('button',{name:'实验管理',exact:true}).click();
 assert.equal(await page.locator('.experiment-manager input[type=checkbox], .experiment-assignment-table select').count(),0);
 assert.equal(await page.getByRole('button',{name:'重新生成文件管理分配'}).count(),0);
 const actual=await page.evaluate(async()=>{const m=await import('/src/study/assignments.ts');return {eligibility:m.assignmentStore.get().eligibility,sequence:m.paperSequence('comparison',1),participants:m.assignmentStore.get().participants};});
 assert.deepEqual(actual.eligibility,expected);
 assert.deepEqual(actual.sequence,['standard','screenshot','figure-pin']);
 assert.equal(actual.participants[0].files.task1,'parallel');
 const questions=await page.evaluate(async()=>{const m=await import('/src/study/paperQuestions.ts');return Object.values(m.paperQuestionStore.get().sets);});
 assert.equal(questions.length,4);
 for(const sets of questions){assert.equal(sets.length,3);for(const set of sets){assert.equal(set.length,1);for(const question of set){assert.equal(question.kind,'choice');assert.equal(question.options.length,4);assert.ok(['A','B','C','D'].includes(question.answer));}}}
 const next=await page.evaluate(async()=>{const o=await import('/src/study/onboarding.ts'),f=await import('/src/study/flow.ts');o.onboarding.set({stage:'ready',testMode:true});f.chooseExperiment('paper');f.beginPaperLevel();f.finishPaperQuestion('A');return f.experimentFlow.get();});
 assert.equal(next.paperRound,1);assert.equal(next.paperItem,0);
 console.log('PASS: exported fixed configuration overrides old browser choices; assignment controls are absent');
}finally{await browser.close();}
