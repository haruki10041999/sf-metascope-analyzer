import { makeFlexiPageJson, makeLayoutJson } from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// 画面 (ページレイアウト・Lightning ページ) の parser。方針: docs/metadata-implementation.md 10 章

export const LayoutParser = new MetadataFolderParser({
    type: 'layout',
    folder: 'layouts',
    suffix: '.layout-meta.xml',
    make: makeLayoutJson,
});

export const FlexiPageParser = new MetadataFolderParser({
    type: 'flexiPage',
    folder: 'flexipages',
    suffix: '.flexipage-meta.xml',
    make: makeFlexiPageJson,
});

export type LayoutParseResult = ParseResultOf<typeof LayoutParser>;
export type FlexiPageParseResult = ParseResultOf<typeof FlexiPageParser>;
