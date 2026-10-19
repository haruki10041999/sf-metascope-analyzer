import { EnhancedForControlContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class EnhancedForControlTypeClass extends ControlTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;
    private fromVariant: BasedExpressionTypeClass | ErrorTypeClass;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
        fromVariant: BasedExpressionTypeClass | ErrorTypeClass,
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionTypeClass,
                'expression',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }

    getFromVariant(): BasedExpressionTypeClass | ErrorTypeClass {
        return this.fromVariant;
    }
}

export const isEnhancedForControlType = (
    target: CommonTypeClass,
): target is EnhancedForControlTypeClass => {
    return target instanceof EnhancedForControlTypeClass;
};
