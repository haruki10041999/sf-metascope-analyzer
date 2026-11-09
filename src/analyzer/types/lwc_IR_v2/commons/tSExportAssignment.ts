import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSExportAssignment, type TSExportAssignment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type TSExportAssignmentFields = TypeField<'tSExportAssignment'> & {
    expression: ExpressionTypeClass;
};

export class TSExportAssignmentTypeClass extends LwcCommonTypeClass<
    'tSExportAssignment',
    TSExportAssignmentFields
> {
    private constructor(value: FieldsOf<TSExportAssignmentFields>, sourceSpan: SourceSpan) {
        super('tSExportAssignment', value, sourceSpan);
    }

    static create(target: TSExportAssignment, originalSource: string): TSExportAssignmentTypeClass {
        return new TSExportAssignmentTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TSExportAssignmentFields['expression'] {
        return this.getFields().expression;
    }
}

export const tSExportAssignmentTypePair: EvaluatePair<
    TSExportAssignment,
    TSExportAssignmentTypeClass
> = makeEvaluatePair(isTSExportAssignment, (target, originalSource) =>
    TSExportAssignmentTypeClass.create(target, originalSource),
);

export const isTSExportAssignmentType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSExportAssignmentTypeClass => target instanceof TSExportAssignmentTypeClass;
