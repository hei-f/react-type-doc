import type { RenderHint } from '../shared/types';
import { RENDER_HINT } from '../shared/types';

/** Locale definition for TypeDocPanel i18n */
export interface TypeDocLocale {
  /** Tooltip text for each RenderHint */
  renderHintTitles: Record<RenderHint, string>;

  /** Shown when typeDocData is null or reader is unavailable */
  dataNotLoaded: string;
  /** Shown when the requested typeKey is not found in data */
  typeNotFound: (typeKey: string) => string;
  /** Shown when the type has zero properties */
  noProperties: string;
  /** Inline comment when nested type has no expandable properties */
  noExpandableProperties: string;

  /** Fallback tooltip for external types without a specific renderHint */
  externalTypeDefault: string;
  /** Tooltip for circular reference (name + optional sourceHint) */
  circularRef: (name: string, sourceHint?: string) => string;
  /** Tooltip when a generic type is expandable (click to view structure) */
  genericExpandable: (name: string) => string;
  /** Generic "click to view type definition" tooltip */
  clickToViewType: string;
  /** Tooltip when a generic type cannot be expanded */
  genericCannotExpand: (name: string) => string;
  /** "Click to view details" tooltip for union members */
  clickToViewDetails: string;
  /** "Click to view {typeName}" tooltip for @link references */
  clickToView: (typeName: string) => string;

  /** Display name for anonymous objects */
  anonymousObject: string;
  /** Display name for anonymous objects within a named field */
  anonymousObjectField: (fieldName: string, summary?: string) => string;
  /** Display name for union members (e.g., "Member 1") */
  unionMember: (index: number) => string;

  /** Header label showing property count (e.g., "— 3 properties") */
  propertiesCount: (count: number) => string;
}

/** English locale (default) */
export const en: TypeDocLocale = {
  renderHintTitles: {
    [RENDER_HINT.Builtin]: 'TypeScript built-in type',
    [RENDER_HINT.IndexAccess]:
      'Index access type, cannot be expanded at definition time due to type erasure',
    [RENDER_HINT.External]: 'External library type, details not expanded',
    [RENDER_HINT.Circular]: 'Circular reference',
    [RENDER_HINT.Truncated]: 'Max parse depth reached',
    [RENDER_HINT.Generic]: 'Contains uninstantiated generic parameters',
  },

  dataNotLoaded: 'Type documentation data not loaded',
  typeNotFound: (typeKey) => `Documentation for type "${typeKey}" not found`,
  noProperties: 'This type has no property definitions',
  noExpandableProperties: 'This type has no expandable properties',

  externalTypeDefault: 'External library type, details not expanded',
  circularRef: (name, sourceHint) =>
    `Circular reference: ${name}${sourceHint ? ` (${sourceHint})` : ''}`,
  genericExpandable: (name) =>
    `${name} contains uninstantiated type parameters — click to view structure`,
  clickToViewType: 'Click to view type definition',
  genericCannotExpand: (name) =>
    `${name} contains uninstantiated type parameters and cannot be expanded at definition time`,
  clickToViewDetails: 'Click to view details',
  clickToView: (typeName) => `Click to view ${typeName}`,

  anonymousObject: '[Anonymous Object]',
  anonymousObjectField: (fieldName, summary) =>
    `.${fieldName} ${summary ?? '[Anonymous Object]'}`,
  unionMember: (index) => `Member ${index}`,

  propertiesCount: (count) => `${count} properties`,
};

/** Simplified Chinese locale */
export const zhCN: TypeDocLocale = {
  renderHintTitles: {
    [RENDER_HINT.Builtin]: 'TypeScript 内置类型',
    [RENDER_HINT.IndexAccess]: '索引访问类型，因类型擦除无法在定义时展开',
    [RENDER_HINT.External]: '外部库类型，不展开详情',
    [RENDER_HINT.Circular]: '循环引用',
    [RENDER_HINT.Truncated]: '已达到最大解析深度',
    [RENDER_HINT.Generic]: '包含未实例化的泛型参数',
  },

  dataNotLoaded: '类型文档数据未加载',
  typeNotFound: (typeKey) => `未找到类型 ${typeKey} 的文档`,
  noProperties: '该类型没有属性定义',
  noExpandableProperties: '该类型没有可展开的属性',

  externalTypeDefault: '外部库类型，不展开详情',
  circularRef: (name, sourceHint) =>
    `循环引用: ${name}${sourceHint ? ` (${sourceHint})` : ''}`,
  genericExpandable: (name) => `${name} 包含未实例化的类型参数 - 点击查看结构`,
  clickToViewType: '点击查看类型定义',
  genericCannotExpand: (name) =>
    `${name} 包含未实例化的类型参数，无法在定义时展开`,
  clickToViewDetails: '点击查看详情',
  clickToView: (typeName) => `点击查看 ${typeName}`,

  anonymousObject: '[匿名对象]',
  anonymousObjectField: (fieldName, summary) =>
    `.${fieldName} ${summary ?? '[匿名对象]'}`,
  unionMember: (index) => `成员${index}`,

  propertiesCount: (count) => `${count} 个属性`,
};
