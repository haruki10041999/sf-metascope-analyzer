import { SoslLiteralAltContext } from '@apexdevtools/apex-parser';

import { SoslClausesTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoslLiteralAltType = TypeField<'soslLiteralAlt'> & {
    value: string;
    soslClauses: SoslClausesTypeClass;
};

export class SoslLiteralAltTypeClass extends ApexCommonTypeClass<
    'soslLiteralAlt',
    SoslLiteralAltType
> {
    private constructor(fields: FieldsOf<SoslLiteralAltType>, sourceSpan: SourceSpan) {
        super('soslLiteralAlt', fields, sourceSpan);
    }

    static create(ctx: SoslLiteralAltContext): SoslLiteralAltTypeClass {
        if (!ctx.FindLiteralAlt()) {
            throw new Error('値が異常です。SoslLiteralAltContext: ' + ctx.getText());
        }

        return new SoslLiteralAltTypeClass(
            {
                value: ctx.FindLiteralAlt().getText(),
                soslClauses: createNode(
                    ctx.soslClauses(),
                    (c) => SoslClausesTypeClass.create(c),
                    'soslClauses',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoslLiteralAltType['value'] {
        return this.getFields().value;
    }

    getSoslClauses(): SoslLiteralAltType['soslClauses'] {
        return this.getFields().soslClauses;
    }
}

export const isSoslLiteralAltType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslLiteralAltTypeClass => isSpicifyApexCommonTypeClass('soslLiteralAlt', target);
