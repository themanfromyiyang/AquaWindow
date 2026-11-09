import {observeApp} from '../agent/adaptive/observations';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {kernel} from '../system/kernel';
import {DesktopAppIcon} from '../shell/DesktopAppIcon';

const root=`${import.meta.env.BASE_URL}study/attention-zh/`;
const pages=[
  {
    id:'transformer-video',
    site:'www.bilibili.com/video/BV1TZ421j7Ke/',
    title:'直观解释注意力机制，Transformer 的核心 · 3Blue1Brown 官方双语',
    url:'https://player.bilibili.com/player.html?bvid=BV1TZ421j7Ke&autoplay=0&danmaku=0',
    keywords:'transformer 原理 讲解 视频 注意力 多头 b站 bilibili 3blue1brown BV1TZ421j7Ke',
  },
  {
    id:'google-research',
    site:'research.google',
    title:'Transformer: A Novel Neural Network Architecture for Language Understanding · Google Research',
    url:root+'transformer-google-research.html',
    keywords:'transformer google research novel neural network architecture language understanding 介绍 自注意力',
  },
  {
    id:'arxiv',
    site:'arxiv.org/abs/1706.03762',
    title:'Attention Is All You Need · arXiv',
    url:root+'attention-arxiv.html',
    keywords:'attention is all you need arxiv 1706.03762 transformer paper 论文',
  },
] as const;
type SavedBrowser={draft:string;query:string;selectedId:string|null;scroll:number};
const browserState=new Map<string,SavedBrowser>();
kernel.onEvent(event=>{if(event.type==='reset')browserState.clear();});
export function copyStudyBrowserState(sourceId:string,copyId:string){
  const state=browserState.get(sourceId);
  if(state)browserState.set(copyId,{...state});
}

export default function StudyBrowser({windowId}:{windowId:string}){
  const [draft,setDraft]=useState(()=>browserState.get(windowId)?.draft??'');
  const [query,setQuery]=useState(()=>browserState.get(windowId)?.query??'');
  const [selected,setSelected]=useState<(typeof pages)[number]|null>(()=>pages.find(page=>page.id===browserState.get(windowId)?.selectedId)??null);
  const detach=useRef<(()=>void)|null>(null),frameRef=useRef<HTMLIFrameElement|null>(null);
  const [forward,setForward]=useState<(typeof pages)[number]|null>(null);
  useEffect(()=>{browserState.set(windowId,{draft,query,selectedId:selected?.id??null,scroll:browserState.get(windowId)?.scroll??0});},[windowId,draft,query,selected]);
  useEffect(()=>()=>detach.current?.(),[]);
  const onFrameLoad=(frame:HTMLIFrameElement)=>{
    detach.current?.();
    try{
      const view=frame.contentWindow;if(!view)return;
      const text=frame.contentDocument?.body?.innerText??'';observeApp(windowId,{kind:'web',availability:text?'content':'metadata-only',title:frame.title,text:text.slice(0,2800),documentId:frame.src});
      const scroll=browserState.get(windowId)?.scroll??0;
      requestAnimationFrame(()=>view.scrollTo(0,scroll));
      const remember=()=>{const state=browserState.get(windowId);if(state)browserState.set(windowId,{...state,scroll:view.scrollY});};
      view.addEventListener('scroll',remember,{passive:true});
      detach.current=()=>view.removeEventListener('scroll',remember);
    }catch{/* A browser may block scroll access to an external page. */}
  };
  const search=(event:FormEvent)=>{
    event.preventDefault();
    detach.current?.();setForward(null);
    if(/^(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/BV1TZ421j7Ke\/?(?:[?#].*)?$/i.test(draft.trim())){
      const page=pages.find(item=>item.id==='transformer-video')!;
      setQuery('Transformer 讲解视频');setSelected(page);
      browserState.set(windowId,{draft:draft.trim(),query:'Transformer 讲解视频',selectedId:page.id,scroll:0});
      return;
    }
    if(/^(?:https?:\/\/)?(?:www\.)?arxiv\.org\/(?:abs|pdf)\/1706\.03762(?:v\d+)?(?:\.pdf)?\/?(?:[?#].*)?$/i.test(draft.trim())){
      const page=pages.find(item=>item.id==='arxiv')!;
      setQuery('Attention Is All You Need arXiv');setSelected(page);
      browserState.set(windowId,{draft:draft.trim(),query:'Attention Is All You Need arXiv',selectedId:page.id,scroll:0});
      return;
    }
    setQuery(draft.trim());
    setSelected(null);
    browserState.set(windowId,{draft,query:draft.trim(),selectedId:null,scroll:0});
  };
  const tokens=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results=tokens.length?pages.filter(page=>{
    const haystack=`${page.title} ${page.site} ${page.keywords}`.toLocaleLowerCase();
    return tokens.every(token=>haystack.includes(token));
  }):[];
  useEffect(()=>{observeApp(windowId,{title:selected?.title??'浏览器',kind:'web',documentId:selected?.url,selection:query,availability:selected?'loading':query?'content':'empty',text:selected?`当前页面：${selected.title}`:query?`搜索：${query}\n结果：${results.map(r=>r.title).join('；')}`:'浏览器未打开页面，也没有搜索结果。'});},[windowId,query,selected]);
  const open=(page:(typeof pages)[number])=>{detach.current?.();setForward(null);browserState.set(windowId,{draft:page.site,query,selectedId:page.id,scroll:0});setDraft(page.site);setSelected(page);};
  const back=()=>{if(selected){detach.current?.();setForward(selected);setSelected(null);setDraft(query);}};
  const ahead=()=>{if(forward){setSelected(forward);setDraft(forward.site);setForward(null);}};
  return <div className="study-browser">
    <form className="study-browser-bar" onSubmit={search}>
      <button className="browser-nav" type="button" aria-label="后退" disabled={!selected} onClick={back}><img src={`${import.meta.env.BASE_URL}harmony/back.svg`} alt=""/></button>
      <button className="browser-nav" type="button" aria-label="前进" disabled={!forward} onClick={ahead}><img src={`${import.meta.env.BASE_URL}harmony/forward.svg`} alt=""/></button>
      <div className="browser-address"><img className="browser-address-mark" src={`${import.meta.env.BASE_URL}harmony/search.svg`} alt=""/><input aria-label="搜索网页" value={draft} onChange={event=>setDraft(event.target.value)} placeholder="搜索或输入网址"/>{selected&&selected.id!=='transformer-video'&&<span className="browser-offline">离线副本</span>}</div>
      <button className="browser-search" type="submit" aria-label="搜索">↵</button>
    </form>
    {selected?.id==='transformer-video'?<>
      <div className="study-video-source"><span>{selected.title}</span><a href={'https://'+selected.site} target="_blank" rel="noopener noreferrer">在 B 站打开</a></div>
      <iframe key={selected.id} src={selected.url} title={selected.title} sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
    </>:selected?<iframe ref={frameRef} key={selected.id} src={selected.url} title={selected.title} sandbox="allow-same-origin" referrerPolicy="no-referrer" onLoad={event=>onFrameLoad(event.currentTarget)}/>:<div className="study-browser-results">
      {!query?<div className="study-browser-empty"><DesktopAppIcon id="browser"/></div>:results.length?results.map(page=><button type="button" key={page.id} onClick={()=>open(page)}><small>{page.site}</small><strong>{page.title}</strong></button>):<p className="study-browser-no-results">没有找到与“{query}”匹配的网页。</p>}
    </div>}
  </div>;
}
