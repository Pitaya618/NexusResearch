/** 文献实体数据与 Store */
import type { Literature, Collection, Tag, LiteratureOverviewStats } from 'shared/types';

/** 示例文献数据 */
export const SAMPLE_LITERATURE: readonly Literature[] = [
  {
    id: 1,
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A., Shazeer, N., Parmar, N., et al.',
    journal: 'NeurIPS',
    year: 2017,
    doi: '10.48550/arXiv.1706.03762',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
    aiSummary: '提出了 Transformer 架构，完全基于注意力机制，摒弃了 RNN 和 CNN。通过多头自注意力和位置编码实现了并行化训练，在机器翻译任务上取得了 SOTA 结果。',
    tags: ['Transformer', 'Attention', 'NLP'],
    isFavorite: true,
    readStatus: 'read',
  },
  {
    id: 2,
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: 'Devlin, J., Chang, M.W., Lee, K., Toutanova, K.',
    journal: 'NAACL',
    year: 2019,
    doi: '10.18653/v1/N19-1423',
    abstract: 'We introduce a new language representation model called BERT...',
    aiSummary: '提出 BERT 模型，通过掩码语言模型和下一句预测进行双向预训练，在 11 项 NLP 任务上刷新了最佳记录。',
    tags: ['Transformer', 'NLP', '预训练'],
    isFavorite: true,
    readStatus: 'read',
  },
  {
    id: 3,
    title: 'Language Models are Few-Shot Learners',
    authors: 'Brown, T., Mann, B., Ryder, N., et al.',
    journal: 'NeurIPS',
    year: 2020,
    doi: '10.48550/arXiv.2005.14165',
    abstract: 'Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus...',
    aiSummary: 'GPT-3 展示了大规模语言模型的少样本学习能力，通过 in-context learning 无需微调即可完成多种任务。',
    tags: ['NLP', 'LLM'],
    isFavorite: false,
    readStatus: 'read',
  },
  {
    id: 4,
    title: 'Molecular Graph Generation via Graph VAE',
    authors: 'Jin, W., Barzilay, R., Jaakkola, T.',
    journal: 'ICML',
    year: 2018,
    doi: '10.48550/arXiv.1803.03323',
    abstract: 'We propose a junction tree variational autoencoder for molecular graph generation...',
    aiSummary: '提出基于结点树的 VAE 方法用于分子图生成，能够生成化学有效的分子结构，在药物发现中具有应用价值。',
    tags: ['分子生成', 'GNN'],
    isFavorite: false,
    readStatus: 'unread',
  },
  {
    id: 5,
    title: 'Training Language Models to Follow Instructions with Human Feedback',
    authors: 'Ouyang, L., Wu, J., Jiang, X., et al.',
    journal: 'NeurIPS',
    year: 2022,
    doi: '10.48550/arXiv.2203.02155',
    abstract: 'Making language models bigger does not inherently make them better at following a user\'s intent...',
    aiSummary: 'InstructGPT/RLHF 方法通过人类反馈强化学习训练语言模型遵循指令，显著提升了模型的有用性和安全性。',
    tags: ['RLHF', 'NLP', 'LLM'],
    isFavorite: true,
    readStatus: 'unread',
  },
  {
    id: 6,
    title: 'Drug Design with Graph Neural Networks and Reinforcement Learning',
    authors: 'Zhou, Z., Kearnes, S., Li, L., et al.',
    journal: 'ACS Central Science',
    year: 2019,
    doi: '10.1021/acscentsci.9b00451',
    abstract: 'We propose a deep reinforcement learning framework for goal-directed molecular optimization...',
    aiSummary: '结合 GNN 和强化学习进行药物分子优化设计，通过策略网络逐步修饰分子结构以优化目标属性。',
    tags: ['分子生成', 'GNN', 'RL'],
    isFavorite: false,
    readStatus: 'unread',
  },
] as const;

/** 示例收藏夹 */
export const SAMPLE_COLLECTIONS: readonly Collection[] = [
  { id: 'all', name: '全部文献', icon: '📚', count: 6, isSystem: true },
  { id: 'important', name: '重要', icon: '⭐', count: 3, isSystem: true },
  { id: 'read', name: '已读', icon: '✅', count: 3, isSystem: true },
  { id: 'unread', name: '未读', icon: '📩', count: 3, isSystem: true },
  { id: 'llm', name: 'LLM 相关', icon: '🤖', count: 3, isSystem: false },
  { id: 'mol', name: '分子生成', icon: '🧬', count: 2, isSystem: false },
] as const;

/** 示例标签 */
export const SAMPLE_TAGS: readonly Tag[] = [
  { id: 'transformer', name: 'Transformer', color: 'oklch(58% 0.18 255)', count: 2 },
  { id: 'attention', name: 'Attention', color: 'oklch(65% 0.18 142)', count: 1 },
  { id: 'mol-gen', name: '分子生成', color: 'oklch(75% 0.15 85)', count: 2 },
  { id: 'nlp', name: 'NLP', color: 'oklch(55% 0.22 20)', count: 3 },
  { id: 'rl', name: 'RL', color: 'oklch(82% 0.14 300)', count: 1 },
] as const;

/** 示例概览统计 */
export const SAMPLE_STATS: LiteratureOverviewStats = {
  total: 6,
  addedThisMonth: 3,
  withAiSummary: 4,
};
