import { SoslLiteralAltContext } from '@apexdevtools/apex-parser';

import { LiteralValueTypeClass } from '.';

import { SoslClausesTypeClass, ClauseVisitor, isSoslClausesType } from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class SoslLiteralAltTypeClass extends LiteralValueTypeClass<'soslLiteralAlt', string> {
    private soslClauses: SoslClausesTypeClass | ApexErrorTypeClass;

    private constructor(value: string, soslClauses: SoslClausesTypeClass | ApexErrorTypeClass) {
        super('soslLiteralAlt', value);
        this.soslClauses = soslClauses;
    }

    static create(ctx: SoslLiteralAltContext): SoslLiteralAltTypeClass {
        if (!ctx.soslClauses() || !ctx.FindLiteralAlt()) {
            throw new Error('値が異常です。SoslLiteralAltContext: ' + ctx.getText());
        }

        return new SoslLiteralAltTypeClass(
            ctx.FindLiteralAlt().getText(),
            visitNode(new ClauseVisitor(), ctx.soslClauses(), isSoslClausesType, 'soslClauses'),
        );
    }

    getSoslClauses(): SoslClausesTypeClass | ApexErrorTypeClass {
        return this.soslClauses;
    }
}

export const isSoslLiteralAltType = (
    target: ApexCommonTypeClass<string>,
): target is SoslLiteralAltTypeClass => {
    return target instanceof SoslLiteralAltTypeClass;
};
