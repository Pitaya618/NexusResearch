/**
 * SSE（Server-Sent Events）流式解析。
 *
 * 用于 AI 对话的流式响应。后端用 text/event-stream，每帧格式：
 *   data: {"type":"chunk","content":"..."}\n\n
 *   data: {"type":"done","modelUsed":"...","tokensUsed":128}\n\n
 *
 * 实现基于 fetch + ReadableStream（原生，无额外依赖）。
 */

/** SSE 事件 */
export interface SseEvent {
  readonly type: string;
  readonly [key: string]: unknown;
}

/** 流式 AI 对话事件类型 */
export type AiStreamEvent =
  | { readonly type: 'chunk'; readonly content: string }
  | { readonly type: 'done'; readonly modelUsed: string; readonly tokensUsed: number }
  | { readonly type: 'error'; readonly message: string };

/** 发起流式请求并逐帧回调。
 *
 * @param path API 路径（如 /api/ai/chat）
 * @param body 请求体（POST）
 * @param onEvent 每帧回调
 * @param signal 可选 AbortSignal，用于中断
 */
export async function streamSse<T extends SseEvent>(
  path: string,
  body: unknown,
  onEvent: (event: T) => void,
  signal?: AbortSignal,
): Promise<void> {
  const baseUrl = window.__NEXUS__?.apiBaseUrl ?? '';
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`SSE request failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 按 SSE 帧分隔（空行）
      let frameEnd: number;
      while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const event = parseSseFrame(frame);
        if (event) onEvent(event as T);
      }
    }
    // 处理尾部残留
    if (buffer.trim()) {
      const event = parseSseFrame(buffer);
      if (event) onEvent(event as T);
    }
  } finally {
    reader.releaseLock();
  }
}

/** 解析单个 SSE 帧（data: 行）。 */
function parseSseFrame(frame: string): SseEvent | null {
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data:')) {
      dataLines.push(trimmed.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  try {
    return JSON.parse(dataLines.join('\n')) as SseEvent;
  } catch {
    return null;
  }
}
