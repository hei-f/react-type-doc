/**
 * TypeDocEditorPanel - CodeMirror 版本的类型文档面板
 * @description 使用 CodeMirror 6 展示类型代码；可点击类型用 Decoration + 主题样式区分
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, lineNumbers } from '@codemirror/view';
import { bracketMatching, codeFolding, foldGutter } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import type { TypeDocPanelProps } from '../panel/TypeDocPanel';
import { useTypeNavigation } from '../panel/hooks/useTypeNavigation';
import {
  typeInfoToCodeWithMeta,
  getClickableRanges,
  type ClickableRange,
  type JSDocBlockMeta,
  type SemanticRangeMeta,
} from './typeToCode';
import {
  TypeDocPanelContainer,
  PanelHeader,
  PanelTitle,
  BreadcrumbWrapper,
  BreadcrumbContainer,
  BreadcrumbItem,
  BreadcrumbSeparator,
  SourceLocation,
  EmptyState,
} from '../shared/styled';
import { en } from '../shared/locale';
import { formatTypeDeclarationName } from '../shared/generic';
import {
  CODE_MIRROR_CLICKABLE_TYPE_THEME,
  CODE_MIRROR_COMPONENT_ROOT_STYLE,
  CODE_MIRROR_JSDOC_LINK_THEME,
  CODE_MIRROR_LAYOUT_AND_SCROLLBAR_THEME,
  CODE_MIRROR_MATCHING_BRACKET_THEME,
  CODE_MIRROR_OUTER_WRAPPER_STYLE,
  CODE_MIRROR_RAINBOW_BRACKET_THEME,
  CODE_MIRROR_SEMANTIC_THEME,
} from './codeMirror/constants';
import {
  clickableRangeToOffsets,
  createClickableDecorationsField,
  requestClickableDecorationsRebuildEffect,
} from './codeMirror/clickableDecorations';
import {
  createSemanticDecorationsField,
  requestSemanticDecorationsRebuildEffect,
} from './codeMirror/semanticDecorations';
import {
  buildJSDocClickTargetsFromCode,
  createJSDocDecorationsField,
  requestJSDocDecorationsRebuildEffect,
  type JSDocClickTarget,
} from './codeMirror/jsdocDecorations';
import { rainbowBracketsField } from './codeMirror/rainbowBrackets';

/**
 * TypeDocEditorPanel 组件
 * 基于 CodeMirror 的类型文档展示面板
 */
export const TypeDocEditorPanel: React.FC<TypeDocPanelProps> = (props) => {
  const { typeKey, titlePrefix, data, locale = en } = props;

  const {
    reader,
    historyStack,
    currentTypeInfo,
    currentTitle,
    isInNestedView,
    handleTypeClick,
    navigateToLevel,
  } = useTypeNavigation(typeKey, titlePrefix, data, locale);

  const editorViewRef = useRef<EditorView | null>(null);
  /** 与装饰重建、点击判定同步，避免闭包读到旧 ranges */
  const clickableRangesRef = useRef<ClickableRange[]>([]);
  const handleTypeClickRef = useRef(handleTypeClick);
  const clickHoverTitleRef = useRef(locale.clickToViewType);
  const [editorCode, setEditorCode] = useState<string>('');
  const editorCodeRef = useRef('');
  const semanticRangesRef = useRef<SemanticRangeMeta[]>([]);
  const jsdocBlocksRef = useRef<JSDocBlockMeta[]>([]);
  const jsdocClicksRef = useRef<JSDocClickTarget[]>([]);
  const readerRef = useRef(reader);
  const localeRef = useRef(locale);

  handleTypeClickRef.current = handleTypeClick;
  clickHoverTitleRef.current = locale.clickToViewType;
  readerRef.current = reader;
  localeRef.current = locale;

  const codeMirrorExtensions = useMemo(
    () => [
      javascript({ typescript: true }),
      oneDark,
      bracketMatching(),
      ...indentationMarkers({
        highlightActiveBlock: true,
        markerType: 'fullScope',
        thickness: 1,
        colors: {
          dark: 'rgba(171, 178, 191, 0.14)',
          activeDark: 'rgba(171, 178, 191, 0.34)',
        },
      }),
      lineNumbers(),
      codeFolding(),
      foldGutter(),
      CODE_MIRROR_LAYOUT_AND_SCROLLBAR_THEME,
      CODE_MIRROR_RAINBOW_BRACKET_THEME,
      rainbowBracketsField,
      CODE_MIRROR_MATCHING_BRACKET_THEME,
      CODE_MIRROR_JSDOC_LINK_THEME,
      CODE_MIRROR_SEMANTIC_THEME,
      createSemanticDecorationsField(() => semanticRangesRef.current),
      createJSDocDecorationsField(
        () => editorCodeRef.current,
        () => jsdocBlocksRef.current,
        () => readerRef.current!,
        () => (typeName: string) => localeRef.current.clickToView(typeName),
      ),
      CODE_MIRROR_CLICKABLE_TYPE_THEME,
      createClickableDecorationsField(
        () => clickableRangesRef.current,
        () => clickHoverTitleRef.current,
      ),
      EditorView.domEventHandlers({
        mousedown: (event, view) => {
          const pos = view.posAtCoords(
            { x: event.clientX, y: event.clientY },
            false,
          );
          if (pos === null) {
            return false;
          }
          for (const js of jsdocClicksRef.current) {
            const jo = clickableRangeToOffsets(view.state.doc, js.range);
            if (!jo || pos < jo.from || pos >= jo.to) {
              continue;
            }
            event.preventDefault();
            if (js.kind === 'url' && js.href) {
              try {
                window.open(js.href, '_blank', 'noopener,noreferrer');
              } catch (err) {
                console.error('打开 JSDoc URL 失败', err);
              }
              return true;
            }
            if (js.kind === 'type' && js.typeInfo) {
              handleTypeClickRef.current(
                js.typeInfo,
                js.typeName ?? '',
                undefined,
              );
              return true;
            }
          }
          for (const clickable of clickableRangesRef.current) {
            const offsets = clickableRangeToOffsets(
              view.state.doc,
              clickable.range,
            );
            if (!offsets) {
              continue;
            }
            if (pos >= offsets.from && pos < offsets.to) {
              event.preventDefault();
              handleTypeClickRef.current(
                clickable.typeInfo,
                clickable.typeName,
                clickable.fieldName,
              );
              return true;
            }
          }
          return false;
        },
      }),
    ],
    [],
  );

  if (!data || !reader) {
    return (
      <TypeDocPanelContainer>
        <EmptyState>{locale.dataNotLoaded}</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const typeInfo = reader.getRaw(typeKey);

  if (!typeInfo) {
    return (
      <TypeDocPanelContainer>
        <EmptyState>{locale.typeNotFound(typeKey)}</EmptyState>
      </TypeDocPanelContainer>
    );
  }

  const resolved = reader.resolveRef(typeInfo);

  const rootDisplayName = resolved.genericParameters?.length
    ? formatTypeDeclarationName(
        reader.getDisplayName(resolved, typeKey),
        resolved.genericParameters,
      )
    : reader.getDisplayName(resolved, typeKey);
  const rootDisplayTitle = titlePrefix
    ? `${titlePrefix} - ${rootDisplayName}`
    : rootDisplayName;

  const currentTypeInfoToRender = currentTypeInfo || typeInfo;
  const resolvedCurrentType = currentTypeInfo
    ? reader.resolveRef(currentTypeInfo)
    : null;
  const isNestedUnion = isInNestedView && resolvedCurrentType?.kind === 'union';

  const displayTypeName = resolvedCurrentType
    ? resolvedCurrentType.genericParameters?.length
      ? formatTypeDeclarationName(
          reader.getDisplayName(resolvedCurrentType, currentTitle),
          resolvedCurrentType.genericParameters,
        )
      : reader.getDisplayName(resolvedCurrentType, currentTitle)
    : currentTitle;

  const propEntries = reader.getPropertyEntries(currentTypeInfoToRender);

  const panelTitleText = isInNestedView
    ? isNestedUnion
      ? displayTypeName
      : `${displayTypeName} — ${locale.propertiesCount(propEntries.length)}`
    : `${rootDisplayTitle} — ${locale.propertiesCount(propEntries.length)}`;

  const requestDecorationsRebuild = useCallback(() => {
    const view = editorViewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: [
        requestClickableDecorationsRebuildEffect.of(null),
        requestSemanticDecorationsRebuildEffect.of(null),
        requestJSDocDecorationsRebuildEffect.of(null),
      ],
    });
  }, []);

  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      editorViewRef.current = view;
      requestDecorationsRebuild();
    },
    [requestDecorationsRebuild],
  );

  useEffect(() => {
    const { code, jsdocBlocks, semanticRanges } = typeInfoToCodeWithMeta(
      currentTypeInfoToRender,
      reader,
      isInNestedView ? displayTypeName : rootDisplayName,
      isInNestedView,
    );
    const ranges = getClickableRanges(code, currentTypeInfoToRender, reader);
    clickableRangesRef.current = ranges;
    editorCodeRef.current = code;
    semanticRangesRef.current = semanticRanges;
    jsdocBlocksRef.current = jsdocBlocks;
    jsdocClicksRef.current = buildJSDocClickTargetsFromCode(
      code,
      jsdocBlocks,
      reader,
      (name) => locale.clickToView(name),
    );
    setEditorCode(code);
    requestDecorationsRebuild();
  }, [
    currentTypeInfoToRender,
    reader,
    displayTypeName,
    rootDisplayName,
    isInNestedView,
    locale,
    requestDecorationsRebuild,
  ]);

  return (
    <TypeDocPanelContainer style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <PanelHeader>
        <PanelTitle title={panelTitleText}>{panelTitleText}</PanelTitle>
      </PanelHeader>

      <BreadcrumbWrapper $visible={isInNestedView}>
        <BreadcrumbContainer>
          <BreadcrumbItem
            $clickable
            title={rootDisplayTitle}
            onClick={() => navigateToLevel(-1)}
          >
            {rootDisplayTitle}
          </BreadcrumbItem>
          {historyStack.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>›</BreadcrumbSeparator>
              <BreadcrumbItem
                $clickable={index < historyStack.length - 1}
                title={item.title}
                onClick={() => {
                  if (index < historyStack.length - 1) {
                    navigateToLevel(index);
                  }
                }}
              >
                {item.title}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbContainer>
      </BreadcrumbWrapper>

      <div style={CODE_MIRROR_OUTER_WRAPPER_STYLE}>
        <CodeMirror
          value={editorCode}
          height="100%"
          style={CODE_MIRROR_COMPONENT_ROOT_STYLE}
          theme="none"
          readOnly
          basicSetup={false}
          extensions={codeMirrorExtensions}
          onCreateEditor={handleCreateEditor}
        />
      </div>

      {isInNestedView && resolvedCurrentType?.sourceFile && (
        <SourceLocation>
          {'📍 '}
          {resolvedCurrentType.sourceFile}
          {resolvedCurrentType.sourceLine
            ? `:${resolvedCurrentType.sourceLine}`
            : ''}
        </SourceLocation>
      )}
    </TypeDocPanelContainer>
  );
};
