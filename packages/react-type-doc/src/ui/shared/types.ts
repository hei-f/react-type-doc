import type { TypeInfo } from '../shared/types';
import type { PropsDocReader } from '../runtime/reader';
import type { TypeDocLocale } from './locale';

/** 导航历史条目 */
export interface HistoryItem {
  typeInfo: TypeInfo;
  title: string;
}

/** 所有类型渲染函数共享的上下文 */
export interface TypeRenderContext {
  onTypeClick: (
    typeInfo: TypeInfo,
    typeName: string,
    fieldName?: string,
  ) => void;
  reader: PropsDocReader;
  locale: TypeDocLocale;
  /** 当前缩进级别（用于匿名对象内联展开） */
  indentLevel?: number;
  /** 当前括号嵌套层级（用于括号配对颜色） */
  bracketLevel?: number;
  /** 括号点击回调 */
  onBracketClick?: (bracketId: string) => void;
  /** 当前被点击的括号 ID */
  clickedBracketId?: string | null;
}
