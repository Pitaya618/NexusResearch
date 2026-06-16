/** 随笔示例数据 */
import type { Essay } from 'shared/types';

export const SAMPLE_ESSAYS: readonly Essay[] = [
  {
    id: 'essay-1',
    title: 'LLM 在药物发现中的应用',
    content: `# LLM 在药物发现中的应用

## 引言

大型语言模型（LLM）正在改变药物发现的范式。从分子生成到蛋白质结构预测，AI 技术正在加速新药研发的每一个环节。

## 关键应用方向

- **分子生成**：利用 Transformer 架构生成具有目标属性的新分子
- **蛋白质折叠**：AlphaFold 等工具预测蛋白质三维结构
- **文献挖掘**：自动提取药物-靶点关系
- **临床试验优化**：利用 NLP 分析临床数据

## 展望

未来，LLM 有望成为药物研发的核心引擎，将研发周期从 10 年缩短至 2-3 年。`,
    tag: '灵感',
    wordCount: 2340,
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-06-01T14:30:00Z',
  },
  {
    id: 'essay-2',
    title: 'Attention 机制思考',
    content: `# Attention 机制思考

## 核心思想

Attention 机制的本质是**动态加权**——根据输入内容自适应地分配注意力权重。

## 多头注意力的意义

多头注意力允许模型同时关注不同位置的不同表示子空间，类似于 CNN 中的多个卷积核。`,
    tag: '文献笔记',
    wordCount: 1860,
    createdAt: '2026-05-15T08:00:00Z',
    updatedAt: '2026-05-28T16:00:00Z',
  },
  {
    id: 'essay-3',
    title: '数据增强实验思路',
    content: `# 数据增强实验思路

## 假设

通过对分子图进行结构保持的变换（如原子重标记、键旋转），可以有效扩充训练数据集。

## 实验设计

1. 收集 10K 分子样本
2. 应用 5 种增强策略
3. 对比增强前后的模型性能`,
    tag: '实验草稿',
    wordCount: 890,
    createdAt: '2026-06-01T09:00:00Z',
    updatedAt: '2026-06-03T11:00:00Z',
  },
  {
    id: 'essay-4',
    title: 'RL 优化分子性质综述',
    content: `# RL 优化分子性质综述

## 背景

强化学习在分子优化中的应用日益广泛。通过定义奖励函数（如药物相似性、合成可达性），RL 智能体可以逐步优化分子结构。

## 主要方法

- 策略梯度方法（REINFORCE）
- Actor-Critic 架构
- 分层强化学习`,
    tag: '综述',
    wordCount: 3100,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-05-25T15:00:00Z',
  },
] as const;
