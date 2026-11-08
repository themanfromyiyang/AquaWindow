import fixedAssignments from './fixedAssignments.json';
import {createStore} from '../system/createStore';
import {studyTasks,type StudyTaskId} from './tasks';
import {STUDY_TASKS,type StudyTaskId as FileTaskId} from '../apps/data/studies';
import {studyInteractionModes,type StudyInteractionModeId} from './interactionModes';
import type {FileLayoutMode} from './workspaces';

export type AssignedPaperMode=StudyInteractionModeId|'standard';
export interface ParticipantAssignment{
 slotId:string;
 studentId:string;
 name:string;
 pending:boolean;
 group:number;
 paper:Record<StudyTaskId,AssignedPaperMode>;
 files:Record<FileTaskId,FileLayoutMode>;
 createdAt:string;
}

const storageKey='aquawindow.experiment.assignments.v1';

export const paperTaskIds=Object.keys(studyTasks) as StudyTaskId[];
export const fileTaskIds=STUDY_TASKS.map(task=>task.id);
export const plannedParticipantCount=3;
export const paperModeOptions=[{id:'standard' as const,label:'普通窗口'},...studyInteractionModes];
export type Eligibility={paper:Record<StudyTaskId,AssignedPaperMode[]>;files:Record<FileTaskId,FileLayoutMode[]>};
const rotation=(group:number,taskIndex:number,count:number)=>(group-1+taskIndex)%count;
export function paperSequence(task:StudyTaskId,group:number):AssignedPaperMode[]{
 const choices=assignmentStore.get().eligibility.paper[task];
 const start=rotation(group,paperTaskIds.indexOf(task),choices.length);
 return choices.map((_,index)=>choices[(start+index)%choices.length]);
}
export function paperSetIndex(task:StudyTaskId,mode:AssignedPaperMode,group:number):number{
 const choices=assignmentStore.get().eligibility.paper[task];
 return (choices.indexOf(mode)+group-1+choices.length)%choices.length;
}
function loadEligibility():Eligibility{
 return structuredClone(fixedAssignments.eligibility) as Eligibility;
}

function assignmentForGroup(group:number,eligibility:Eligibility){
 const paper=Object.fromEntries(paperTaskIds.map((task,index)=>{const choices=eligibility.paper[task];return [task,choices[rotation(group,index,choices.length)]]})) as ParticipantAssignment['paper'];
 const files=Object.fromEntries(fileTaskIds.map((task,index)=>{const choices=eligibility.files[task];return [task,choices[rotation(group,index,choices.length)]]})) as ParticipantAssignment['files'];
 return {paper,files};
}
function makePendingSlot(group:number,eligibility:Eligibility):ParticipantAssignment{
 return {slotId:`slot-${group}`,studentId:'',name:'',pending:true,group,...assignmentForGroup(group,eligibility),createdAt:new Date().toISOString()};
}
function loadAssignments(eligibility:Eligibility):ParticipantAssignment[]{
 try{
  const value=JSON.parse(localStorage.getItem(storageKey)??'[]');
  const participants:ParticipantAssignment[]=Array.isArray(value)?value.filter(item=>item&&typeof item.studentId==='string'&&item.paper&&item.files).map((item:ParticipantAssignment,index:number)=>{
   const group=Number.isInteger(item.group)&&item.group>0?item.group:index+1;
   return {...item,slotId:item.slotId||`slot-${index+1}`,pending:item.pending===true||!item.studentId.trim(),group,
    paper:assignmentForGroup(group,eligibility).paper,
    files:assignmentForGroup(group,eligibility).files};
  }):[];
  while(participants.length>plannedParticipantCount){
   const pendingIndex=participants.findLastIndex(person=>person.pending);
   if(pendingIndex<0)break;
   participants.splice(pendingIndex,1);
  }
  while(participants.length<plannedParticipantCount)participants.push(makePendingSlot(participants.length+1,eligibility));
  localStorage.setItem(storageKey,JSON.stringify(participants));
  return participants;
 }catch{return Array.from({length:plannedParticipantCount},(_,index)=>makePendingSlot(index+1,eligibility))}
}
const initialEligibility=loadEligibility();
export const assignmentStore=createStore({participants:loadAssignments(initialEligibility),eligibility:initialEligibility});
function save(participants:ParticipantAssignment[]){assignmentStore.set({participants});localStorage.setItem(storageKey,JSON.stringify(participants));}
export function assignmentFor(studentId:string){const id=studentId.trim();return id?assignmentStore.get().participants.find(item=>!item.pending&&item.studentId===id):undefined;}
export function ensureAssignment(studentId:string,name=''){
 const id=studentId.trim();if(!id)return null;
 const existing=assignmentFor(id);
 if(existing){
  if(name.trim()&&name.trim()!==existing.name)save(assignmentStore.get().participants.map(item=>item.studentId===id?{...item,name:name.trim()}:item));
  return assignmentFor(id)!;
 }
 const participants=assignmentStore.get().participants;
 const pending=participants.find(item=>item.pending);
 if(pending){save(participants.map(item=>item.slotId===pending.slotId?{...item,studentId:id,name:name.trim(),pending:false}:item));return assignmentFor(id)!;}
 const group=Math.max(0,...participants.map(item=>item.group))+1;
 const eligibility=assignmentStore.get().eligibility;
 const assignment:ParticipantAssignment={slotId:`slot-${group}`,studentId:id,name:name.trim(),pending:false,group,...assignmentForGroup(group,eligibility),createdAt:new Date().toISOString()};
 save([...participants,assignment]);return assignment;
}
