import {
    ConstructorDeclarationJson,
    ErrorJson,
    MethodDeclarationJson,
    ParameterJson,
} from '../../../../types';

import {
    Identity,
    ListOrErrorDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Sources,
    ValueDiff,
    makeListOrErrorDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
} from '../commons';
import { ParametersDiff, makeParametersDiff } from '../parameter';
import { TypeWithVoidDiff, makeTypeWithVoidDiff } from '../type';
import { BlockDiff, Statement, makeBlockDiff } from './commons';

/** block が無いのは abstract など本体のない宣言 (空の本体 `{ }` とは別物) */
export type MethodDiff = NodeDiff<
    'method',
    MethodDeclarationJson,
    {
        name: ValueDiff<string | ErrorJson>;
        returnType: TypeWithVoidDiff;
        param: ListOrErrorDiff<ParametersDiff, ParameterJson | ErrorJson>;
        block: OptionalDiff<Statement[], BlockDiff>;
    }
>;

export const makeMethodDiff = (
    before: MethodDeclarationJson | ErrorJson,
    after: MethodDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<MethodDeclarationJson | ErrorJson>,
): MethodDiff => {
    return makeNodeDiff(
        'method',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            returnType: makeTypeWithVoidDiff(b.returnType, a.returnType),
            param: makeListOrErrorDiff(b.param, a.param, (bp, ap) =>
                makeParametersDiff(bp, ap, sources),
            ),
            block: makeOptionalDiff(b.block, a.block, (bb, ab) => makeBlockDiff(bb, ab, sources)),
        }),
        identity,
    );
};

export type ConstructorDiff = NodeDiff<
    'constructor',
    ConstructorDeclarationJson,
    {
        name: ValueDiff<ConstructorDeclarationJson['name']>;
        param: ListOrErrorDiff<ParametersDiff, ParameterJson | ErrorJson>;
        block: BlockDiff;
    }
>;

export const makeConstructorDiff = (
    before: ConstructorDeclarationJson | ErrorJson,
    after: ConstructorDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<ConstructorDeclarationJson | ErrorJson>,
): ConstructorDiff => {
    return makeNodeDiff(
        'constructor',
        before,
        after,
        match,
        (b, a) => ({
            // 修飾名は配列ごと値として比べる
            name: makeValueDiff(b.name, a.name),
            param: makeListOrErrorDiff(b.param, a.param, (bp, ap) =>
                makeParametersDiff(bp, ap, sources),
            ),
            block: makeBlockDiff(b.block, a.block, sources),
        }),
        identity,
    );
};
