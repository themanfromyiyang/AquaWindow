import {afterEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({mode:'sync-scroll',windows:[{id:'zh',appId:'study',group:'surface:pair',rect:{x:0}},{id:'en',appId:'study',group:'surface:pair',rect:{x:500}}]}));
vi.mock('../system/kernel',()=>({kernel:{get:(id:string)=>state.windows.find(win=>win.id===id),list:()=>state.windows}}));
vi.mock('../system/ui',()=>({ui:{get:()=>({experimentOpen:true,studyEnvironment:'paper',studyMode:state.mode})}}));
vi.mock('./logger',()=>({log:vi.fn()}));
import {syncFusedPdfScroll} from './syncScroll';
function reader(height:number,count=2){return {scrollTop:0,scrollHeight:height*count,clientHeight:200,querySelectorAll:()=>Array.from({length:count},(_,index)=>({offsetTop:index*height,offsetHeight:height,dataset:{page:String(index+1)}}))} as unknown as HTMLDivElement;}
function setup(zh:HTMLDivElement,en:HTMLDivElement){vi.stubGlobal('CSS',{escape:(s:string)=>s});vi.stubGlobal('document',{querySelector:(s:string)=>s.includes('"en"')?en:zh});}
afterEach(()=>{vi.unstubAllGlobals();state.mode='sync-scroll';});
it('syncs either direction by page position and suppresses mirrored feedback',()=>{
 const zh=reader(1000),en=reader(800);setup(zh,en);
 zh.scrollTop=1250;syncFusedPdfScroll('zh',zh);expect(en.scrollTop).toBe(1000);
 syncFusedPdfScroll('en',en);expect(zh.scrollTop).toBe(1250);
 en.scrollTop=1200;syncFusedPdfScroll('en',en);expect(zh.scrollTop).toBe(1500);
 syncFusedPdfScroll('zh',zh);expect(en.scrollTop).toBe(1200);
 // User input arriving before the mirrored event must still become the new source.
 en.scrollTop=400;syncFusedPdfScroll('en',en);
 zh.scrollTop=700;syncFusedPdfScroll('zh',zh);expect(en.scrollTop).toBe(560);
});
it('syncs unequal page counts proportionally and leaves other modes alone',()=>{
 const zh=reader(1000,2),en=reader(1000,3);setup(zh,en);
 en.scrollTop=1400;syncFusedPdfScroll('en',en);expect(zh.scrollTop).toBe(900);
 state.mode='fusion';en.scrollTop=2000;syncFusedPdfScroll('en',en);expect(zh.scrollTop).toBe(900);
});
