import { makeCustomLabelsJson } from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// カスタム表示ラベルの parser。方針: docs/metadata-a-plan.md 5 章

export const CustomLabelsParser = new MetadataFolderParser({
    type: 'customLabels',
    folder: 'labels',
    suffix: '.labels-meta.xml',
    make: makeCustomLabelsJson,
});

export type CustomLabelsParseResult = ParseResultOf<typeof CustomLabelsParser>;
