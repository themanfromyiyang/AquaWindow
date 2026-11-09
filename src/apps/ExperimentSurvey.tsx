import {useEffect,useRef} from 'react';
import {useStore} from '../system/createStore';
import {rateSurvey,submitSurvey,surveyComplete,surveyQuestions,surveyResponse,surveyScale,surveyStore,susQuestionCount,type SurveyTarget} from '../study/survey';
export default function ExperimentSurvey({participant,targets,onBack}:{participant:string;targets:SurveyTarget[];onBack:()=>void}){
 useStore(surveyStore,state=>state.responses);
 const target=targets.find(item=>!surveyComplete(participant,item.key));
 const page=useRef<HTMLDivElement>(null);
 useEffect(()=>{page.current?.scrollTo({top:0});},[target?.key,participant]);
 if(!target)return <div className="experiment-app experiment-complete"><span className="level-complete-mark">✓</span><h1>量表已完成</h1><button className="experiment-primary" onClick={onBack}>返回实验</button></div>;
 const response=surveyResponse(participant,target.key),answered=surveyQuestions.filter((_,index)=>response?.answers[index]!=null).length;
 const completeCount=targets.filter(mode=>surveyComplete(participant,mode.key)).length;
 return <div ref={page} className="experiment-app experiment-survey"><header><button type="button" aria-label="返回实验" onClick={onBack}>‹</button><span>交互体验量表</span></header><form className="experiment-survey-body" onSubmit={event=>{event.preventDefault();submitSurvey(participant,target.key);}}>
  <h1>{target.label}</h1><p className="experiment-survey-progress">形式 {completeCount+1}/{targets.length} · 已答 {answered}/{surveyQuestions.length}</p>
  <p className="experiment-survey-guide">请根据使用该交互方式的体验评分。1 = 非常不同意，5 = 非常同意。</p>
  {[{title:'系统可用性量表（SUS）',start:0,end:susQuestionCount},{title:'交互体验',start:susQuestionCount,end:surveyQuestions.length}].map(section=><section key={section.title} className="experiment-survey-section"><h2>{section.title}</h2>{surveyQuestions.slice(section.start,section.end).map((question,offset)=>{const item=section.start+offset;return <fieldset className="experiment-survey-item" key={item}><legend>{item+1}. {question}</legend><div className="experiment-survey-options">{surveyScale.map((label,index)=>{const value=index+1;return <label key={value}><input type="radio" name={target.key+'-'+item} value={value} aria-label={value+' '+label} checked={response?.answers[item]===value} onChange={()=>rateSurvey(participant,target,item,value)}/><span className="experiment-survey-circle" aria-hidden="true">{value}</span><span>{label}</span></label>})}</div></fieldset>;})}</section>)}
  <div className="experiment-survey-actions"><span aria-live="polite">{answered===surveyQuestions.length?'已全部填写':'还有 '+(surveyQuestions.length-answered)+' 题未填写'}</span><button type="submit" className="experiment-primary" disabled={answered!==surveyQuestions.length}>提交本形式</button></div>
 </form></div>;
}
