import { isCatchClause, type CatchClause } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';

const catchClauseParamPairs = lazyPairs(
    () => [identifierTypePair, arrayPatternTypePair, objectPatternTypePair] as const,
);
const catchClauseBodyPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type CatchClauseFields = {
    param:
        | IdentifierTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | LwcErrorTypeClass
        | null;
    body: BlockStatementTypeClass | LwcErrorTypeClass;
};

export class CatchClauseTypeClass extends LwcCommonTypeClass<'catchClause'> {
    private readonly value: CatchClauseFields;

    private constructor(value: CatchClauseFields) {
        super('catchClause');
        this.value = value;
    }

    static create(target: CatchClause, originalSource: string): CatchClauseTypeClass {
        return new CatchClauseTypeClass({
            param: visitOptionalNode(
                target.param,
                originalSource,
                catchClauseParamPairs(),
                'CatchClause.param',
            ),
            body: visitNode(
                target.body,
                originalSource,
                catchClauseBodyPairs(),
                'CatchClause.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): CatchClauseFields {
        return this.value;
    }

    getParam(): CatchClauseFields['param'] {
        return this.value.param;
    }

    getBody(): CatchClauseFields['body'] {
        return this.value.body;
    }
}

export const catchClauseTypePair: EvaluatePair<CatchClause, CatchClauseTypeClass> =
    makeEvaluatePair(isCatchClause, (target, originalSource) =>
        CatchClauseTypeClass.create(target, originalSource),
    );

export const isCatchClauseType = (
    target: LwcCommonTypeClass<string>,
): target is CatchClauseTypeClass => target instanceof CatchClauseTypeClass;
