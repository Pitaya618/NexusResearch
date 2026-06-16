/** 通用工具类型定义 */

/** 操作结果 - 区分成功与失败 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: E };

/** 异步操作结果 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/** 分页响应 */
export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/** 排序方向 */
export type SortDirection = 'asc' | 'desc';

/** 排序配置 */
export interface SortConfig<T> {
  readonly field: keyof T;
  readonly direction: SortDirection;
}

/** ISO 日期字符串类型 */
export type ISODateString = string;

/** 带时间戳的实体 */
export type Timestamped<T> = T & {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
};

/** 带 ID 的实体 */
export type EntityWithId<T, K = string> = T & {
  readonly id: K;
};

/** UUID 类型 */
export type UUID = string;

/** 十六进制颜色 */
export type HexColor = string;

/** oklch 颜色 */
export type OklchColor = string;

/** 深度只读 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 深度可选 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 非空数组 */
export type NonEmptyArray<T> = [T, ...T[]];

/** 美化交叉类型显示 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
