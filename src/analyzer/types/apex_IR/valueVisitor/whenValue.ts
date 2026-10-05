import { WhenValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { WhenLiteralTypeClass, LiteralVisitor, isWhenLiteralType } from '../literalVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

type WhenValueValueType = (WhenLiteralTypeClass | ErrorTypeClass)[] | NormalIdTypeClass | 'else';

export class WhenValueTypeClass extends ValueTypeClass<WhenValueValueType> {
    private valueType: TypeRefTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: WhenValueValueType | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass | null,
    ) {
        super('whenValue', value);
        this.valueType = valueType;
    }

    static create(ctx: WhenValueContext): WhenValueTypeClass {
        if (
            !ctx.ELSE() ||
            !ctx.whenLiteral_list() ||
            ctx.whenLiteral_list().length === 0 ||
            (!ctx.typeRef() && !ctx.id())
        ) {
            throw new Error('値が異常です。WhenValueContext: ' + ctx.getText());
        }

        let value: WhenValueValueType | ErrorTypeClass;
        let valueType: TypeRefTypeClass | ErrorTypeClass | null = null;

        if (ctx.ELSE()) {
            value = 'else';
        } else if (ctx.whenLiteral_list() && ctx.whenLiteral_list().length > 0) {
            value = isValidClassList(
                ctx.whenLiteral_list(),
                (ctx) => new LiteralVisitor().visit(ctx),
                isWhenLiteralType,
                'whenLiteral',
            );
        } else {
            value = isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id');
            valueType = isValidClass(
                new TypeVisitor().visit(ctx.typeRef()),
                isTypeRefType,
                'typeRef',
            );
        }

        return new WhenValueTypeClass(value, valueType);
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass | null {
        return this.valueType;
    }
}

export const isWhenValueType = (target: CommonTypeClass): target is WhenValueTypeClass => {
    return target instanceof WhenValueTypeClass;
};
