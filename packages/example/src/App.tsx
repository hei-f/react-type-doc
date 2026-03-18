import { useState, useEffect } from 'react';
import { loader } from '@monaco-editor/react';
import type { OutputResult } from 'react-type-doc';
import type { ComponentDoc } from 'react-docgen-typescript';
import { TypeDocPanel, zhCN } from 'react-type-doc/ui';
import ReactDocgenTsViewer from './components/ReactDocgenTsViewer';
import ComparisonView from './components/ComparisonView';
import reactTypeDocDataRaw from '../benchmark-output/react-type-doc.json';
import reactDocgenTsDataRaw from '../benchmark-output/react-docgen-typescript.json';
import './App.css';

const reactTypeDocData = reactTypeDocDataRaw as unknown as OutputResult;
const reactDocgenTsData = reactDocgenTsDataRaw as unknown as ComponentDoc[];

// 预加载 Monaco Editor
loader.init();

/** 类型分组列表 */
const TYPE_GROUPS = [
  {
    group: '组件 Props',
    types: [
      { key: 'BasicComponent', label: '基础组件 Props' },
      { key: 'GenericComponent', label: '泛型组件 Props' },
      { key: 'ComplexPropsComponent', label: '复杂 Props 组件' },
      { key: 'NamespacedComponent', label: '命名空间组件 Props' },
    ],
  },
  {
    group: '基础类型',
    types: [
      { key: 'PrimitiveTypes', label: '原始类型' },
      { key: 'LiteralTypes', label: '字面量类型' },
      { key: 'ArrayTypes', label: '数组类型' },
      { key: 'TupleTypes', label: '元组类型' },
      { key: 'FunctionTypes', label: '函数类型' },
    ],
  },
  {
    group: '复合类型',
    types: [
      { key: 'NestedObject', label: '嵌套对象' },
      { key: 'ApiResponse', label: '可辨识联合类型' },
      { key: 'DocumentNode', label: '复杂联合类型' },
      { key: 'FullEntity', label: '交叉类型' },
      { key: 'Dictionary', label: '索引签名类型' },
      { key: 'LongAnonymousTypes', label: '超长匿名对象/函数' },
    ],
  },
  {
    group: '泛型',
    types: [
      { key: 'Box', label: '基础泛型' },
      { key: 'Repository', label: '泛型约束' },
      { key: 'StringBox', label: '实例化 - Box<string>' },
      { key: 'StringNumberPair', label: '实例化 - Pair<string, number>' },
      { key: 'DefaultResponse', label: '实例化 - 默认类型参数' },
      { key: 'UserResponse', label: '实例化 - 覆盖默认参数' },
      { key: 'StringArrayWithLength', label: '实例化 - 约束泛型' },
      { key: 'StringGenericComponent', label: '实例化 - 组件 Props<string>' },
      { key: 'StringBoxComponent', label: '实例化组件 - Box<string>' },
      { key: 'StringNumberPairComponent', label: '实例化组件 - Pair<string, number>' },
      { key: 'DefaultResponseComponent', label: '实例化组件 - Response 默认参数' },
      { key: 'UserResponseComponent', label: '实例化组件 - Response<User, Error>' },
      { key: 'StringArrayWithLengthComponent', label: '实例化组件 - WithLength<string[]>' },
    ],
  },
  {
    group: '工具类型',
    types: [
      { key: 'User', label: '基础接口' },
      { key: 'UserUpdateDTO', label: 'Partial + Omit 组合' },
    ],
  },
  {
    group: '命名空间',
    types: [
      { key: 'Models.User.Entity', label: '嵌套命名空间类型' },
      { key: 'Models.Post.Entity', label: '命名空间引用' },
    ],
  },
  {
    group: '循环引用',
    types: [
      { key: 'TreeNode', label: '树形结构（自引用）' },
      { key: 'Department', label: '复杂循环引用' },
    ],
  },
  {
    group: '外部类型',
    types: [{ key: 'ReactComponentProps', label: 'React 类型引用' }],
  },
  {
    group: '注释风格测试（scanDirs）',
    types: [
      { key: 'CommentStyles', label: '注释风格组件 Props' },
      { key: 'CommentStyles/SingleLineDocInterface', label: '单行 JSDoc 接口' },
      { key: 'CommentStyles/MultiLineDocInterface', label: '多行 JSDoc 接口' },
      { key: 'CommentStyles/AliasWithDoc', label: 'type alias 注释' },
      { key: 'CommentStyles/DocumentedUnion', label: '联合类型注释' },
      { key: 'CommentStyles/Permission', label: 'const 对象类型注释' },
      { key: 'CommentStyles/ComplexCommentProps', label: '复杂属性注释' },
    ],
  },
];

type ViewMode = 'viewer' | 'comparison';

function App() {
  const [selectedType, setSelectedType] = useState('ComplexPropsComponent');
  const [viewMode, setViewMode] = useState<ViewMode>('viewer');

  // 预加载 Monaco Editor
  useEffect(() => {
    loader.init().then((monaco) => {
      // Monaco 已加载，可以进行额外配置
      monaco.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {},
      });
    });
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 React Type Doc</h1>
        <p className="subtitle">TypeScript 类型文档生成工具 - 交互式演示</p>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h2>选择类型</h2>
          <nav className="type-list">
            {TYPE_GROUPS.map((group) => (
              <div key={group.group} className="type-group">
                <div className="type-group-title">{group.group}</div>
                {group.types.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`type-item ${selectedType === key ? 'active' : ''}`}
                    onClick={() => setSelectedType(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="viewer">
          <div className="view-tabs">
            <button
              className={`tab-button ${viewMode === 'viewer' ? 'active' : ''}`}
              onClick={() => setViewMode('viewer')}
            >
              📖 类型查看器
            </button>
            <button
              className={`tab-button ${viewMode === 'comparison' ? 'active' : ''}`}
              onClick={() => setViewMode('comparison')}
            >
              🔍 数据对比
            </button>
          </div>

          <div className="view-content">
            {viewMode === 'viewer' ? (
              <div className="viewer-comparison">
                <div className="viewer-panel">
                  <div className="viewer-panel-label">
                    react-type-doc（本工具）
                  </div>
                  <TypeDocPanel
                    typeKey={selectedType}
                    titlePrefix="类型"
                    data={reactTypeDocData}
                    locale={zhCN}
                  />
                </div>
                <div className="viewer-panel">
                  <div className="viewer-panel-label">
                    react-docgen-typescript
                  </div>
                  <ReactDocgenTsViewer
                    typeKey={selectedType}
                    titlePrefix="组件 Props"
                    data={reactDocgenTsData}
                  />
                </div>
              </div>
            ) : (
              <ComparisonView
                typeKey={selectedType}
                reactTypeDocData={reactTypeDocData}
                reactDocgenTsData={reactDocgenTsData}
              />
            )}
          </div>
        </main>
      </div>

      <footer className="app-footer">
        <p>
          💡 点击左侧列表切换类型 | 📖 类型查看器：并排对比两个工具的展示效果 |
          🔍 数据对比：查看工具生成的原始 JSON 数据（react-docgen-typescript
          仅支持组件 Props）
        </p>
      </footer>
    </div>
  );
}

export default App;
