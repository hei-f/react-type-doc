import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveUserModuleResolution } from '../generate';

describe('resolveUserModuleResolution', () => {
  const tmpDir = path.join(__dirname, '.tmp-tsconfig-test');

  function writeTsConfig(fileName: string, content: object): string {
    const filePath = path.join(tmpDir, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content));
    return filePath;
  }

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('直接设置 moduleResolution 时应返回对应枚举值', () => {
    const configPath = writeTsConfig('tsconfig.json', {
      compilerOptions: { moduleResolution: 'bundler' },
    });

    const result = resolveUserModuleResolution(configPath);
    // ModuleResolutionKind.Bundler = 100
    expect(result).toBe(100);
  });

  it('通过 extends 继承 moduleResolution 时应返回对应枚举值', () => {
    writeTsConfig('base.json', {
      compilerOptions: { moduleResolution: 'bundler' },
    });
    const configPath = writeTsConfig('tsconfig.json', {
      extends: './base.json',
      compilerOptions: { strict: true },
    });

    const result = resolveUserModuleResolution(configPath);
    expect(result).toBe(100);
  });

  it('完全未设置 moduleResolution 时应返回 undefined', () => {
    const configPath = writeTsConfig('tsconfig.json', {
      compilerOptions: { strict: true },
    });

    const result = resolveUserModuleResolution(configPath);
    expect(result).toBeUndefined();
  });

  it('多层 extends 继承 moduleResolution 时应正确传递', () => {
    writeTsConfig('grandparent.json', {
      compilerOptions: { moduleResolution: 'node16' },
    });
    writeTsConfig('parent.json', {
      extends: './grandparent.json',
      compilerOptions: { strict: true },
    });
    const configPath = writeTsConfig('tsconfig.json', {
      extends: './parent.json',
      compilerOptions: { esModuleInterop: true },
    });

    const result = resolveUserModuleResolution(configPath);
    // ModuleResolutionKind.Node16 = 3
    expect(result).toBe(3);
  });
});
