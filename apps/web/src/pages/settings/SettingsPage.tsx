/** 设置页面 — 模型与 API 区接入真实后端（其余区保留 mock） */
import { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SettingsNavSection } from 'shared/types';
import { useProviderStore } from 'features/provider/model/providerStore';

/** 已知 Provider 的静态元数据（图标/描述），与后端配置合并显示 */
const PROVIDER_META: Record<string, { icon: string; desc: string }> = {
  anthropic: { icon: '🟣', desc: 'Claude 系列 — 长上下文、强推理' },
  openai: { icon: '🟢', desc: 'GPT-4o / o1 / o3 系列' },
  google: { icon: '🔵', desc: 'Gemini 2.5 Pro / Flash' },
  deepseek: { icon: '🟡', desc: 'DeepSeek-V3 / R1 — 高性价比推理' },
  moonshot: { icon: '🌙', desc: 'Moonshot/Kimi — moonshot-v1-128k' },
  custom: { icon: '🔧', desc: '自定义 OpenAI 兼容服务' },
};

/** 模块中文标签 */
const MODULE_LABELS: Record<string, string> = {
  literature: '文献管理',
  reader: '文献阅读',
  essay: '随笔',
  paper: '论文写作',
};

/** 模拟用量数据 */
const USAGE_DATA = {
  totalTokens: 1_284_560,
  totalCost: 12.47,
  period: '2026 年 6 月',
  models: [
    { name: 'Claude 4 Opus', provider: 'Anthropic', tokens: 856_240, cost: 8.56, requests: 342, color: '#7C3AED' },
    { name: 'Claude 4 Sonnet', provider: 'Anthropic', tokens: 213_400, cost: 1.28, requests: 156, color: '#8B5CF6' },
    { name: 'GPT-4o', provider: 'OpenAI', tokens: 142_320, cost: 1.42, requests: 89, color: '#10B981' },
    { name: 'DeepSeek-V3', provider: 'DeepSeek', tokens: 72_600, cost: 0.21, requests: 67, color: '#F59E0B' },
  ],
  weekly: [
    { date: '06-07', total: 45_200, cost: 0.45, 'Claude 4 Opus': 28_500, 'Claude 4 Sonnet': 8_200, 'GPT-4o': 5_800, 'DeepSeek-V3': 2_700 },
    { date: '06-08', total: 62_100, cost: 0.62, 'Claude 4 Opus': 38_400, 'Claude 4 Sonnet': 12_100, 'GPT-4o': 7_800, 'DeepSeek-V3': 3_800 },
    { date: '06-09', total: 38_400, cost: 0.38, 'Claude 4 Opus': 22_600, 'Claude 4 Sonnet': 6_800, 'GPT-4o': 5_400, 'DeepSeek-V3': 3_600 },
    { date: '06-10', total: 71_800, cost: 0.72, 'Claude 4 Opus': 45_200, 'Claude 4 Sonnet': 14_200, 'GPT-4o': 8_200, 'DeepSeek-V3': 4_200 },
    { date: '06-11', total: 54_300, cost: 0.54, 'Claude 4 Opus': 34_800, 'Claude 4 Sonnet': 9_600, 'GPT-4o': 6_400, 'DeepSeek-V3': 3_500 },
    { date: '06-12', total: 89_600, cost: 0.90, 'Claude 4 Opus': 56_200, 'Claude 4 Sonnet': 18_400, 'GPT-4o': 10_200, 'DeepSeek-V3': 4_800 },
    { date: '06-13', total: 42_160, cost: 0.42, 'Claude 4 Opus': 26_800, 'Claude 4 Sonnet': 7_600, 'GPT-4o': 4_800, 'DeepSeek-V3': 2_960 },
  ],
  monthly: [
    { date: '06-01', total: 42_300, cost: 0.42, 'Claude 4 Opus': 26_800, 'Claude 4 Sonnet': 8_100, 'GPT-4o': 4_800, 'DeepSeek-V3': 2_600 },
    { date: '06-02', total: 38_600, cost: 0.39, 'Claude 4 Opus': 24_200, 'Claude 4 Sonnet': 7_200, 'GPT-4o': 4_600, 'DeepSeek-V3': 2_600 },
    { date: '06-03', total: 51_200, cost: 0.51, 'Claude 4 Opus': 32_400, 'Claude 4 Sonnet': 9_800, 'GPT-4o': 5_800, 'DeepSeek-V3': 3_200 },
    { date: '06-04', total: 46_800, cost: 0.47, 'Claude 4 Opus': 29_600, 'Claude 4 Sonnet': 8_800, 'GPT-4o': 5_400, 'DeepSeek-V3': 3_000 },
    { date: '06-05', total: 55_400, cost: 0.55, 'Claude 4 Opus': 35_200, 'Claude 4 Sonnet': 10_600, 'GPT-4o': 6_200, 'DeepSeek-V3': 3_400 },
    { date: '06-06', total: 48_900, cost: 0.49, 'Claude 4 Opus': 30_800, 'Claude 4 Sonnet': 9_200, 'GPT-4o': 5_800, 'DeepSeek-V3': 3_100 },
    { date: '06-07', total: 45_200, cost: 0.45, 'Claude 4 Opus': 28_500, 'Claude 4 Sonnet': 8_200, 'GPT-4o': 5_800, 'DeepSeek-V3': 2_700 },
    { date: '06-08', total: 62_100, cost: 0.62, 'Claude 4 Opus': 38_400, 'Claude 4 Sonnet': 12_100, 'GPT-4o': 7_800, 'DeepSeek-V3': 3_800 },
    { date: '06-09', total: 38_400, cost: 0.38, 'Claude 4 Opus': 22_600, 'Claude 4 Sonnet': 6_800, 'GPT-4o': 5_400, 'DeepSeek-V3': 3_600 },
    { date: '06-10', total: 71_800, cost: 0.72, 'Claude 4 Opus': 45_200, 'Claude 4 Sonnet': 14_200, 'GPT-4o': 8_200, 'DeepSeek-V3': 4_200 },
    { date: '06-11', total: 54_300, cost: 0.54, 'Claude 4 Opus': 34_800, 'Claude 4 Sonnet': 9_600, 'GPT-4o': 6_400, 'DeepSeek-V3': 3_500 },
    { date: '06-12', total: 89_600, cost: 0.90, 'Claude 4 Opus': 56_200, 'Claude 4 Sonnet': 18_400, 'GPT-4o': 10_200, 'DeepSeek-V3': 4_800 },
    { date: '06-13', total: 42_160, cost: 0.42, 'Claude 4 Opus': 26_800, 'Claude 4 Sonnet': 7_600, 'GPT-4o': 4_800, 'DeepSeek-V3': 2_960 },
    { date: '06-14', total: 47_500, cost: 0.48, 'Claude 4 Opus': 30_200, 'Claude 4 Sonnet': 8_800, 'GPT-4o': 5_600, 'DeepSeek-V3': 2_900 },
    { date: '06-15', total: 52_800, cost: 0.53, 'Claude 4 Opus': 33_400, 'Claude 4 Sonnet': 10_200, 'GPT-4o': 6_000, 'DeepSeek-V3': 3_200 },
    { date: '06-16', total: 44_600, cost: 0.45, 'Claude 4 Opus': 28_200, 'Claude 4 Sonnet': 8_400, 'GPT-4o': 5_200, 'DeepSeek-V3': 2_800 },
    { date: '06-17', total: 58_300, cost: 0.58, 'Claude 4 Opus': 36_800, 'Claude 4 Sonnet': 11_200, 'GPT-4o': 6_800, 'DeepSeek-V3': 3_500 },
    { date: '06-18', total: 41_200, cost: 0.41, 'Claude 4 Opus': 26_100, 'Claude 4 Sonnet': 7_800, 'GPT-4o': 4_600, 'DeepSeek-V3': 2_700 },
    { date: '06-19', total: 67_400, cost: 0.67, 'Claude 4 Opus': 42_600, 'Claude 4 Sonnet': 13_200, 'GPT-4o': 7_800, 'DeepSeek-V3': 3_800 },
    { date: '06-20', total: 53_100, cost: 0.53, 'Claude 4 Opus': 33_600, 'Claude 4 Sonnet': 10_200, 'GPT-4o': 6_200, 'DeepSeek-V3': 3_100 },
    { date: '06-21', total: 49_800, cost: 0.50, 'Claude 4 Opus': 31_400, 'Claude 4 Sonnet': 9_600, 'GPT-4o': 5_800, 'DeepSeek-V3': 3_000 },
    { date: '06-22', total: 72_600, cost: 0.73, 'Claude 4 Opus': 45_800, 'Claude 4 Sonnet': 14_400, 'GPT-4o': 8_400, 'DeepSeek-V3': 4_000 },
    { date: '06-23', total: 39_400, cost: 0.39, 'Claude 4 Opus': 24_800, 'Claude 4 Sonnet': 7_400, 'GPT-4o': 4_600, 'DeepSeek-V3': 2_600 },
    { date: '06-24', total: 56_700, cost: 0.57, 'Claude 4 Opus': 35_800, 'Claude 4 Sonnet': 11_000, 'GPT-4o': 6_600, 'DeepSeek-V3': 3_300 },
    { date: '06-25', total: 48_200, cost: 0.48, 'Claude 4 Opus': 30_400, 'Claude 4 Sonnet': 9_200, 'GPT-4o': 5_600, 'DeepSeek-V3': 3_000 },
    { date: '06-26', total: 63_500, cost: 0.64, 'Claude 4 Opus': 40_200, 'Claude 4 Sonnet': 12_400, 'GPT-4o': 7_200, 'DeepSeek-V3': 3_700 },
    { date: '06-27', total: 45_900, cost: 0.46, 'Claude 4 Opus': 29_000, 'Claude 4 Sonnet': 8_600, 'GPT-4o': 5_400, 'DeepSeek-V3': 2_900 },
    { date: '06-28', total: 58_200, cost: 0.58, 'Claude 4 Opus': 36_800, 'Claude 4 Sonnet': 11_200, 'GPT-4o': 6_800, 'DeepSeek-V3': 3_400 },
    { date: '06-29', total: 42_600, cost: 0.43, 'Claude 4 Opus': 27_000, 'Claude 4 Sonnet': 8_000, 'GPT-4o': 4_800, 'DeepSeek-V3': 2_800 },
    { date: '06-30', total: 51_400, cost: 0.51, 'Claude 4 Opus': 32_600, 'Claude 4 Sonnet': 9_800, 'GPT-4o': 6_000, 'DeepSeek-V3': 3_000 },
  ],
};

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsNavSection>('models-api');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [usageModel, setUsageModel] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Provider store
  const { providers, assignments, loading, testing, fetchAll, upsert, test, setAssignment } = useProviderStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 合并后端 provider 与静态元数据
  const displayProviders = providers.length > 0
    ? providers.map((p) => ({
        ...p,
        icon: PROVIDER_META[p.id]?.icon ?? p.icon ?? '🔧',
        desc: p.description || PROVIDER_META[p.id]?.desc || '',
      }))
    : Object.entries(PROVIDER_META).map(([id, meta]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        icon: meta.icon,
        desc: meta.desc,
        connectionStatus: 'not-configured',
        apiKeyConfigured: false,
      }));

  const periodData = timePeriod === 'weekly' ? USAGE_DATA.weekly : USAGE_DATA.monthly;
  const selectedModelData = USAGE_DATA.models.find((m) => m.name === usageModel);
  const displayTokens = usageModel === 'all' ? USAGE_DATA.totalTokens : (selectedModelData?.tokens ?? 0);
  const displayCost = usageModel === 'all' ? USAGE_DATA.totalCost : (selectedModelData?.cost ?? 0);
  const displayRequests = usageModel === 'all'
    ? USAGE_DATA.models.reduce((s, m) => s + m.requests, 0)
    : (selectedModelData?.requests ?? 0);

  const chartOption = useMemo(() => {
    const dates = periodData.map((d) => d.date);
    const tokenData = periodData.map((d) => usageModel === 'all' ? d.total : (d[usageModel as keyof typeof d] as number ?? 0));
    const costData = periodData.map((d) => {
      if (usageModel === 'all') return d.cost;
      const ratio = (d[usageModel as keyof typeof d] as number ?? 0) / d.total;
      return d.cost * ratio;
    });
    const barColor = usageModel === 'all' ? '#6366f1' : (selectedModelData?.color ?? '#6366f1');
    const lineColor = usageModel === 'all' ? '#f59e0b' : (selectedModelData?.color ?? '#f59e0b');

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: Array<{ seriesName: string; value: number; axisValue: string }>) => {
          let result = `<strong>${params[0]?.axisValue}</strong><br/>`;
          params.forEach((p) => {
            result += `${p.seriesName}: ${p.seriesName === '费用' ? '$' + p.value.toFixed(2) : p.value.toLocaleString() + ' tokens'}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['Token 用量', '费用'],
        top: 0,
        left: 'center',
      },
      grid: {
        left: 70,
        right: 70,
        bottom: 40,
        top: 50,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { fontSize: 11, color: '#9ca3af' },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Tokens',
          axisLabel: {
            fontSize: 11,
            color: '#9ca3af',
            formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toString(),
          },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: '费用 ($)',
          axisLabel: {
            fontSize: 11,
            color: '#9ca3af',
            formatter: (v: number) => '$' + v.toFixed(2),
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Token 用量',
          type: 'bar',
          data: tokenData,
          itemStyle: { color: barColor, borderRadius: [4, 4, 0, 0] },
          barWidth: '40%',
        },
        {
          name: '费用',
          type: 'line',
          yAxisIndex: 1,
          data: costData,
          itemStyle: { color: lineColor },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodData, usageModel]);

  return (
    <div className="settings-layout">
      <div className="settings-nav">
        <div className="settings-nav-title">通用</div>
        <button className={`settings-nav-item${activeSection === 'models-api' ? ' active' : ''}`} onClick={() => setActiveSection('models-api')}>
          <span className="nav-icon">🤖</span> 模型与 API
        </button>
        <button className={`settings-nav-item${activeSection === 'usage' ? ' active' : ''}`} onClick={() => setActiveSection('usage')}>
          <span className="nav-icon">📊</span> 用量统计
        </button>
        <div style={{ height: 16 }} />
        <div className="settings-nav-title">高级</div>
        <button className={`settings-nav-item${activeSection === 'proxy' ? ' active' : ''}`} onClick={() => setActiveSection('proxy')}>
          <span className="nav-icon">🌐</span> 代理与网络
        </button>
        <button className={`settings-nav-item${activeSection === 'data' ? ' active' : ''}`} onClick={() => setActiveSection('data')}>
          <span className="nav-icon">💾</span> 数据与存储
        </button>
        <button className={`settings-nav-item${activeSection === 'about' ? ' active' : ''}`} onClick={() => setActiveSection('about')}>
          <span className="nav-icon">ℹ️</span> 关于
        </button>
      </div>

      <div className="settings-content">
        {activeSection === 'models-api' && (
          <div className="settings-section active">
            <div className="section-header">
              <h2>模型与 API</h2>
              <p>管理 API 提供商和模型。选择提供商后可自动获取可用模型列表。</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <div className="settings-card-title">API 提供商</div>
                  <div className="settings-card-desc">选择一个作为默认提供商。支持自定义添加兼容 OpenAI 接口的服务商。</div>
                </div>
                <button
                  className="btn-sm primary"
                  onClick={() => {
                    const id = prompt('输入 Provider ID（如 myapi）:');
                    if (id) upsert(id, { name: id, baseUrl: '', compatibilityType: 'openai' });
                  }}
                >
                  + 添加提供商
                </button>
              </div>
              {loading && <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>加载中…</div>}
              {displayProviders.map((p) => (
                <div
                  key={p.id}
                  className={`provider-row${selectedProvider === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedProvider(p.id)}
                >
                  <div className="provider-radio" />
                  <div className="provider-icon">{p.icon}</div>
                  <div className="provider-info">
                    <div className="provider-name">{p.name}</div>
                    <div className="provider-desc">{p.desc}</div>
                  </div>
                  <div className={`provider-status ${p.connectionStatus === 'connected' ? 'active' : ''}`}>
                    {p.connectionStatus === 'connected' ? '已连接' : p.apiKeyConfigured ? '未验证' : '未配置'}
                  </div>
                </div>
              ))}
            </div>

            <div className="settings-card">
              <div className="settings-card-title">
                API Key{selectedProvider ? ` — ${selectedProvider}` : ''}
              </div>
              <div className="api-key-row">
                <input
                  className="api-key-input"
                  type="password"
                  placeholder={selectedProvider ? '粘贴 API Key...' : '请先选择上方的提供商'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  disabled={!selectedProvider}
                />
                <button
                  className="btn-sm"
                  disabled={!selectedProvider || testing === selectedProvider}
                  onClick={async () => {
                    if (!selectedProvider) return;
                    if (apiKeyInput) {
                      await upsert(selectedProvider, {
                        name: selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1),
                        baseUrl: '',
                        apiKey: apiKeyInput,
                        compatibilityType: 'openai',
                        isDefault: true,
                      });
                      setApiKeyInput('');
                    }
                    const r = await test(selectedProvider);
                    setTestResult(r.success ? `✓ 连通成功（${r.latency}ms）` : `✗ ${r.error}`);
                  }}
                >
                  {testing === selectedProvider ? '测试中…' : '验证'}
                </button>
                <button
                  className="btn-sm primary"
                  disabled={!selectedProvider || !apiKeyInput}
                  onClick={async () => {
                    if (!selectedProvider || !apiKeyInput) return;
                    await upsert(selectedProvider, {
                      name: selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1),
                      baseUrl: '',
                      apiKey: apiKeyInput,
                      compatibilityType: 'openai',
                      isDefault: true,
                    });
                    setApiKeyInput('');
                    setTestResult('✓ 已保存');
                  }}
                >
                  保存
                </button>
              </div>
              {testResult && <div style={{ padding: '8px 0', fontSize: 12, color: testResult.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>{testResult}</div>}
            </div>

            <div className="settings-card">
              <div className="settings-card-title">模块模型分配</div>
              <table className="settings-table">
                <thead>
                  <tr><th>模块</th><th>模型（providerId:modelName）</th></tr>
                </thead>
                <tbody>
                  {Object.entries(MODULE_LABELS).map(([mod, label]) => {
                    const current = assignments.find((a) => a.module === mod);
                    return (
                      <tr key={mod}>
                        <td>{label}</td>
                        <td>
                          <input
                            className="api-key-input"
                            style={{ width: '100%' }}
                            defaultValue={current?.modelId ?? ''}
                            placeholder="providerId:modelName（如 deepseek:deepseek-chat）"
                            onBlur={(e) => {
                              if (e.target.value && e.target.value !== current?.modelId) {
                                setAssignment(mod, e.target.value);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'usage' && (
          <div className="settings-section active">
            <div className="section-header">
              <h2>用量统计</h2>
              <p>查看模型使用情况和费用统计。数据为 {USAGE_DATA.period} 的统计。</p>
            </div>

            <div className="usage-controls">
              <div className="usage-model-tabs">
                <button className={`usage-model-tab${usageModel === 'all' ? ' active' : ''}`} onClick={() => setUsageModel('all')}>全部模型</button>
                {USAGE_DATA.models.map((m) => (
                  <button key={m.name} className={`usage-model-tab${usageModel === m.name ? ' active' : ''}`} onClick={() => setUsageModel(m.name)}>
                    <span className="usage-model-tab-dot" style={{ background: m.color }} />
                    {m.name}
                  </button>
                ))}
              </div>
              <div className="usage-period-tabs">
                <button className={`usage-period-tab${timePeriod === 'weekly' ? ' active' : ''}`} onClick={() => setTimePeriod('weekly')}>本周</button>
                <button className={`usage-period-tab${timePeriod === 'monthly' ? ' active' : ''}`} onClick={() => setTimePeriod('monthly')}>本月</button>
              </div>
            </div>

            <div className="usage-overview">
              <div className="usage-stat-card">
                <div className="usage-stat-label">总 Token 数</div>
                <div className="usage-stat-value">{displayTokens.toLocaleString()}</div>
              </div>
              <div className="usage-stat-card">
                <div className="usage-stat-label">总费用</div>
                <div className="usage-stat-value">${displayCost.toFixed(2)}</div>
              </div>
              <div className="usage-stat-card">
                <div className="usage-stat-label">请求数</div>
                <div className="usage-stat-value">{displayRequests}</div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card-title">用量趋势（柱形图 + 折线图）</div>
              <div className="usage-echart">
                <ReactECharts option={chartOption} style={{ height: 320, width: '100%' }} />
              </div>
            </div>

            {usageModel === 'all' && (
              <div className="settings-card">
                <div className="settings-card-title">模型用量明细</div>
                <div className="usage-model-list">
                  {USAGE_DATA.models.map((m) => (
                    <div key={m.name} className="usage-model-row">
                      <div className="usage-model-color" style={{ background: m.color }} />
                      <div className="usage-model-info">
                        <div className="usage-model-name">{m.name}</div>
                        <div className="usage-model-provider">{m.provider}</div>
                      </div>
                      <div className="usage-model-stats">
                        <div className="usage-model-tokens">{m.tokens.toLocaleString()} tokens</div>
                        <div className="usage-model-cost">${m.cost.toFixed(2)}</div>
                      </div>
                      <div className="usage-model-bar-wrapper">
                        <div className="usage-model-bar" style={{ width: `${(m.tokens / USAGE_DATA.totalTokens * 100).toFixed(1)}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'proxy' && (
          <div className="settings-section active">
            <div className="section-header">
              <h2>代理与网络</h2>
              <p>配置网络代理以访问 API 服务。</p>
            </div>
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>启用代理</span>
                <button className={`toggle${proxyEnabled ? ' on' : ''}`} onClick={() => setProxyEnabled(!proxyEnabled)} />
              </div>
              {proxyEnabled && (
                <>
                  <div className="form-group"><label>代理类型</label><select><option>HTTP</option><option>SOCKS5</option></select></div>
                  <div className="form-group"><label>主机</label><input placeholder="127.0.0.1" /></div>
                  <div className="form-group"><label>端口</label><input placeholder="7890" /></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn-sm">测试连接</button>
                    <button className="btn-sm primary">保存</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="settings-section active">
            <div className="section-header">
              <h2>数据与存储</h2>
              <p>管理本地数据和存储空间。</p>
            </div>
            <div className="settings-card">
              <div className="settings-card-title">存储使用：2.4 GB</div>
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
                📚 文献: 1.2 GB<br />✏️ 随笔: 0.4 GB<br />📝 论文: 0.6 GB<br />🗂️ 缓存: 0.2 GB
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-sm">清空缓存</button>
              <button className="btn-sm">重建索引</button>
              <button className="btn-sm danger">清空所有数据</button>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="settings-section active" style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ width: 64, height: 64, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 600, color: '#fff', margin: '0 auto 20px', fontFamily: 'var(--font-display)' }}>N</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600 }}>NexusResearch</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>v1.0.0 · 构建于 2026-06-03</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>开源的 AI 科研助手，整合文献管理、论文阅读、随笔写作、论文编辑于一体。</p>
          </div>
        )}
      </div>
    </div>
  );
}
