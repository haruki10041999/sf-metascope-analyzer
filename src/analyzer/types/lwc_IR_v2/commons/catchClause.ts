import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isCatchClause, type CatchClause } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { BlockStatementTypeClass } from './blockStatement';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';

const catchClauseParamPairs = lazyPairs(
    () => [identifierTypePair, arrayPatternTypePair, objectPatternTypePair] as const,
);

export type CatchClauseFields = TypeField<'catchClause'> & {
    param: IdentifierTypeClass | ArrayPatternTypeClass | ObjectPatternTypeClass | null;
    body: BlockStatementTypeClass;
};

export class CatchClauseTypeClass extends LwcCommonTypeClass<'catchClause', CatchClauseFields> {
    private constructor(value: FieldsOf<CatchClauseFields>, sourceSpan: SourceSpan) {
        super('catchClause', value, sourceSpan);
    }

    static create(target: CatchClause, originalSource: string): CatchClauseTypeClass {
        return new CatchClauseTypeClass(
            {
                param: visitOptionalNode(
                    target.param,
                    originalSource,
                    catchClauseParamPairs(),
                    'CatchClause.param',
                ),
                body: BlockStatementTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParam(): CatchClauseFields['param'] {
        return this.getFields().param;
    }

    getBody(): CatchClauseFields['body'] {
        return this.getFields().body;
    }
}

export const catchClauseTypePair: EvaluatePair<CatchClause, CatchClauseTypeClass> =
    makeEvaluatePair(isCatchClause, (target, originalSource) =>
        CatchClauseTypeClass.create(target, originalSource),
    );

export const isCatchClauseType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is CatchClauseTypeClass => target instanceof CatchClauseTypeClass;
