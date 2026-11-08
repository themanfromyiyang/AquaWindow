import {createStore} from '../system/createStore';
import {studyTasks,type StudyTaskId} from './tasks';

export const questionsPerSet=2;
export type ChoiceLetter='A'|'B'|'C'|'D';
export type PaperChoiceQuestion={kind:'choice';prompt:string;options:[string,string,string,string];answer:ChoiceLetter};
export type PaperQuestion=string|PaperChoiceQuestion;
export type PaperQuestionSet=[PaperQuestion,PaperQuestion];

type QuestionSets=Record<StudyTaskId,PaperQuestionSet[]>;
const storageKey='aquawindow.experiment.paper-questions.v3';
const legacyKey='aquawindow.experiment.paper-questions.v1';
const blank=():PaperQuestionSet=>['',''];
const choice=(prompt:string,options:[string,string,string,string],answer:ChoiceLetter):PaperChoiceQuestion=>({kind:'choice',prompt,options,answer});

export const comparisonSetInfo=[
 {title:'编码器与解码器',section:'3.1 Encoder and Decoder Stacks'},
 {title:'多头注意力机制',section:'3.2 Attention'},
 {title:'位置编码与输出预测',section:'3.4 Embeddings and Softmax / 3.5 Positional Encoding'},
] as const;

export const comparisonQuestionSets:PaperQuestionSet[]=[
 [
  choice('根据文字，解码器比编码器多出的注意力子层，在架构图中位于哪个模块的上方？',['Masked Multi-Head Attention','Feed Forward','Linear','Input Embedding'],'A'),
  choice('根据文字，负责防止模型提前获取后续位置信息的模块，在架构图中位于哪一侧？',['左侧编码器','右侧解码器','顶部输出层','两个部分都有'],'B'),
 ],
 [
  choice('根据文字，负责从多个表示空间关注信息的机制，在 Figure 1 中位于编码器 Feed Forward 模块的哪个方向？',['上方','下方','右侧','不在编码器中'],'B'),
  choice('根据文字，解码器中用于关注编码器输出的注意力模块，在图中直接接收来自哪一侧结构的连接？',['左侧编码器','顶部 Softmax','底部 Output Embedding','右侧 Linear'],'A'),
 ],
 [
  choice('根据文字，负责为序列提供位置信息的结构，在架构图中分别与哪两个模块的输出相加？',['Input Embedding 和 Output Embedding','两个 Feed Forward','Linear 和 Softmax','两个 Add & Norm'],'A'),
  choice('根据文字，负责将解码器输出转换为下一个词的概率分布的操作，在图中紧接哪个模块之后？',['Masked Multi-Head Attention','Input Embedding','Linear','Feed Forward'],'C'),
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
  choice(bilingualPrompt('3.3','虽然线性变换在不同位置上是相同的，但它们在层与层之间使用不同的参数。'),[
   'The transformations use different parameters at each position and share parameters across layers.',
   'The transformations share parameters across both positions and layers.',
   'The transformations use different parameters across both positions and layers.',
   'While the linear transformations are the same across different positions, they use different parameters from layer to layer.',
  ],'D'),
 ],
 [
  choice(bilingualPrompt('3.5','为此，我们在编码器和解码器堆栈底部的输入嵌入中添加了“位置编码”。'),[
   'To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks.',
   'Positional encodings replace input embeddings at the bottoms of both stacks.',
   'Positional encodings are added to output features at the tops of both stacks.',
   'Positional encodings are added to input embeddings only in the encoder stack.',
  ],'A'),
  choice(bilingualPrompt('3.5','我们选择正弦版本是因为它可能允许模型推广到训练中遇到的序列长度之外的序列长度。'),[
   'The sinusoidal version guarantees correct predictions for sequences of any length.',
   'The sinusoidal version limits the model to sequence lengths encountered during training.',
   'We chose the sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training.',
   'The sinusoidal version was chosen because it removes the need to train on sequences.',
  ],'C'),
 ],
 [
  choice(bilingualPrompt('5.1','我们在标准 WMT 2014 英语—德语数据集上训练，该数据集包含约 450 万个句子对。'),[
   'Training used the WMT 2014 English-French dataset with about 4.5 million sentence pairs.',
   'We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs.',
   'Training used the WMT 2014 English-German dataset with about 4.5 million individual tokens.',
   'Training used the WMT 2014 English-German dataset with about 36 million sentence pairs.',
  ],'B'),
  choice(bilingualPrompt('5.1','每个训练批次包含约 25000 个源词元和 25000 个目标词元的句子对集合。'),[
   'Each batch contained about 25,000 sentence pairs, regardless of their token counts.',
   'Each batch contained about 25,000 tokens in total across source and target sequences.',
   'Each sentence pair contained about 25,000 source tokens and 25,000 target tokens.',
   'Each training batch contained a set of sentence pairs containing approximately 25000 source tokens and 25000 target tokens.',
  ],'D'),
 ],
];

export function isChoiceQuestion(question:PaperQuestion):question is PaperChoiceQuestion{return typeof question==='object'&&question?.kind==='choice';}
export const externalSetInfo=[
 {title:'引用来源与研究动机',section:'主论文 3.2.1 / 引用文献摘要与引言'},
 {title:'对齐机制与上下文',section:'主论文 3.2.1 / 引用文献 3.1'},
 {title:'模型结构与注意力计算',section:'主论文 3.2.1 / 引用文献 3'},
] as const;
export const externalQuestionSets:PaperQuestionSet[]=[
 [
  choice('主论文第 3.2.1 节用引用 [2] 介绍加性注意力。打开对应文献后，哪一项正确对应了该文献的题名和研究内容？',['Attention Is All You Need：首次提出循环编码器','Neural Machine Translation by Jointly Learning to Align and Translate：联合学习对齐与翻译','Neural Machine Translation by Jointly Learning to Align and Translate：只研究图像分类','Attention Is All You Need：使用固定长度向量替代注意力'],'B'),
  choice('阅读引用文献的摘要与引言，再回到主论文的注意力说明。引用文献希望缓解的主要问题是什么？',['词汇表无法包含标点符号','解码器不能生成不同长度的输出','所有模型都必须使用卷积','把整个源句压缩为单个固定长度向量会形成信息瓶颈'],'D'),
 ],
 [
  choice('主论文描述加性注意力用前馈网络计算匹配程度。对照引用文献第 3.1 节，其对齐模型的分数主要依据哪两项信息？',['前一个解码器隐藏状态与源句位置的注释向量','两个随机选择的目标词','整篇训练语料的平均长度与词汇表大小','当前位置编码与最终 BLEU 分数'],'A'),
  choice('对照引用文献第 3.1 节公式 (5)，再回到主论文第 3.2 节的注意力说明。哪一项正确描述引用文献的上下文向量？',['将所有源句注释向量直接拼接','只取源句最后一个位置的注释向量','根据注意力权重对源句注释向量加权求和','对源句注释向量进行无权重的最大池化'],'C'),
 ],
 [
  choice('主论文采用 Transformer，而引用文献第 3 节介绍了另一种编码器。打开引用文献核对后，哪一项是其编码器结构？',['仅由前馈层构成的编码器','双向循环神经网络','Transformer 多头自注意力编码器','单向卷积编码器'],'B'),
  choice('阅读引用文献第 3.1 节并返回主论文第 3.2.1 节，哪一项正确区分了引用文献的加性注意力与主论文的缩放点积注意力？',['两者都只选择一个源词，不计算权重','两者都依赖卷积计算匹配分数','加性注意力使用点积除以维度；缩放点积注意力使用循环网络','加性注意力通过前馈网络计算匹配分数；缩放点积注意力使用查询与键的点积并按维度缩放'],'D'),
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
  choice('待核对的 AI 回答：“解码器中间的注意力子层，其查询、键和值都来自编码器。”对照第 3.2.3 节，哪一项修正正确？',['查询来自解码器，键和值来自编码器输出','查询来自编码器，键和值来自解码器','查询和键来自编码器，值来自位置编码','三者都来自最终的 Softmax 输出'],'A'),
 ],
 [
  choice('待核对的 AI 回答：“位置编码与词嵌入拼接，因此输入维度加倍。”结合图 1 和第 3.5 节，哪一项修正正确？',['位置编码只添加到输出概率','位置编码替代词嵌入','位置编码与词嵌入相乘，使维度减半','位置编码与词嵌入维度相同，二者相加'],'D'),
  choice('待核对的 AI 回答：“解码器先经过 Softmax，再经过 Linear，得到词汇概率。”结合图 1 和第 3.4 节，哪一项修正正确？',['先经过 Linear，再经过位置编码','先经过 Linear，再经过 Softmax','先经过 Softmax，再经过 Input Embedding','直接由前馈网络输出概率，无需 Linear 和 Softmax'],'B'),
 ],
 [
  choice('待核对的 AI 回答：“前馈网络只有解码器才有，并在不同位置使用不同的参数。”结合图 1 和第 3.3 节，哪一项修正正确？',['两侧都有前馈网络，同一层在不同位置使用相同变换','只有编码器有前馈网络，所有层共享参数','两侧都有前馈网络，同一层每个位置使用不同参数','只有解码器有前馈网络，所有位置和层共享参数'],'A'),
  choice('待核对的 AI 回答：“Add & Norm 表示先归一化子层输入，再把结果送进子层，不包含残差连接。”结合图 1 和第 3.1 节，哪一项修正正确？',['只归一化输入，不进行相加','先归一化输出，再丢弃子层输入','将子层输入与子层输出相加，再进行层归一化','将相邻两个子层的权重相加，再进行归一化'],'C'),
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
   const pair=stored[index],defaults=prepared[index];
   return [0,1].map(item=>task==='bilingual'&&isChoiceQuestion(pair?.[item])&&questionPrompt(pair[item]).includes('选择与下面中文论述含义一致的英文表述')?defaults?.[item]??'':pair?.[item]===undefined||typeof pair[item]==='string'&&!pair[item].trim()||task==='bilingual'&&typeof pair[item]==='string'&&pair[item].includes('对应的完整英文句子，并复制到答题框')?defaults?.[item]??'':normalizeQuestion(pair[item])) as PaperQuestionSet;
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
