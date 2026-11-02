import { EnumConstantJson, EnumDeclarationJson, ErrorJson } from '../../../../types';

import {
    Identity,
    ListItemDiff,
    ListOrErrorDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeListOrErrorDiff,
    makeNodeDiff,
    makeSequenceDiff,
    makeValueDiff,
} from '../commons';

export type EnumConstantDiff = NodeDiff<
    'enumConstant',
    EnumConstantJson,
    { name: ValueDiff<string> }
>;

export const makeEnumConstantDiff = (
    before: EnumConstantJson | ErrorJson,
    after: EnumConstantJson | ErrorJson,
    match: Match = 'slot',
): EnumConstantDiff => {
    return makeNodeDiff('enumConstant', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
    }));
};

/** enum 定数は ordinal() が並び順で決まるので C. 順序付き列 */
export type EnumConstantsDiff = ListItemDiff<
    'enumConstant',
    EnumConstantJson | ErrorJson,
    EnumConstantDiff
>;

export const makeEnumConstantsDiff = (
    before: (EnumConstantJson | ErrorJson)[],
    after: (EnumConstantJson | ErrorJson)[],
    sources?: Sources,
): EnumConstantsDiff[] => {
    return makeSequenceDiff('enumConstant', before, after, makeEnumConstantDiff, { sources });
};

export type EnumDiff = NodeDiff<
    'enum',
    EnumDeclarationJson,
    {
        name: ValueDiff<string | ErrorJson>;
        members: ListOrErrorDiff<EnumConstantsDiff, EnumConstantJson | ErrorJson>;
    }
>;

export const makeEnumDiff = (
    before: EnumDeclarationJson | ErrorJson,
    after: EnumDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<EnumDeclarationJson | ErrorJson>,
): EnumDiff => {
    return makeNodeDiff(
        'enum',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            members: makeListOrErrorDiff(b.members, a.members, (bm, am) =>
                makeEnumConstantsDiff(bm, am, sources),
            ),
        }),
        identity,
    );
};
