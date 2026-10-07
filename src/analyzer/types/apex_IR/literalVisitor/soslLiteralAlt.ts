import { SoslLiteralAltContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import { SoslClausesTypeClass, ClauseVisitor, isSoslClausesType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SoslLiteralAltTypeClass extends LiteralTypeClass<string> {
    private soslClauses: SoslClausesTypeClass | ErrorTypeClass;

    private constructor(value: string, soslClauses: SoslClausesTypeClass | ErrorTypeClass) {
        super('soslLiteralAlt', value);
        this.soslClauses = soslClauses;
    }

    static create(ctx: SoslLiteralAltContext): SoslLiteralAltTypeClass {
        if (!ctx.soslClauses() || !ctx.FindLiteralAlt()) {
            throw new Error('値が異常です。SoslLiteralAltContext: ' + ctx.getText());
        }

        return new SoslLiteralAltTypeClass(
            ctx.FindLiteralAlt().getText(),
            isValidClass(
                new ClauseVisitor().visit(ctx.soslClauses()),
                isSoslClausesType,
                'soslClauses',
            ),
        );
    }

    getSoslClauses(): SoslClausesTypeClass | ErrorTypeClass {
        return this.soslClauses;
    }
}

export const isSoslLiteralAltType = (
    target: CommonTypeClass,
): target is SoslLiteralAltTypeClass => {
    return target instanceof SoslLiteralAltTypeClass;
};

