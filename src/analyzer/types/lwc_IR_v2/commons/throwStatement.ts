import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isThrowStatement, type ThrowStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type ThrowStatementFields = TypeField<'throwStatement'> & {
    argument: ExpressionTypeClass;
};

export class ThrowStatementTypeClass extends LwcCommonTypeClass<
    'throwStatement',
    ThrowStatementFields
> {
    private constructor(value: FieldsOf<ThrowStatementFields>, sourceSpan: SourceSpan) {
        super('throwStatement', value, sourceSpan);
    }

    static create(target: ThrowStatement, originalSource: string): ThrowStatementTypeClass {
        return new ThrowStatementTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): ThrowStatementFields['argument'] {
        return this.getFields().argument;
    }
}

export const throwStatementTypePair: EvaluatePair<ThrowStatement, ThrowStatementTypeClass> =
    makeEvaluatePair(isThrowStatement, (target, originalSource) =>
        ThrowStatementTypeClass.create(target, originalSource),
    );

export const isThrowStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ThrowStatementTypeClass => target instanceof ThrowStatementTypeClass;
