import {kernel,workArea} from '../system/kernel';
import {studyTaskStore} from './tasks';

// Reuse existing windows so PDF positions, browser pages and chat state survive.
export function arrangePaperWindows(){
 const task=studyTaskStore.get().current;
 const windows=kernel.list().filter(win=>win.appId==='study'&&win.props.taskId===task&&!win.minimized);
 if(!windows.length)return;
 const area=workArea(),gap=12,experiment=kernel.get('experiment');
 let width=area.w;
 if(experiment&&area.w-experiment.rect.w-gap>=720){
  width=area.w-experiment.rect.w-gap;
  kernel.setRect(experiment.id,{...experiment.rect,x:area.x+width+gap,y:area.y,h:Math.min(experiment.rect.h,area.h)},'system','study.question.layout');
 }
 const columns=windows.length>1?2:1,rows=Math.ceil(windows.length/columns);
 const w=(width-gap*(columns-1))/columns,h=(area.h-gap*(rows-1))/rows;
 for(const win of windows)kernel.setProps(win.id,{surfaceBonds:[],surfaceAnimating:undefined});
 kernel.apply(windows.map((win,index)=>({windowId:win.id,rect:{x:area.x+(index%columns)*(w+gap),y:area.y+Math.floor(index/columns)*(h+gap),w,h},group:null,form:'normal' as const})), 'system','study.question.layout');
}
