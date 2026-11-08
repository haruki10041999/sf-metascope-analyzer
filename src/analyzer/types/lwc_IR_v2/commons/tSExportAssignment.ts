import { isTSExportAssignment, type TSExportAssignment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type TSExportAssignmentFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class TSExportAssignmentTypeClass extends LwcCommonTypeClass<'tSExportAssignment'> {
    private readonly value: TSExportAssignmentFields;

    private constructor(value: TSExportAssignmentFields) {
        super('tSExportAssignment');
        this.value = value;
    }

    static create(target: TSExportAssignment, originalSource: string): TSExportAssignmentTypeClass {
        return new TSExportAssignmentTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSExportAssignmentFields {
        return this.value;
    }

    getExpression(): TSExportAssignmentFields['expression'] {
        return this.value.expression;
    }
}

export const tSExportAssignmentTypePair: EvaluatePair<
    TSExportAssignment,
    TSExportAssignmentTypeClass
> = makeEvaluatePair(isTSExportAssignment, (target, originalSource) =>
    TSExportAssignmentTypeClass.create(target, originalSource),
);

export const isTSExportAssignmentType = (
    target: LwcCommonTypeClass<string>,
): target is TSExportAssignmentTypeClass => target instanceof TSExportAssignmentTypeClass;
