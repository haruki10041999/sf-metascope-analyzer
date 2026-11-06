import { makeFlowJson } from '../../types';
import { MetadataFolderParser } from './folder';
import type { ParseResultOf } from './permission';

// Flow の parser。方針: docs/metadata-a-plan.md 6 章

export const FlowParser = new MetadataFolderParser({
    type: 'flow',
    folder: 'flows',
    suffix: '.flow-meta.xml',
    make: makeFlowJson,
});

export type FlowParseResult = ParseResultOf<typeof FlowParser>;
