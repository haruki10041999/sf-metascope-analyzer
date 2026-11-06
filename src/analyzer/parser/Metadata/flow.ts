import { makeFlowJson } from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// Flow の parser。方針: docs/metadata-implementation.md 10 章

export const FlowParser = new MetadataFolderParser({
    type: 'flow',
    folder: 'flows',
    suffix: '.flow-meta.xml',
    make: makeFlowJson,
});

export type FlowParseResult = ParseResultOf<typeof FlowParser>;
