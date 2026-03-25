import type { OutputResult, TypeInfo } from '../../../shared/types';
import { PropsDocReader } from '../../../runtime/reader';
import { useMemo, useState } from 'react';
import type { TypeDocLocale } from '../../shared/locale';
import type { HistoryItem } from '../../shared/types';

interface TypeNavigationResult {
  /** PropsDocReader 实例（data 为 null 时返回 null） */
  reader: PropsDocReader | null;
  /** 完整导航历史栈（面包屑渲染需要） */
  historyStack: HistoryItem[];
  /** 当前查看的类型信息（根级别时为 null） */
  currentTypeInfo: TypeInfo | null;
  /** 当前显示标题 */
  currentTitle: string;
  /** 是否处于嵌套类型查看状态 */
  isInNestedView: boolean;
  /** 点击类型导航到子类型 */
  handleTypeClick: (
    typeInfo: TypeInfo,
    typeName: string,
    fieldName?: string,
  ) => void;
  /** 导航到指定层级（-1 = 回到根级别） */
  navigateToLevel: (level: number) => void;
}

/**
 * 管理类型文档面板的导航状态
 * 封装历史栈、props 变化重置、Reader 实例创建、导航操作
 */
export function useTypeNavigation(
  typeKey: string,
  titlePrefix: string | undefined,
  data: OutputResult | null,
  locale: TypeDocLocale,
): TypeNavigationResult {
  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([]);

  /**
   * 跟踪 props 变化，在渲染期间重置历史栈
   * 替代 useEffect 以避免额外渲染周期
   */
  const [prevTypeKey, setPrevTypeKey] = useState(typeKey);
  const [prevData, setPrevData] = useState(data);

  if (typeKey !== prevTypeKey || data !== prevData) {
    setPrevTypeKey(typeKey);
    setPrevData(data);
    setHistoryStack([]);
  }

  /**
   * 使用 PropsDocReader.create 创建独立实例，
   * 避免单例模式在多实例场景下的数据冲突
   */
  const reader = useMemo(() => {
    if (!data) return null;
    return PropsDocReader.create(data);
  }, [data]);

  const rootTitle = titlePrefix ? `${titlePrefix} - ${typeKey}` : typeKey;
  const lastHistoryItem = historyStack.at(-1);
  const currentTypeInfo = lastHistoryItem?.typeInfo ?? null;
  const currentTitle = lastHistoryItem?.title ?? rootTitle;
  const isInNestedView = historyStack.length > 0;

  function handleTypeClick(
    typeInfo: TypeInfo,
    typeName: string,
    fieldName?: string,
  ) {
    if (!reader) return;

    const target = reader.getNavigationTarget(typeInfo, typeName);
    if (!target) return;

    let displayTitle = target.name;

    // 匿名对象的 name 为紧凑摘要（如 `{ id, name, email }`），以 `{` 开头
    // 命名类型不会以 `{` 开头，因此可安全区分
    const isAnonymousObject = target.name?.startsWith('{');
    if (isAnonymousObject && fieldName) {
      displayTitle = locale.anonymousObjectField(fieldName, target.name);
    }

    setHistoryStack((prev) => [
      ...prev,
      { typeInfo: target.typeInfo, title: displayTitle },
    ]);
  }

  function navigateToLevel(level: number) {
    if (level < 0) {
      setHistoryStack([]);
    } else {
      setHistoryStack((prev) => prev.slice(0, level + 1));
    }
  }

  return {
    reader,
    historyStack,
    currentTypeInfo,
    currentTitle,
    isInNestedView,
    handleTypeClick,
    navigateToLevel,
  };
}
