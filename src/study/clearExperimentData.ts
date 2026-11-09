import {clearParticipantAssignments} from './assignments';
import {selectStudyMode} from './conditions';
import {experimentFlow} from './flow';
import {clearRememberedParticipantInfo,clearLearningWindows,learningHistory,onboarding} from './onboarding';
import {fileTaskStore,resetStudyWorkspaces,switchStudyEnvironment} from './workspaces';
import {ui} from '../system/ui';
import {clearSurveyResponses} from './survey';

// Reset collected results and claimed participants while preserving task configuration.
export function clearExperimentData(){
 for(const key of [
  'aquawindow.experiment.records.v1',
  'aquawindow.file-studies.results.v1',
  'aquawindow.experiment.learning.v1',
  'aquawindow.experiment.learning-skips.v1',
 ])localStorage.removeItem(key);
 clearSurveyResponses();
 clearRememberedParticipantInfo();
 clearParticipantAssignments();
 learningHistory.set({byParticipant:{},skips:{}});
 switchStudyEnvironment('paper');
 clearLearningWindows();
 resetStudyWorkspaces();
 selectStudyMode(null);
 experimentFlow.set({view:'hub',levels:{paper:0,files:0},paperRound:0,paperItem:0,stageRunning:false,startedAt:0,logStart:0,records:[],paperDrafts:{}});
 fileTaskStore.set({current:'task1',participant:'P01',layoutMode:null,mode:null,mainDocumentId:'task1-a',candidateOrder:[],running:false,submitted:false,startedAt:0,results:[]});
 onboarding.set({stage:'profile',name:'',studentId:'',question:0,records:[],masterySkipped:false,testMode:false});
 ui.set({participant:'P01'});
}
