#!/usr/bin/env node
// sf-metascope のコマンド (src/cli/index.ts をビルドしたもの)。先に npm run build が要る
import { main } from '../dist/node/cli/index.js';

await main();
