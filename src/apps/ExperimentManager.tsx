import {clearExperimentData} from '../study/clearExperimentData';
import {surveyStore,surveyQuestions,surveyScale,susQuestionCount,type SurveyResponse} from '../study/survey';
import {useState} from 'react';
import {useStore} from '../system/createStore';
import {assignmentStore,fileTaskIds,paperModeOptions,paperSequence,paperSetIndex,paperTaskIds,type ParticipantAssignment} from '../study/assignments';
import {isChoiceQuestion,paperQuestionStore,questionPrompt,setPaperAnswer,setPaperOption,setPaperQuestion,type ChoiceLetter,type PaperQuestion} from '../study/paperQuestions';
import {studyTasks} from '../study/tasks';
import {STUDY_TASKS} from './data/studies';
import {experimentFlow} from '../study/flow';
import {fileLayoutModes,fileTaskStore} from '../study/workspaces';
import {learningHistory,onboarding} from '../study/onboarding';

function downloadJson(name:string,value:unknown){
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function PaperQuestionEditor({task,setIndex,questionIndex,question,disabled}:{task:keyof typeof studyTasks;setIndex:number;questionIndex:number;question:PaperQuestion;disabled:boolean}){
 const label=`${studyTasks[task].label} 题目组 ${String.fromCharCode(65+setIndex)} 题目 ${questionIndex+1}`;
 return <div className="experiment-question-editor"><label>{`题目 ${questionIndex+1}`}<textarea aria-label={label} value={questionPrompt(question)} placeholder="待填写" disabled={disabled} onChange={event=>setPaperQuestion(task,setIndex,questionIndex,event.target.value)} rows={2}/></label>
  {isChoiceQuestion(question)&&<div className="experiment-choice-editor">{question.options.map((option,optionIndex)=><label key={optionIndex}>{String.fromCharCode(65+optionIndex)}<input aria-label={`${label} 选项 ${String.fromCharCode(65+optionIndex)}`} value={option} disabled={disabled} onChange={event=>setPaperOption(task,setIndex,questionIndex,optionIndex,event.target.value)}/></label>)}<label>正确答案<select aria-label={`${label} 正确答案`} value={question.answer} disabled={disabled} onChange={event=>setPaperAnswer(task,setIndex,questionIndex,event.target.value as ChoiceLetter)}>{['A','B','C','D'].map(letter=><option key={letter} value={letter}>{letter}</option>)}</select></label></div>}
 </div>;
}

function SurveyDataTable({responses}:{responses:SurveyResponse[]}){
 return <><h2>交互体验量表</h2><div className="experiment-table-scroll"><table className="experiment-data-table"><thead><tr><th>学号</th><th>场景</th><th>交互形式</th><th>进度</th></tr></thead><tbody>{responses.map(response=><tr key={`${response.participant}-${response.key}`}><td>{response.participant}</td><td>{response.environment==='paper'?'论文阅读':'文件管理'}</td><td>{response.label}</td><td>{response.submittedAt?'已提交':`${response.answers.filter(answer=>answer!=null).length}/${surveyQuestions.length}`}</td></tr>)}</tbody></table>{responses.length===0&&<p className="experiment-empty">暂无量表记录。</p>}</div></>;
}

export default function ExperimentManager({onClose}:{onClose:()=>void}){
 const {participants,eligibility}=useStore(assignmentStore,state=>state),flow=useStore(experimentFlow,state=>state),file=useStore(fileTaskStore,state=>state),current=useStore(onboarding,state=>state);
 const surveys=useStore(surveyStore,state=>state.responses);
 const questionSets=useStore(paperQuestionStore,state=>state.sets);
 const {byParticipant:learning,skips}=useStore(learningHistory,state=>state);
 const [tab,setTab]=useState<'assignments'|'data'>('assignments'),[filter,setFilter]=useState('all'),[message,setMessage]=useState(''),[confirmClear,setConfirmClear]=useState(false);
 const hasCollectedData=participants.some(person=>!person.pending)||flow.records.length>0||file.results.length>0||surveys.length>0||Object.keys(learning).length>0||Object.keys(skips).length>0;
 const participantLabel=(person:ParticipantAssignment)=>person.pending?`待定被试 ${String(person.group).padStart(2,'0')}`:person.name||person.studentId;
 const stageRecords=flow.records.filter(record=>filter==='all'||record.participant===filter),fileRecords=file.results.filter(record=>filter==='all'||record.participant===filter);
 const locked=(id:string,environment:'paper'|'files',task:string)=>flow.records.some(record=>record.participant===id&&record.environment===environment&&record.task===task)||
  id===current.studentId&&flow.stageRunning&&environment==='paper'&&paperTaskIds[flow.levels.paper]===task||
  environment==='files'&&file.results.some(record=>record.participant===id&&record.task===task)||
  id===current.studentId&&environment==='files'&&file.running&&file.current===task;
 return <div className="experiment-app experiment-manager">
  <header className="experiment-manager-header"><button type="button" onClick={onClose} aria-label="返回实验入口">←</button><h1>实验管理</h1></header>
  <nav className="experiment-manager-tabs" aria-label="实验管理页面"><button className={tab==='assignments'?'active':''} onClick={()=>setTab('assignments')}>交互分配</button><button className={tab==='data'?'active':''} onClick={()=>setTab('data')}>收集数据</button></nav>
  {tab==='assignments'?<>
   <p className="experiment-manager-note">每个论文任务固定三种交互形式，每种形式对应两道题。系统按分配组轮换体验顺序与题目组，交互形式不可更改。</p>
   <h2>固定交互形式</h2>
   <div className="experiment-eligibility-list">{paperTaskIds.map(task=>{const taskLocked=participants.some(person=>locked(person.studentId,'paper',task));return <details key={task} data-eligibility-task={task}><summary>论文阅读 · {studyTasks[task].label}<span>{eligibility.paper[task].length} 种 · {eligibility.paper[task].length} 组题</span></summary><div className="experiment-eligibility-options">{eligibility.paper[task].map(mode=><span key={mode}>{paperModeOptions.find(option=>option.id===mode)?.label}</span>)}</div><div className="experiment-question-sets"><p>每组两道题；题目组不固定绑定交互形式。</p>{eligibility.paper[task].map((_,setIndex)=><div className="experiment-question-set" key={setIndex}><strong>题目组 {String.fromCharCode(65+setIndex)}</strong>{[0,1].map(questionIndex=><PaperQuestionEditor key={questionIndex} task={task} setIndex={setIndex} questionIndex={questionIndex} question={questionSets[task][setIndex]?.[questionIndex]??''} disabled={taskLocked}/>)}</div>)}</div></details>})}
    {fileTaskIds.map(task=><details key={task} data-eligibility-task={task}><summary>文件管理 · {STUDY_TASKS.find(item=>item.id===task)?.title}<span>{eligibility.files[task].length} 种</span></summary><div className="experiment-eligibility-options">{eligibility.files[task].map(mode=><span key={mode}>{fileLayoutModes.find(option=>option.id===mode)?.label}</span>)}</div></details>)}</div>
   <h2>论文阅读分配表</h2><div className="experiment-table-scroll"><table className="experiment-data-table experiment-assignment-table"><thead><tr><th>参与者 · 分配组</th>{paperTaskIds.map(id=><th key={id}>{studyTasks[id].label}</th>)}</tr></thead><tbody>{participants.map(person=><tr key={person.slotId}><th>{participantLabel(person)}<small>{person.pending?'信息待定':person.studentId} · 第 {person.group} 组</small></th>{paperTaskIds.map(id=><td key={id}><div className="experiment-paper-sequence">{paperSequence(id,person.group).map((mode,index)=><span key={`${mode}-${index}`}>{paperModeOptions.find(option=>option.id===mode)?.label} · {String.fromCharCode(65+paperSetIndex(id,mode,person.group))}</span>)}</div></td>)}</tr>)}</tbody></table></div>
   <h2>文件管理分配表</h2><div className="experiment-table-scroll"><table className="experiment-data-table experiment-assignment-table"><thead><tr><th>参与者 · 分配组</th>{fileTaskIds.map(id=><th key={id}>{STUDY_TASKS.find(task=>task.id===id)?.title}</th>)}</tr></thead><tbody>{participants.map(person=><tr key={person.slotId}><th>{participantLabel(person)}<small>{person.pending?'信息待定':person.studentId} · 第 {person.group} 组</small></th>{fileTaskIds.map(id=><td key={id}><span>{fileLayoutModes.find(option=>option.id===person.files[id])?.label}</span></td>)}</tr>)}</tbody></table></div>
  </>:<>
   <p className="experiment-manager-note">此浏览器已记录 {flow.records.length} 道正式题、{file.results.length} 条文件提交。数据保存在本机浏览器中。</p>
   <div className="experiment-data-actions"><label>参与者 <select aria-label="筛选参与者" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">全部</option>{participants.filter(person=>!person.pending).map(person=><option key={person.slotId} value={person.studentId}>{participantLabel(person)} · {person.studentId}</option>)}</select></label><button onClick={()=>downloadJson('aquawindow-study-data.json',{exportedAt:new Date().toISOString(),eligibility,questionSets,assignments:participants,learningResults:learning,learningSkips:skips,stages:flow.records,fileResults:file.results,surveyDefinition:{scale:surveyScale,susQuestionCount,questions:surveyQuestions},surveys})}>导出全部数据</button></div>
   <div className="experiment-clear-data"><button type="button" disabled={!hasCollectedData} onClick={()=>setConfirmClear(true)}>清空已收集数据</button>{confirmClear&&<div role="group" aria-label="确认清空实验数据"><p>删除本机的参与者信息、掌握测试、正式实验和量表记录。题目与固定交互配置保留。</p><div><button type="button" onClick={()=>setConfirmClear(false)}>取消</button><button type="button" className="confirm" onClick={()=>{clearExperimentData();setFilter('all');setConfirmClear(false);setMessage('已清空收集数据');}}>确认清空</button></div></div>}{message&&<p role="status" className="experiment-manager-status">{message}</p>}</div>
   <h2>掌握效果测试</h2><div className="experiment-table-scroll"><table className="experiment-data-table"><thead><tr><th>学号</th><th>状态</th><th>已通过</th><th>总用时</th></tr></thead><tbody>{participants.filter(person=>!person.pending&&(filter==='all'||person.studentId===filter)).map(person=><tr key={person.slotId}><td>{person.studentId}</td><td>{learning[person.studentId]?.length===7?'已通过':skips[person.studentId]?'已跳过':'进行中'}</td><td>{learning[person.studentId]?.length??0} / 7</td><td>{(learning[person.studentId]??[]).reduce((sum,item)=>sum+item.seconds,0).toFixed(1)} 秒</td></tr>)}</tbody></table></div>
   <h2>正式实验记录</h2><div className="experiment-table-scroll"><table className="experiment-data-table"><thead><tr><th>学号</th><th>场景</th><th>题目</th><th>交互形式</th><th>题目组 / 小题</th><th>用时</th></tr></thead><tbody>{stageRecords.map((record,index)=><tr key={`${record.participant}-${record.environment}-${record.task}-${index}`}><td>{record.participant}</td><td>{record.environment==='paper'?'论文阅读':'文件管理'}</td><td>{record.environment==='paper'?(studyTasks[record.task as keyof typeof studyTasks]?.label??(record.task==='citation'?'引用来源（旧题）':record.task)):STUDY_TASKS.find(task=>task.id===record.task)?.title}</td><td>{record.environment==='paper'?paperModeOptions.find(option=>option.id===record.technique)?.label:fileLayoutModes.find(option=>option.id===record.technique)?.label}</td><td>{record.questionSet===undefined?'—':`${String.fromCharCode(65+record.questionSet)} / ${Number(record.questionIndex)+1}`}</td><td>{record.seconds} 秒</td></tr>)}</tbody></table>{stageRecords.length===0&&<p className="experiment-empty">暂无正式实验记录。</p>}</div>
   <SurveyDataTable responses={surveys.filter(response=>filter==='all'||response.participant===filter)}/>
   <h2>文件提交</h2><div className="experiment-table-scroll"><table className="experiment-data-table"><thead><tr><th>学号</th><th>题目</th><th>结果</th><th>用时</th><th>提交文件</th></tr></thead><tbody>{fileRecords.map((record,index)=><tr key={`${record.participant}-${record.task}-${index}`}><td>{record.participant}</td><td>{STUDY_TASKS.find(task=>task.id===record.task)?.title}</td><td>{record.correct?'正确':'未命中'}</td><td>{record.seconds} 秒</td><td>{record.file}</td></tr>)}</tbody></table>{fileRecords.length===0&&<p className="experiment-empty">暂无文件提交。</p>}</div>
  </>}
 </div>;
}
