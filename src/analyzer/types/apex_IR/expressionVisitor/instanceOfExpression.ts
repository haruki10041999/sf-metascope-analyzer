import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `left instanceof right` */
export type InstanceOfExpressionType = TypeField<'instanceOfExpression'> & {
    left: BasedExpressionTypeClass;
    operator: 'instanceof';
    right: TypeRefTypeClass;
};

export class InstanceOfExpressionTypeClass extends ApexCommonTypeClass<
    'instanceOfExpression',
    InstanceOfExpressionType
> {
    private constructor(fields: FieldsOf<InstanceOfExpressionType>, sourceSpan: SourceSpan) {
        super('instanceOfExpression', fields, sourceSpan);
    }

    static create(ctx: InstanceOfExpressionContext): InstanceOfExpressionTypeClass {
        return new InstanceOfExpressionTypeClass(
            {
                left: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                operator: 'instanceof',
                right: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): InstanceOfExpressionType['left'] {
        return this.getFields().left;
    }

    getOperator(): InstanceOfExpressionType['operator'] {
        return this.getFields().operator;
    }

    getRight(): InstanceOfExpressionType['right'] {
        return this.getFields().right;
    }
}

export const isInstanceOfExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InstanceOfExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('instanceOfExpression', target);
