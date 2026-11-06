import { makeCustomLabelsJson } from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// カスタム表示ラベルの parser。方針: docs/metadata-implementation.md 10 章

export const CustomLabelsParser = new MetadataFolderParser({
    type: 'customLabels',
    folder: 'labels',
    suffix: '.labels-meta.xml',
    // decomposeCustomLabelsBeta2: labels/<ラベル名>.label-meta.xml (ルートは CustomLabel)
    decomposed: {
        unit: 'all',
        name: 'CustomLabels',
        root: 'CustomLabels',
        children: { '.label-meta.xml': 'labels' },
    },
    make: makeCustomLabelsJson,
});

export type CustomLabelsParseResult = ParseResultOf<typeof CustomLabelsParser>;
