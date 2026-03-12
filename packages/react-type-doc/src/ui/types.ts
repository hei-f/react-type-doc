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
}
