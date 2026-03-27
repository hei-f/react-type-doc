import { describe, expect, it, vi } from 'vitest';

vi.mock('@uiw/react-codemirror', () => {
  throw new Error(
    'react-type-doc/ui should not eagerly load CodeMirror dependencies',
  );
});

describe('react-type-doc/ui entry', () => {
  it('can be imported without loading the editor dependencies', async () => {
    const ui = await import('../index');

    expect(ui.TypeDocPanel).toBeTypeOf('function');
    expect(ui.TypeDocEditorPanelLazy).toBeDefined();
  });
});
