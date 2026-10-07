import { SoslPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { SoslLiteralTypeClass, LiteralVisitor, isSoslLiteralType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SoslPrimaryTypeClass extends PrimaryTypeClass<SoslLiteralTypeClass> {
    private constructor(value: SoslLiteralTypeClass | ErrorTypeClass) {
        super('soslPrimary', value);
    }

    static create(ctx: SoslPrimaryContext): SoslPrimaryTypeClass {
        if (!ctx.soslLiteral()) {
            throw new Error('値が異常です。SoslPrimaryContext: ' + ctx.getText());
        }

        return new SoslPrimaryTypeClass(
            isValidClass(
                new LiteralVisitor().visit(ctx.soslLiteral()),
                isSoslLiteralType,
                'soslLiteral',
            ),
        );
    }
}

export const isSoslPrimaryType = (target: CommonTypeClass): target is SoslPrimaryTypeClass => {
    return target instanceof SoslPrimaryTypeClass;
};

