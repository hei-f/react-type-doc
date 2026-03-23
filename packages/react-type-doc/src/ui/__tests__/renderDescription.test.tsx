/**
 * renderDescription / JSDoc parsing tests
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OutputResult } from '../../shared/types';
import { PropsDocReader } from '../../runtime/reader';
import { en } from '../locale';
import type { TypeRenderContext } from '../types';
import {
  parseDescriptionLine,
  renderDescription,
  resolveJSDocTypeLink,
} from '../renderDescription';

const buttonType = {
  kind: 'object',
  text: 'Button',
  properties: {
    label: {
      kind: 'primitive',
      text: 'string',
      required: true,
    },
  },
};

const mockData: OutputResult = {
  generatedAt: '2026-03-23T00:00:00.000Z',
  keys: {
    Button: buttonType,
  },
  typeRegistry: {
    Button: buttonType,
  },
};

function createContext(reader: PropsDocReader): TypeRenderContext {
  return {
    reader,
    locale: en,
    onTypeClick: vi.fn(),
  } as unknown as TypeRenderContext;
}

describe('resolveJSDocTypeLink', () => {
  it('should resolve type links from registry and fallback lookup', () => {
    const reader = PropsDocReader.create(mockData);

    expect(
      resolveJSDocTypeLink('Button', reader, { Button: 'Button' }),
    ).toEqual({
      typeInfo: buttonType,
      typeName: 'Button',
    });
    expect(resolveJSDocTypeLink('Button', reader)).toEqual({
      typeInfo: buttonType,
      typeName: 'Button',
    });
  });
});

describe('parseDescriptionLine', () => {
  it('should render tags, type links, and URLs', () => {
    const reader = PropsDocReader.create(mockData);
    const onTypeClick = vi.fn();
    const context: TypeRenderContext = {
      reader,
      locale: en,
      onTypeClick,
    } as TypeRenderContext;

    render(
      <>
        {parseDescriptionLine(
          '@param See {@link Button|button docs} and https://example.com',
          context,
          { Button: 'Button' },
        )}
      </>,
    );

    expect(screen.getByText('@param')).toBeTruthy();

    const typeLink = screen.getByText('button docs');
    fireEvent.click(typeLink);
    expect(onTypeClick).toHaveBeenCalledWith(buttonType, 'Button');

    expect(
      screen
        .getByRole('link', { name: 'https://example.com' })
        .getAttribute('href'),
    ).toBe('https://example.com');
  });
});

describe('renderDescription', () => {
  it('should render multiline descriptions with indentation', () => {
    const reader = PropsDocReader.create(mockData);
    const context = createContext(reader);

    const { container } = render(
      <>{renderDescription('First line\nSecond line', 1, context)}</>,
    );

    expect(container.textContent).toContain('First line');
    expect(container.textContent).toContain('Second line');
    expect(container.textContent).toContain('/**');
    expect(container.textContent).toContain('*/');
  });
});
