import { WhenValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { WhenLiteralTypeClass, LiteralVisitor, isWhenLiteralType } from '../literalVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

type WhenValueValueType =
    (WhenLiteralTypeClass | ApexErrorTypeClass)[] | NormalIdTypeClass | 'else';

export class WhenValueTypeClass extends ValueTypeClass<'whenValue', WhenValueValueType> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: WhenValueValueType | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass | null,
    ) {
        super('whenValue', value);
        this.valueType = valueType;
    }

    static create(ctx: WhenValueContext): WhenValueTypeClass {
        if (!ctx.ELSE() && ctx.whenLiteral_list().length === 0 && (!ctx.typeRef() || !ctx.id())) {
            throw new Error('値が異常です。WhenValueContext: ' + ctx.getText());
        }

        let value: WhenValueValueType | ApexErrorTypeClass;
        let valueType: TypeRefTypeClass | ApexErrorTypeClass | null = null;

        if (ctx.ELSE()) {
            value = 'else';
        } else if (ctx.whenLiteral_list().length > 0) {
            value = isApexValidClassList(
                ctx.whenLiteral_list(),
                (ctx) => new LiteralVisitor().visit(ctx),
                isWhenLiteralType,
                'whenLiteral',
            );
        } else {
            value = isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id');
            valueType = isApexValidClass(
                new TypeVisitor().visit(ctx.typeRef()),
                isTypeRefType,
                'typeRef',
            );
        }

        return new WhenValueTypeClass(value, valueType);
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass | null {
        return this.valueType;
    }
}

export const isWhenValueType = (
    target: ApexCommonTypeClass<string>,
): target is WhenValueTypeClass => {
    return target instanceof WhenValueTypeClass;
};
