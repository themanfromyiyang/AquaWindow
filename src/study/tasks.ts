import { createStore } from '../system/createStore';
import { kernel } from '../system/kernel';

export type StudyTaskId = 'comparison' | 'bilingual' | 'external' | 'answer';
export type StudyResource = { id: string; title: string; url: string; kind: 'pdf' | 'image' };
export type StudyAnswerExample = { question: string; sentences: string[]; requireImage?: boolean; image?: {name:string;url:string}; followUps?: {question:string;sentences:string[]}[] };

const studyRoot = `${import.meta.env.BASE_URL}study/`;
const attentionRoot = studyRoot + 'attention-zh/';
const attentionZh = { id: 'pdf', title: 'Attention Is All You Need 中文版.pdf', url: attentionRoot + 'Attention-Is-All-You-Need-zh.pdf', kind: 'pdf' } as const;

export const studyTasks: Record<StudyTaskId, {
  label: string;
  switchLabel: string;
  title: string;
  description: string;
  steps: string[];
  resources: StudyResource[];
  qaExample?: StudyAnswerExample;
  bilingualPrompt?: {chinese:string;english:string};
}> = {
  comparison: {
    label: '图文对照',
    switchLabel: '图文对照',
    title: '图文对照',
    description: '请完成两组内容对照：',
    steps: ['第 3 节的模型架构说明与图 1 Transformer 架构图。', '第 4 节提到的附录注意力可视化与附录图 3。'],
    resources: [
      attentionZh,
      { id: 'methodology', title: '模型架构说明.png', url: studyRoot + 'attention-zh/model-description.png', kind: 'image' },
      { id: 'architecture', title: '图1 Transformer 架构图.png', url: studyRoot + 'attention-zh/architecture.png', kind: 'image' },
      { id: 'appendix-reference', title: '正文提及附录部分.png', url: studyRoot + 'attention-zh/appendix-reference.png', kind: 'image' },
      { id: 'appendix', title: '附录图3 注意力可视化.png', url: studyRoot + 'attention-zh/appendix-visualization.png', kind: 'image' },
    ],
  },
  bilingual: {
    label: '中英对照',
    switchLabel: '中英对照',
    title: '临时中英对照',
    description: '根据中文论述，在英文论文中找到对应原句，选择与英文原文完全一致的选项。',
    steps: ['从文件打开中文版和英文版论文，找到对应段落。', '核对英文原句的具体措辞，完成本套一道单选题。'],
    bilingualPrompt:{chinese:'编码器由 N = 6 个相同的层堆栈组成。每一层有两个子层。',english:'The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers.'},
    resources: [
      { id: 'chinese-pdf', title: 'Attention Is All You Need 中文版.pdf', url: attentionRoot + 'Attention-Is-All-You-Need-zh.pdf', kind: 'pdf' },
      { id: 'english-pdf', title: 'Attention Is All You Need 英文版.pdf', url: attentionRoot + 'Attention-Is-All-You-Need-en.pdf', kind: 'pdf' },
    ],
  },
  external: {
    label: '外部材料与引用来源',
    switchLabel: '外部材料与引用来源',
    title: '打开外部材料并返回引用来源',
    description: '观看指定视频片段，查阅主论文引用的原始文献，再返回主论文核对相关机制并作答。',
    steps: ['打开主论文，找到本题指定章节和引用 [2]。', '在桌面浏览器搜索“Transformer 讲解视频”，打开 3Blue1Brown《直观解释注意力机制，Transformer 的核心》（BV1TZ421j7Ke），观看本题标明的时间段。', '从参考文献确认 Neural Machine Translation by Jointly Learning to Align and Translate，在“文件”中找到并打开，阅读本题指定章节。', '返回主论文原来的阅读位置，结合视频与引用文献核对并作答。'],
    resources: [
      attentionZh,
      { id: 'bahdanau', title: 'Neural Machine Translation by Jointly Learning to Align and Translate.pdf', url: attentionRoot + 'Neural-Machine-Translation-by-Jointly-Learning-to-Align-and-Translate.pdf', kind: 'pdf' },
    ],
  },
  answer: {
    label: '回答核对',
    switchLabel: '回答核对',
    title: '回答核对',
    description: '阅读 AI 问答中已准备的架构图与交流对话，对照原论文核查回答中的论述并作答。',
    steps: ['阅读 AI 问答窗口中的 Transformer 架构图和预设对话。', '在论文中找到题目指定章节，对照图文核查相关回答。', '根据原论文选择正确的修正。'],
    resources: [attentionZh],
    // Researcher answer key: docs/research/task-06-answer-key.md.
    qaExample: {
      question: '请结合这张 Transformer 架构图，说明编码器和解码器的分工，以及它们如何限制注意力能看到的信息。',
      image: {name:'图 1：Transformer 模型架构',url:attentionRoot+'architecture.png'},
      sentences: [
        '图左侧的编码器将输入序列转换为特征表示，右侧的解码器利用已生成的内容和编码器输出预测后续词语。',
        '编码器和解码器的自注意力都使用掩码，以避免看到未来位置。',
        '解码器中间的多头注意力子层接收编码器输出，使生成过程能够利用输入序列的信息。',
      ],
      // Deliberate inaccuracies match the three existing verification questions.
      followUps: [
        {question:'图底部的 Positional Encoding 如何与词嵌入结合？顶部又如何得到下一个词的预测？',sentences:[
          '词嵌入把词语转换为向量；位置编码提供序列中词语的位置信息。',
          '位置编码与词嵌入拼接，因此输入维度加倍。',
          '解码器顶部的特征经过 Linear 线性变换，再通过 Softmax 得到词汇表上的概率分布。',
        ]},
        {question:'图中的 Feed Forward 和 Add & Norm 分别有什么作用？前馈网络在不同位置是否共享参数？',sentences:[
          '前馈网络用于进一步变换每个位置的特征，由两次线性变换和中间的 ReLU 激活组成。',
          '前馈网络只有解码器才有，并在不同位置使用不同的参数。',
          'Add & Norm 表示子层周围的残差连接与层归一化；残差连接将子层输入与其输出相加。',
        ]},
      ],
    },
  },
};

export const studyTaskStore = createStore<{ current: StudyTaskId }>({ current: 'comparison' });

export function switchStudyTask(next: StudyTaskId) {
  if (studyTaskStore.get().current === next) return;
  for(const win of kernel.list())if(win.appId!=='experiment')kernel.close(win.id,'system');
  studyTaskStore.set({ current: next });
}
