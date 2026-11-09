import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ThrowStatementType = TypeField<'throwStatement'> & {
    value: BasedExpressionTypeClass;
};

export class ThrowStatementTypeClass extends ApexCommonTypeClass<
    'throwStatement',
    ThrowStatementType
> {
    private constructor(fields: FieldsOf<ThrowStatementType>, sourceSpan: SourceSpan) {
        super('throwStatement', fields, sourceSpan);
    }

    static create(ctx: ThrowStatementContext): ThrowStatementTypeClass {
        return new ThrowStatementTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ThrowStatementType['value'] {
        return this.getFields().value;
    }
}

export const isThrowStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ThrowStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('throwStatement', target);
};
