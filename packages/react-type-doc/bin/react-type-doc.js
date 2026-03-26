#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';

const cliUrl = new URL('../dist/cli.js', import.meta.url);
const cliPath = fileURLToPath(cliUrl);

if (!fs.existsSync(cliPath)) {
  console.error(
    'react-type-doc CLI not found. Run `pnpm build` before invoking the binary.',
  );
  process.exit(1);
}

await import(cliUrl.href);
