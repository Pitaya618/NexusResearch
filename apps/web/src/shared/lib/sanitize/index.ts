/** XSS 过滤工具 - 对所有用户输入进行安全处理 */
import DOMPurify from 'dompurify';

/** 清理 HTML 内容，移除危险标签和属性 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
  });
}

/** 转义纯文本中的 HTML 特殊字符 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/** 清理用户输入的搜索查询 */
export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[<>"'&]/g, '').trim().slice(0, 200);
}

/** 检查字符串是否包含潜在的 XSS 内容 */
export function containsXssAttempt(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  return xssPatterns.some((pattern) => pattern.test(input));
}
