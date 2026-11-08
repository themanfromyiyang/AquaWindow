import {useState} from 'react';
import {useStore} from '../system/createStore';
import {rateSurvey,submitSurvey,surveyComplete,surveyQuestions,surveyResponse,surveyScale,surveyStore,susQuestionCount,type SurveyTarget} from '../study/survey';

function firstUnanswered(participant:string,target:SurveyTarget|undefined){
 if(!target)return 0;
 const answers=surveyResponse(participant,target.key)?.answers??[];
 const next=answers.findIndex((answer,index)=>index<surveyQuestions.length&&answer==null);
 return next<0?Math.min(answers.length,surveyQuestions.length-1):next;
}

export default function ExperimentSurvey({participant,targets,onBack}:{participant:string;targets:SurveyTarget[];onBack:()=>void}){
 useStore(surveyStore,state=>state.responses);
 const target=targets.find(item=>!surveyComplete(participant,item.key));
 const [position,setPosition]=useState(()=>({key:target?.key??'',index:firstUnanswered(participant,target)}));
 const item=position.key===target?.key?position.index:firstUnanswered(participant,target);
 const setItem=(index:number)=>setPosition({key:target?.key??'',index});
 if(!target)return <div className="experiment-app experiment-complete"><span className="level-complete-mark">✓</span><h1>量表已完成</h1><button className="experiment-primary" onClick={onBack}>返回实验</button></div>;
 const response=surveyResponse(participant,target.key),answer=response?.answers[item]??null,completeCount=targets.filter(mode=>surveyComplete(participant,mode.key)).length;
 const last=item===surveyQuestions.length-1,allAnswered=surveyQuestions.every((_,index)=>response?.answers[index]!=null);
 const advance=()=>{
  if(!last){setItem(item+1);return;}
  if(!submitSurvey(participant,target.key))return;
  const next=targets.find(mode=>!surveyComplete(participant,mode.key));
  setPosition({key:next?.key??'',index:firstUnanswered(participant,next)});
 };
 return <div className="experiment-app experiment-survey"><header><button type="button" aria-label="返回实验" onClick={onBack}>‹</button><span>交互体验量表</span></header><div className="experiment-survey-body">
  <h1>{target.label}</h1><p className="experiment-survey-progress">形式 {completeCount+1}/{targets.length} · 题目 {item+1}/{surveyQuestions.length}</p>
  <p className="experiment-survey-section">{item<susQuestionCount?'系统可用性量表（SUS）':'交互体验'}</p>
  <p className="experiment-survey-question">{surveyQuestions[item]}</p>
  <div className="experiment-survey-options" role="radiogroup" aria-label={surveyQuestions[item]}>{surveyScale.map((label,index)=>{const value=index+1;return <label key={value} className={answer===value?'selected':''}><input type="radio" name={`survey-${target.key}-${item}`} checked={answer===value} onChange={()=>rateSurvey(participant,target,item,value)}/><strong>{value}</strong><span>{label}</span></label>})}</div>
  <div className="experiment-survey-actions"><button type="button" disabled={item===0} onClick={()=>setItem(item-1)}>上一题</button><button type="button" className="experiment-primary" disabled={last?!allAnswered:answer==null} onClick={advance}>{last?'提交本形式':'下一题'}</button></div>
 </div></div>;
}
