import { WEB_LINK_SCHEMA, WebLinkJson } from '../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { PropertiesDiff, makePropertiesDiff } from '../../commons/diff/present';

export type WebLinkJsonDiff = NodeDiff<
    'webLink',
    WebLinkJson,
    { fullName: ValueDiff<string> } & PropertiesDiff<typeof WEB_LINK_SCHEMA>
>;

export const makeWebLinkDiff = (
    before: WebLinkJson,
    after: WebLinkJson,
    match: Match = 'slot',
): WebLinkJsonDiff =>
    makeNodeDiff('webLink', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(WEB_LINK_SCHEMA, b, a),
    }));
