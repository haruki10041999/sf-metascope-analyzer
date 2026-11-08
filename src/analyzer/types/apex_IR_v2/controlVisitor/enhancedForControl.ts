import { EnhancedForControlContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class EnhancedForControlTypeClass extends ControlTypeClass<
    'enhancedForControl',
    NormalIdTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;
    private fromVariant: BasedExpressionTypeClass | ApexErrorTypeClass;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
        fromVariant: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('enhancedForControl', value);
        this.valueType = valueType;
        this.fromVariant = fromVariant;
    }

    static create(ctx: EnhancedForControlContext): EnhancedForControlTypeClass {
        if (!ctx.typeRef() || !ctx.id() || !ctx.expression()) {
            throw new Error('値が異常です。EnhancedForControlContext: ' + ctx.getText());
        }

        return new EnhancedForControlTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }

    getFromVariant(): BasedExpressionTypeClass | ApexErrorTypeClass {
        return this.fromVariant;
    }
}

export const isEnhancedForControlType = (
    target: ApexCommonTypeClass<string>,
): target is EnhancedForControlTypeClass => {
    return target instanceof EnhancedForControlTypeClass;
};
