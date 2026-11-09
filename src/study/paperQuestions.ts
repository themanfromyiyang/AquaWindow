import {createStore} from '../system/createStore';
import {studyTasks,type StudyTaskId} from './tasks';

export const questionsPerSet=1;
export type ChoiceLetter='A'|'B'|'C'|'D';
export type PaperChoiceQuestion={kind:'choice';prompt:string;options:[string,string,string,string];answer:ChoiceLetter};
export type PaperQuestion=string|PaperChoiceQuestion;
export type PaperQuestionSet=[PaperQuestion];

type QuestionSets=Record<StudyTaskId,PaperQuestionSet[]>;
const storageKey='aquawindow.experiment.paper-questions.v3';
const legacyKey='aquawindow.experiment.paper-questions.v1';
const blank=():PaperQuestionSet=>[''];
const choice=(prompt:string,options:[string,string,string,string],answer:ChoiceLetter):PaperChoiceQuestion=>({kind:'choice',prompt,options,answer});

export const comparisonSetInfo=[
 {title:'编码器与解码器',section:'3.1 Encoder and Decoder Stacks'},
 {title:'多头注意力机制',section:'3.2.2 Multi-Head Attention'},
 {title:'位置编码',section:'3.5 Positional Encoding'},
] as const;

export const comparisonQuestionSets:PaperQuestionSet[]=[
 [
  choice('阅读 第 3.1 节：编码器和解码器堆栈（Encoder and Decoder Stacks），并参照图 1（Figure 1）。\n\n根据文字，解码器比编码器多出的注意力子层，在架构图中位于哪个模块的上方？',['Masked Multi-Head Attention','Feed Forward','Linear','Input Embedding'],'A'),

 ],
 [
  choice('阅读 第 3.2.2 节：多头注意力（Multi-Head Attention），并参照图 1（Figure 1）。\n\n根据文字，负责从多个表示空间关注信息的机制，在 Figure 1 中位于编码器 Feed Forward 模块的哪个方向？',['上方','下方','右侧','不在编码器中'],'B'),

 ],
 [
  choice('阅读 第 3.5 节：位置编码（Positional Encoding），并参照图 1（Figure 1）。\n\n根据文字，负责为序列提供位置信息的结构，在架构图中分别与哪两个模块的输出相加？',['Input Embedding 和 Output Embedding','两个 Feed Forward','Linear 和 Softmax','两个 Add & Norm'],'A'),

 ],
];

export const bilingualSetInfo=[
 {title:'注意力与前馈网络',section:'3.2.2 Multi-Head Attention / 3.3 Position-wise Feed-Forward Networks'},
 {title:'位置编码',section:'3.5 Positional Encoding'},
 {title:'训练数据与批处理',section:'5.1 Training Data and Batching'},
] as const;
const bilingualPrompt=(section:string,text:string)=>`在英文论文第 ${section} 节中找到下面中文论述对应的原句，选择与英文原文完全一致的选项。\n\n“${text}”`;
export const bilingualQuestionSets:PaperQuestionSet[]=[
 [
  choice(bilingualPrompt('3.2.2','多头注意力允许模型在不同位置同时关注来自不同表示子空间的信息。'),[
   'Multi-head attention attends to the same representation subspace at every position.',
   'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.',
   'Multi-head attention attends to different representation subspaces at only one position.',
   'Multi-head attention processes each representation subspace without combining information.',
  ],'B'),

 ],
 [
  choice(bilingualPrompt('3.5','为此，我们在编码器和解码器堆栈底部的输入嵌入中添加了“位置编码”。'),[
   'To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks.',
   'Positional encodings replace input embeddings at the bottoms of both stacks.',
   'Positional encodings are added to output features at the tops of both stacks.',
   'Positional encodings are added to input embeddings only in the encoder stack.',
  ],'A'),

 ],
 [
  choice(bilingualPrompt('5.1','我们在标准 WMT 2014 英语—德语数据集上训练，该数据集包含约 450 万个句子对。'),[
   'Training used the WMT 2014 English-French dataset with about 4.5 million sentence pairs.',
   'We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs.',
   'Training used the WMT 2014 English-German dataset with about 4.5 million individual tokens.',
   'Training used the WMT 2014 English-German dataset with about 36 million sentence pairs.',
  ],'B'),

 ],
];

export function isChoiceQuestion(question:PaperQuestion|undefined):question is PaperChoiceQuestion{return typeof question==='object'&&question?.kind==='choice';}
export const externalSetInfo=[
 {title:'掩码与双向编码',section:'视频 11:08–12:42 / 主论文 3.2.3 / 引用文献 3.2'},
 {title:'跨语言的信息匹配',section:'视频 18:21–19:19 / 主论文 3.2.1、3.2.3 / 引用文献 3.1'},
 {title:'加权汇总与上下文',section:'视频 13:10–15:44 / 主论文 3.2.1 / 引用文献 3.1'},
] as const;
const videoQuestion=(range:string,section:string,prompt:string)=>`在桌面浏览器搜索“Transformer 讲解视频”，打开 3Blue1Brown《直观解释注意力机制，Transformer 的核心》（BV1TZ421j7Ke），观看 ${range}。\n\n在主论文参考文献中找到 [2] Neural Machine Translation by Jointly Learning to Align and Translate，并从“文件”打开该文献。查阅${section}，再返回主论文核对并作答。\n\n${prompt}`;
const legacyExternalPrompts=[
 '主论文第 3.2.1 节用引用 [2] 介绍加性注意力。打开对应文献后，哪一项正确对应了该文献的题名和研究内容？',
 '主论文描述加性注意力用前馈网络计算匹配程度。对照引用文献第 3.1 节，其对齐模型的分数主要依据哪两项信息？',
 '主论文采用 Transformer，而引用文献第 3 节介绍了另一种编码器。打开引用文献核对后，哪一项是其编码器结构？',
];
export const externalQuestionSets:PaperQuestionSet[]=[
 [
  choice(videoQuestion('11:08–12:42（掩码）','引用文献第 3.2 节及主论文第 3.2.3 节','视频强调生成时不能提前使用未来词语，而引用文献采用双向 RNN 编码器。结合两篇论文，为什么这并不矛盾？'),['双向 RNN 只能读取源句中当前位置之前的词语','双向编码器读取已给定的完整源句；因果限制针对尚未生成的目标词语','掩码要求源句和目标句都只能从右向左读取','引用文献的双向编码器也会读取尚未生成的目标词语'],'B'),

 ],
 [
  choice(videoQuestion('18:21–19:19（交叉注意力）','引用文献第 3.1 节及主论文第 3.2.1、3.2.3 节','视频用两种语言解释跨序列的信息匹配。主论文引用 [2] 介绍加性注意力；在该引用文献中，哪两项信息被用于计算源位置与当前目标位置的对齐分数？'),['前一个解码器隐藏状态与源句该位置的注释向量','两个源词的编号，与解码器状态无关','尚未生成的目标词与源句总长度','两个随机初始化且不随输入变化的向量'],'A'),

 ],
 [
  choice(videoQuestion('13:10–15:44（值矩阵）','引用文献第 3.1 节公式 (5)–(6) 及主论文第 3.2.1 节','视频展示了按注意力权重汇总值向量。对照主论文的加权求和说明与引用文献，后者为每个目标词构造上下文向量时采用了哪种方式？'),['选中权重最大的一个源位置，其余位置直接丢弃','对源句注释向量按当前目标位置的对齐权重加权求和','为所有目标词重复使用同一个固定的源句平均向量','将所有尚未生成的目标词向量拼接起来'],'B'),

 ],
];
export const answerSetInfo=[
 {title:'掩码与信息来源',section:'Figure 1 / 3.1 / 3.2.3'},
 {title:'位置编码与输出',section:'Figure 1 / 3.4 / 3.5'},
 {title:'前馈网络与残差连接',section:'Figure 1 / 3.1 / 3.3'},
] as const;
export const answerQuestionSets:PaperQuestionSet[]=[
 [
  choice('待核对的 AI 回答：“编码器和解码器的自注意力都使用掩码，以避免看到未来位置。”结合图 1 和第 3.1 节，哪一项修正正确？',['只有编码器使用这种掩码','两者都不使用这种掩码','解码器自注意力使用这种掩码，编码器自注意力不作这种限制','两者的前馈网络使用掩码，自注意力不使用'],'C'),

 ],
 [
  choice('待核对的 AI 回答：“位置编码与词嵌入拼接，因此输入维度加倍。”结合图 1 和第 3.5 节，哪一项修正正确？',['位置编码只添加到输出概率','位置编码替代词嵌入','位置编码与词嵌入相乘，使维度减半','位置编码与词嵌入维度相同，二者相加'],'D'),

 ],
 [
  choice('待核对的 AI 回答：“前馈网络只有解码器才有，并在不同位置使用不同的参数。”结合图 1 和第 3.3 节，哪一项修正正确？',['两侧都有前馈网络，同一层在不同位置使用相同变换','只有编码器有前馈网络，所有层共享参数','两侧都有前馈网络，同一层每个位置使用不同参数','只有解码器有前馈网络，所有位置和层共享参数'],'A'),

 ],
];
export function questionPrompt(question:PaperQuestion):string{return isChoiceQuestion(question)?question.prompt:question;}
export function paperSetContext(task:StudyTaskId,index:number){return ({comparison:comparisonSetInfo,bilingual:bilingualSetInfo,external:externalSetInfo,answer:answerSetInfo}[task])[index]??null;}
function normalizeQuestion(value:unknown):PaperQuestion{
 if(typeof value==='string')return value;
 if(!value||typeof value!=='object')return '';
 const item=value as Partial<PaperChoiceQuestion>;
 if(item.kind!=='choice'||!Array.isArray(item.options)||item.options.length!==4||!['A','B','C','D'].includes(item.answer??''))return '';
 return choice(String(item.prompt??''),item.options.map(option=>String(option)) as PaperChoiceQuestion['options'],item.answer as ChoiceLetter);
}
function load():QuestionSets{
 let saved:Partial<QuestionSets>={},legacy:Partial<Record<StudyTaskId,[string,string][]>>={};
 try{saved=JSON.parse(localStorage.getItem(storageKey)??'{}')}catch{/* Use prepared questions. */}
 try{legacy=JSON.parse(localStorage.getItem(legacyKey)??'{}')}catch{/* Keep other tasks empty. */}
 return Object.fromEntries((Object.keys(studyTasks) as StudyTaskId[]).map(task=>{
  const stored=Array.isArray(saved[task])?saved[task]!:task==='comparison'?[]:Array.isArray(legacy[task])?legacy[task]!:[];
  const prepared={comparison:comparisonQuestionSets,bilingual:bilingualQuestionSets,external:externalQuestionSets,answer:answerQuestionSets}[task];
  const count=Math.max(stored.length,prepared.length);
  const sets=Array.from({length:count},(_,index)=>{
   const pair=stored[index]?[...stored[index]]:undefined,defaults=prepared[index];
   if(task==='external'&&pair&&defaults&&legacyExternalPrompts.includes(questionPrompt(pair[0]??'')))pair[0]=defaults[0];
   if(task==='external'&&pair&&defaults&&questionPrompt(pair[0]??'').includes('，然后返回《Attention Is All You Need》第 ')&&questionPrompt(pair[0]??'').includes('BV1TZ421j7Ke'))pair[0]=defaults[0];
   if(task==='comparison'&&pair&&pair[0]!==undefined&&isChoiceQuestion(pair[0])&&defaults&&isChoiceQuestion(defaults[0])&&defaults[0].prompt.endsWith('\n\n'+pair[0].prompt))pair[0]={...pair[0],prompt:defaults[0].prompt};
   return [0].map(item=>task==='bilingual'&&isChoiceQuestion(pair?.[item])&&questionPrompt(pair[item]).includes('选择与下面中文论述含义一致的英文表述')?defaults?.[item]??'':pair?.[item]===undefined||typeof pair[item]==='string'&&!pair[item].trim()||task==='bilingual'&&typeof pair[item]==='string'&&pair[item].includes('对应的完整英文句子，并复制到答题框')?defaults?.[item]??'':normalizeQuestion(pair[item])) as PaperQuestionSet;
  });
  return [task,sets];
 })) as QuestionSets;
}
export const paperQuestionStore=createStore<{sets:QuestionSets}>({sets:load()});
export function paperQuestionSet(task:StudyTaskId,index:number):PaperQuestionSet{return paperQuestionStore.get().sets[task][index]??blank();}
export function paperQuestionSetReady(task:StudyTaskId,index:number){return paperQuestionSet(task,index).every(question=>questionPrompt(question).trim().length>0&&(!isChoiceQuestion(question)||question.options.every(option=>option.trim().length>0)));}
export function paperTaskReady(task:StudyTaskId,setCount:number){return Array.from({length:setCount},(_,index)=>paperQuestionSetReady(task,index)).every(Boolean);}
function updateQuestion(task:StudyTaskId,setIndex:number,questionIndex:number,update:(question:PaperQuestion)=>PaperQuestion){
 if(!Number.isInteger(setIndex)||setIndex<0||questionIndex<0||questionIndex>=questionsPerSet)return;
 const sets={...paperQuestionStore.get().sets},taskSets=[...sets[task]];
 taskSets[setIndex]=[...(taskSets[setIndex]??blank())] as PaperQuestionSet;
 taskSets[setIndex][questionIndex]=update(taskSets[setIndex][questionIndex]);
 sets[task]=taskSets;paperQuestionStore.set({sets});localStorage.setItem(storageKey,JSON.stringify(sets));
}
export function setPaperQuestion(task:StudyTaskId,setIndex:number,questionIndex:number,text:string){
 updateQuestion(task,setIndex,questionIndex,question=>isChoiceQuestion(question)?{...question,prompt:text}:text);
}
export function setPaperOption(task:StudyTaskId,setIndex:number,questionIndex:number,optionIndex:number,text:string){
 if(optionIndex<0||optionIndex>3)return;
 updateQuestion(task,setIndex,questionIndex,question=>{
  if(!isChoiceQuestion(question))return question;
  const options=[...question.options] as PaperChoiceQuestion['options'];options[optionIndex]=text;return {...question,options};
 });
}
export function setPaperAnswer(task:StudyTaskId,setIndex:number,questionIndex:number,answer:ChoiceLetter){
 updateQuestion(task,setIndex,questionIndex,question=>isChoiceQuestion(question)?{...question,answer}:question);
}
