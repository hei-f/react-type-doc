/**
 * Props 文档数据读取器
 * @description 提供便捷的类型信息读取和解析功能
 */

import type {
  FullTypeInfo,
  FunctionSignature,
  OutputResult,
  TypeInfo,
  RenderHint,
} from '../shared/types';
import { RENDER_HINT } from '../shared/types';
import { getTypeName, isPrimitiveType, isTypeRef } from './utils';
import { RENDER_TYPE } from './renderTypes';
import type { TypeRenderInfo } from './renderTypes';

/**
 * Props 文档数据读取器
 * 封装类型解析逻辑，提供便捷的 API
 */
export class PropsDocReader {
  /** 单例实例 */
  private static instance: PropsDocReader | null = null;

  private data: OutputResult;

  private constructor(data: OutputResult) {
    this.data = data;
  }

  /**
   * 获取单例实例
   * - 无参数：返回现有实例或 null
   * - 有参数：返回现有实例，或用 data 初始化后返回
   */
  static getInstance(data?: OutputResult): PropsDocReader | null {
    if (!PropsDocReader.instance && data) {
      PropsDocReader.instance = new PropsDocReader(data);
    }
    return PropsDocReader.instance;
  }

  /**
   * 创建新实例（非单例，用于需要独立实例的场景）
   */
  static create(data: OutputResult): PropsDocReader {
    return new PropsDocReader(data);
  }

  /**
   * 获取所有可用的类型 key
   */
  getAllKeys(): string[] {
    return Object.keys(this.data.keys);
  }

  /**
   * 检查是否存在指定的类型 key
   */
  hasKey(key: string): boolean {
    return key in this.data.keys;
  }

  /**
   * 获取原始类型信息（不解析引用）
   */
  getRaw(key: string): TypeInfo | null {
    return this.data.keys[key] ?? null;
  }

  /**
   * 获取类型注册表
   */
  getTypeRegistry(): Record<string, TypeInfo> {
    return this.data.typeRegistry;
  }

  /**
   * 解析类型引用，从 typeRegistry 获取完整定义
   * 默认值规则：
   * - description 默认为空字符串
   * - required 默认为 false
   */
  resolveRef(typeInfo: TypeInfo): FullTypeInfo {
    if (!isTypeRef(typeInfo)) {
      return typeInfo;
    }

    const resolved = this.data.typeRegistry[typeInfo.$ref];
    if (resolved && !isTypeRef(resolved)) {
      // descriptionLinks 跟随 description 的来源：
      // 使用 ref 的 description 时取 ref 的 links，否则取 resolved 的
      const useRefDesc = typeInfo.description !== undefined;
      const descLinks = useRefDesc
        ? typeInfo.descriptionLinks
        : resolved.descriptionLinks;
      return {
        ...resolved,
        description: typeInfo.description ?? resolved.description ?? '',
        required: typeInfo.required ?? resolved.required ?? false,
        ...(descLinks ? { descriptionLinks: descLinks } : {}),
      };
    }

    return {
      kind: 'unknown',
      text: typeInfo.$ref,
      description: typeInfo.description ?? '',
      required: typeInfo.required ?? false,
      ...(typeInfo.descriptionLinks
        ? { descriptionLinks: typeInfo.descriptionLinks }
        : {}),
    };
  }

  /**
   * 根据 key 获取完整的类型信息（解析引用）
   */
  resolve(key: string): FullTypeInfo | null {
    const typeInfo = this.data.keys[key];
    if (!typeInfo) {
      return null;
    }
    return this.resolveRef(typeInfo);
  }

  /**
   * 判断类型是否可展开（有嵌套属性）
   */
  isExpandable(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);

    if (resolved.kind === 'object' && resolved.properties) {
      return Object.keys(resolved.properties).length > 0;
    }

    if (resolved.kind === 'array' && resolved.elementType) {
      return this.isExpandable(resolved.elementType);
    }

    // 元组类型不可展开
    if (resolved.kind === 'tuple') {
      return false;
    }

    if (resolved.kind === 'union' && resolved.unionTypes) {
      return resolved.unionTypes.some((ut) => this.isExpandable(ut));
    }

    return false;
  }

  /**
   * 从类型文本中提取自定义类型名
   * 支持命名空间格式（如 API.MarketingPlanOutputCrowdVO）
   */
  extractCustomTypeName(text: string): string | null {
    const cleaned = text.replace(/\[\]/g, '').replace(/\s*\|\s*undefined/g, '');
    if (isPrimitiveType(cleaned)) {
      return null;
    }
    const match = cleaned.match(
      /^([A-Z][a-zA-Z0-9]*(?:\.[A-Z][a-zA-Z0-9]*)*(?:<[^>]+>)?)/,
    );
    return match?.[1] ?? null;
  }

  /**
   * 获取生成时间
   */
  getGeneratedAt(): string {
    return this.data.generatedAt;
  }

  /**
   * 判断是否为外部类型
   */
  isExternal(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);
    const externalHints: RenderHint[] = [
      RENDER_HINT.External,
      RENDER_HINT.Builtin,
      RENDER_HINT.IndexAccess,
    ];
    return (
      resolved.renderHint !== undefined &&
      externalHints.includes(resolved.renderHint)
    );
  }

  /**
   * 判断是否为循环引用类型
   */
  isCircular(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);
    return resolved.renderHint === RENDER_HINT.Circular;
  }

  /**
   * 判断是否为复杂类型（无名联合类型，数组元素需要括号包裹）
   * 如 `(string | number)[]` 中联合类型需要括号，而 `Status[]` 不需要
   */
  isComplexType(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);
    return resolved.kind === 'union' && !resolved.name;
  }

  /**
   * 判断类型是否包含未实例化的泛型参数
   * 用于区分 Omit<T, 'id'> 和 Omit<User, 'id'> 这类场景
   * @param typeInfo 要检查的类型
   * @returns true 表示类型包含未实例化的泛型参数，无法在定义时展开属性
   */
  isGenericType(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);
    return resolved.isGeneric === true;
  }

  /**
   * 判断是否为匿名对象类型（应该内联展开）
   * @param typeInfo 要检查的类型
   * @returns true 表示应该内联展开
   */
  private isAnonymousObject(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);

    if (resolved.kind !== 'object') {
      return false;
    }

    if (resolved.renderHint === 'circular' || this.isExternal(typeInfo)) {
      return false;
    }

    const name = getTypeName(resolved);

    return name.startsWith('{') || name === 'Object' || name === '[匿名对象]';
  }

  /**
   * 获取显示用的类型名称
   * 若类型名为 Object 则使用 fallback
   */
  getDisplayName(typeInfo: TypeInfo, fallback?: string): string {
    const resolved = this.resolveRef(typeInfo);
    const name = getTypeName(resolved);
    if (name === 'Object' && fallback) {
      return fallback;
    }
    return name ?? fallback ?? 'unknown';
  }

  /**
   * 获取点击导航的目标类型（处理数组元素情况）
   * 如果是数组且元素是对象，返回元素类型
   */
  getNavigationTarget(
    typeInfo: TypeInfo,
    typeName: string,
  ): { typeInfo: FullTypeInfo; name: string } | null {
    const resolved = this.resolveRef(typeInfo);

    // 数组：与 UI 一致，可展开时导航到元素类型（对象 / 联合 / 别名联合等）
    if (resolved.kind === 'array' && resolved.elementType) {
      const resolvedElement = this.resolveRef(resolved.elementType);
      if (resolvedElement.kind === 'object' && resolvedElement.properties) {
        const elementName =
          getTypeName(resolvedElement) ||
          typeName.replace(/\[\]\s*$/, '').trim();
        return { typeInfo: resolvedElement, name: elementName };
      }
      if (this.isExpandable(resolved.elementType)) {
        const elementName =
          getTypeName(resolvedElement) ||
          typeName.replace(/\[\]\s*$/, '').trim();
        return { typeInfo: resolvedElement, name: elementName };
      }
    }

    return { typeInfo: resolved, name: typeName };
  }

  /**
   * 获取类型的属性条目列表
   */
  getPropertyEntries(typeInfo: TypeInfo): [string, TypeInfo][] {
    const resolved = this.resolveRef(typeInfo);
    return Object.entries(resolved.properties ?? {});
  }

  /**
   * 判断是否为函数类型
   */
  isFunctionType(typeInfo: TypeInfo): boolean {
    const resolved = this.resolveRef(typeInfo);
    return resolved.kind === 'function';
  }

  /**
   * 获取函数签名列表（支持函数重载）
   */
  getFunctionSignatures(typeInfo: TypeInfo): FunctionSignature[] {
    const resolved = this.resolveRef(typeInfo);
    return resolved.signatures ?? [];
  }

  /**
   * 获取类型的渲染信息
   * 用于 UI 层根据类型决定渲染方式
   */
  getTypeRenderInfo(typeInfo: TypeInfo): TypeRenderInfo {
    const resolved = this.resolveRef(typeInfo);
    const {
      kind,
      renderHint,
      text,
      enumValues,
      unionTypes,
      elementType,
      signatures,
    } = resolved;

    // renderHint 优先：不可展开类型
    if (renderHint) {
      const name = getTypeName(resolved);

      switch (renderHint) {
        case 'builtin':
        case 'external':
        case 'index-access':
          return {
            type: RENDER_TYPE.EXTERNAL,
            name,
          };

        case 'circular': {
          const sourceHint = resolved.sourceFile
            ? `${resolved.sourceFile}${
                resolved.sourceLine ? `:${resolved.sourceLine}` : ''
              }`
            : undefined;
          return {
            type: RENDER_TYPE.CIRCULAR,
            name,
            sourceHint,
            resolved,
          };
        }

        case 'truncated':
          return {
            type: RENDER_TYPE.DEFAULT,
            text: name || text,
          };

        case 'generic':
          // 泛型提示不影响渲染，继续按 kind 处理
          break;
      }
    }

    // 按 kind 分类渲染
    switch (kind) {
      // 枚举类型
      case 'enum':
        if (enumValues && enumValues.length > 0) {
          return {
            type: RENDER_TYPE.ENUM,
            values: enumValues,
          };
        }
        break;

      // 函数类型
      case 'function':
        if (signatures && signatures.length > 0) {
          return {
            type: RENDER_TYPE.FUNCTION,
            signatures,
            text,
          };
        }
        break;

      // 联合类型
      case 'union':
        if (unionTypes && unionTypes.length > 0) {
          // 有别名的联合类型（如 ApiResponse<User>、DocumentNode）
          // 先展示可点击的别名名称，点击后再展示联合成员
          // name 字段仅在检测到用户定义的类型别名时设置
          if (resolved.name) {
            const unionName = getTypeName(resolved);
            return {
              type: RENDER_TYPE.CUSTOM_EXPANDABLE,
              name: unionName,
              text: unionName,
              resolved,
            };
          }
          return {
            type: RENDER_TYPE.UNION,
            types: unionTypes,
          };
        }
        break;

      // 数组类型
      case 'array':
        if (elementType) {
          return {
            type: RENDER_TYPE.ARRAY,
            elementType,
            needsParens: this.isComplexType(elementType),
          };
        }
        break;

      // 元组类型
      case 'tuple':
        return {
          type: RENDER_TYPE.TUPLE,
          text,
          elements: resolved.tupleElements,
        };

      // 对象类型（包括没有属性的泛型对象）
      case 'object': {
        if (this.isAnonymousObject(typeInfo)) {
          return {
            type: RENDER_TYPE.INLINE_OBJECT,
            resolved,
          };
        }

        const name = this.getDisplayName(resolved, text);
        return {
          type: RENDER_TYPE.OBJECT,
          name,
          expandable: this.isExpandable(resolved),
          resolved,
        };
      }

      // 原始类型
      case 'primitive':
      case 'literal':
        return {
          type: RENDER_TYPE.PRIMITIVE,
          text,
        };
    }

    // 可展开的自定义类型（兜底）
    const customTypeName = this.extractCustomTypeName(text);
    if (customTypeName && this.isExpandable(resolved)) {
      return {
        type: RENDER_TYPE.CUSTOM_EXPANDABLE,
        name: customTypeName,
        text,
        resolved,
      };
    }

    // 默认
    return {
      type: RENDER_TYPE.DEFAULT,
      text,
    };
  }
}
