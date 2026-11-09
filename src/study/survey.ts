import {createStore} from '../system/createStore';
import {paperModeOptions} from './assignments';
import type {ExperimentRecord} from './flow';
import {fileLayoutModes,type StudyEnvironment} from './workspaces';

export const surveyScale=['非常不同意','不同意','一般','同意','非常同意'] as const;
export const surveyQuestions=[
 '我愿意频繁使用这个交互方式',
 '我觉得这个交互方式不必要地复杂',
 '我认为这个交互方式容易使用',
 '我觉得需要他人帮助才能使用该交互方式',
 '我觉得这个交互里各项功能整合得很好',
 '我觉得这个交互存在很多不一致的地方',
 '我能想象大部分人可以很快学会这个交互方式',
 '我觉得这个交互使用起来很麻烦',
 '使用这个交互的时候我觉得很自信',
 '在使用前我需要学习很多东西才能上手',
 '该交互方式支持我高效地在多个内容之间对照对比',
 '在该交互下，我能清晰区分主要内容和辅助参考内容',
 '该交互的操作方式符合我的直觉，不容易出错',
 '整体上，该交互方式能够适配我当前的任务需求',
] as const;
export const susQuestionCount=10;
export type SurveyTarget={key:string;environment:StudyEnvironment;technique:string;label:string};
export type SurveyResponse={participant:string;key:string;environment:StudyEnvironment;technique:string;label:string;answers:(number|null)[];submittedAt?:string};
const storageKey='aquawindow.experiment.surveys.v1';
function load():SurveyResponse[]{
 try{
  const saved=JSON.parse(localStorage.getItem(storageKey)??'[]');
  if(!Array.isArray(saved))return [];
  return saved.filter(item=>item&&typeof item.participant==='string'&&typeof item.key==='string'&&Array.isArray(item.answers)).map(item=>{
   const answers=Array.from({length:surveyQuestions.length},(_,index)=>{const value=item.answers[index];return Number.isInteger(value)&&value>=1&&value<=5?value:null;});
   return {...item,answers,submittedAt:answers.every(answer=>answer!==null)&&typeof item.submittedAt==='string'?item.submittedAt:undefined} as SurveyResponse;
  });
 }catch{return []}
}
export const surveyStore=createStore<{responses:SurveyResponse[]}>({responses:load()});
export function surveyTargets(records:ExperimentRecord[],participant:string,completed:StudyEnvironment[]):SurveyTarget[]{
 const seen=new Set<string>(),targets:SurveyTarget[]=[];
 for(const record of records){
  if(record.participant!==participant||!completed.includes(record.environment)||!record.technique||record.technique==='standard')continue;
  const key=`${record.environment}:${record.technique}`;
  if(seen.has(key))continue;
  const label=record.environment==='paper'?paperModeOptions.find(mode=>mode.id===record.technique)?.label:fileLayoutModes.find(mode=>mode.id===record.technique)?.label;
  if(!label)continue;
  seen.add(key);targets.push({key,environment:record.environment,technique:record.technique,label});
 }
 return targets;
}
export function surveyResponse(participant:string,key:string){return surveyStore.get().responses.find(item=>item.participant===participant&&item.key===key);}
export function surveyComplete(participant:string,key:string){return !!surveyResponse(participant,key)?.submittedAt;}
export function rateSurvey(participant:string,target:SurveyTarget,index:number,value:number){
 if(!participant||index<0||index>=surveyQuestions.length||!Number.isInteger(value)||value<1||value>5)return;
 const responses=[...surveyStore.get().responses],found=responses.findIndex(item=>item.participant===participant&&item.key===target.key);
 const previous=found>=0?responses[found]:{participant,key:target.key,environment:target.environment,technique:target.technique,label:target.label,answers:Array(surveyQuestions.length).fill(null)} as SurveyResponse;
 if(previous.submittedAt)return;
 const answers=[...previous.answers];answers[index]=value;
 const response={...previous,answers};
 if(found>=0)responses[found]=response;else responses.push(response);
 surveyStore.set({responses});localStorage.setItem(storageKey,JSON.stringify(responses));
}
export function submitSurvey(participant:string,key:string){
 const responses=[...surveyStore.get().responses],index=responses.findIndex(item=>item.participant===participant&&item.key===key);
 if(index<0||responses[index].submittedAt||responses[index].answers.length!==surveyQuestions.length||responses[index].answers.some(answer=>typeof answer!=='number'||!Number.isInteger(answer)||answer<1||answer>5))return false;
 responses[index]={...responses[index],submittedAt:new Date().toISOString()};
 surveyStore.set({responses});localStorage.setItem(storageKey,JSON.stringify(responses));return true;
}
export function clearSurveyResponses(){localStorage.removeItem(storageKey);surveyStore.set({responses:[]});}
