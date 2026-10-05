import { ElementValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ElementValueTypeClass extends ValueTypeClass<NormalLiteralTypeClass> {
    private constructor(value: NormalLiteralTypeClass | ErrorTypeClass) {
        super('elementValue', value);
    }

    static create(ctx: ElementValueContext) {
        if (!ctx.literal()) {
            throw new Error('値が異常です。ElementValueContext: ' + ctx.getText());
        }

        return new ElementValueTypeClass(
            isValidClass(new LiteralVisitor().visit(ctx.literal()), isNormalLiteralType, 'literal'),
        );
    }
}

export const isElementValueType = (target: CommonTypeClass): target is ElementValueTypeClass => {
    return target instanceof ElementValueTypeClass;
};
