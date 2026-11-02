import {
    ErrorJson,
    InterfaceDeclarationJson,
    InterfaceMethodJson,
    ParameterJson,
    TypeJson,
} from '../../../../types';

import {
    Identity,
    ListItemDiff,
    ListOrErrorDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeListOrErrorDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../commons';
import { ParametersDiff, makeParametersDiff } from '../parameter';
import { TypeWithVoidDiff, TypesDiff, makeTypeWithVoidDiff, makeTypesDiff } from '../type';
import { ModifierDiff, makeModifierDiff } from '../modifier';
import { getSignatureKey } from './commons';

export type InterfaceMethodDiff = NodeDiff<
    'interfaceMethod',
    InterfaceMethodJson,
    {
        name: ValueDiff<string | ErrorJson>;
        returnType: TypeWithVoidDiff;
        param: ListOrErrorDiff<ParametersDiff, ParameterJson | ErrorJson>;
        modifier: ModifierDiff[];
    }
>;

export const makeInterfaceMethodDiff = (
    before: InterfaceMethodJson | ErrorJson,
    after: InterfaceMethodJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
): InterfaceMethodDiff => {
    return makeNodeDiff('interfaceMethod', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        returnType: makeTypeWithVoidDiff(b.returnType, a.returnType),
        param: makeListOrErrorDiff(b.param, a.param, (bp, ap) =>
            makeParametersDiff(bp, ap, sources),
        ),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    }));
};

/**
 * interface のメソッドの識別キー。オーバーロードを区別するため、名前とパラメータ型の並びを使う。
 * 名前やパラメータリストがエラーのものはキーを持たない (集合として比べる)。
 */
export const getInterfaceMethodKey = (
    target: InterfaceMethodJson | ErrorJson,
): string | undefined => {
    return target.kind === 'error' ? undefined : getSignatureKey(target.name, target.param);
};

/** interface の本文は D. キー対応 */
export type InterfaceMethodsDiff = ListItemDiff<
    'interfaceMethod',
    InterfaceMethodJson | ErrorJson,
    InterfaceMethodDiff
>;

export const makeInterfaceMethodsDiff = (
    before: (InterfaceMethodJson | ErrorJson)[],
    after: (InterfaceMethodJson | ErrorJson)[],
    sources?: Sources,
): InterfaceMethodsDiff[] => {
    return makeKeyedDiff(
        'interfaceMethod',
        before,
        after,
        (b, a, match) => makeInterfaceMethodDiff(b, a, match, sources),
        getInterfaceMethodKey,
        sources,
    );
};

export type InterfaceDiff = NodeDiff<
    'interface',
    InterfaceDeclarationJson,
    {
        name: ValueDiff<string | ErrorJson>;
        extend: ListOrErrorDiff<TypesDiff, TypeJson | ErrorJson>;
        block: ListOrErrorDiff<InterfaceMethodsDiff, InterfaceMethodJson | ErrorJson>;
    }
>;

export const makeInterfaceDiff = (
    before: InterfaceDeclarationJson | ErrorJson,
    after: InterfaceDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<InterfaceDeclarationJson | ErrorJson>,
): InterfaceDiff => {
    return makeNodeDiff(
        'interface',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            extend: makeListOrErrorDiff(b.extend, a.extend, (be, ae) =>
                makeTypesDiff(be, ae, sources),
            ),
            block: makeListOrErrorDiff(b.block, a.block, (bb, ab) =>
                makeInterfaceMethodsDiff(bb, ab, sources),
            ),
        }),
        identity,
    );
};
