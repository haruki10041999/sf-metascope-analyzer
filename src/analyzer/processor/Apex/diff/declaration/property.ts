import { AccessorContentJson, ErrorJson, PropertyDeclarationJson } from '../../../../types';

import {
    Identity,
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeSetDiff,
    makeValueDiff,
} from '../commons';
import { ModifierDiff, makeModifierDiff } from '../modifier';
import { TypeDiff, makeTypeDiff } from '../type';
import { BlockDiff, Statement, makeBlockDiff } from './commons';

/** get / set の中身。block が無いのは `get;` の自動実装 (空の本体 `get { }` とは別物) */
export type AccessorContentDiff = {
    block: OptionalDiff<Statement[], BlockDiff>;
    modifier: ModifierDiff[];
};

export const makeAccessorContentDiff = (
    before: AccessorContentJson,
    after: AccessorContentJson,
    sources?: Sources,
): AccessorContentDiff => {
    return {
        block: makeOptionalDiff(before.block, after.block, (bb, ab) =>
            makeBlockDiff(bb, ab, sources),
        ),
        modifier: makeModifierDiff(before.modifier, after.modifier),
    };
};

/** 取り出せなかった get / set。B. 集合なので unchanged / added / removed だけ */
export type ErrorsDiff = ListItemDiff<'error', ErrorJson, NodeDiff<'error', ErrorJson, undefined>>;

export const makeErrorsDiff = (before: ErrorJson[], after: ErrorJson[]): ErrorsDiff[] => {
    return makeSetDiff('error', before, after, (b, a, match) =>
        makeNodeDiff('error', b, a, match, () => undefined),
    );
};

/** isGetter / isSetter は getterContent / setterContent の有無と同じ情報なので持たない */
export type PropertyDiff = NodeDiff<
    'property',
    PropertyDeclarationJson,
    {
        name: ValueDiff<string | ErrorJson>;
        variantType: TypeDiff;
        getterContent: OptionalDiff<AccessorContentJson, AccessorContentDiff>;
        setterContent: OptionalDiff<AccessorContentJson, AccessorContentDiff>;
        error: ErrorsDiff[];
    }
>;

export const makePropertyDiff = (
    before: PropertyDeclarationJson | ErrorJson,
    after: PropertyDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<PropertyDeclarationJson | ErrorJson>,
): PropertyDiff => {
    return makeNodeDiff(
        'property',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            variantType: makeTypeDiff(b.variantType, a.variantType),
            getterContent: makeOptionalDiff(b.getterContent, a.getterContent, (bg, ag) =>
                makeAccessorContentDiff(bg, ag, sources),
            ),
            setterContent: makeOptionalDiff(b.setterContent, a.setterContent, (bs, as) =>
                makeAccessorContentDiff(bs, as, sources),
            ),
            error: makeErrorsDiff(b.error ?? [], a.error ?? []),
        }),
        identity,
    );
};
