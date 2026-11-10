import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { SoqlLiteralTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type SoqlPrimaryType = TypeField<'soqlPrimary'> & {
    value: SoqlLiteralTypeClass;
};

export class SoqlPrimaryTypeClass extends ApexCommonTypeClass<'soqlPrimary', SoqlPrimaryType> {
    private constructor(fields: FieldsOf<SoqlPrimaryType>, sourceSpan: SourceSpan) {
        super('soqlPrimary', fields, sourceSpan);
    }

    static create(ctx: SoqlPrimaryContext): SoqlPrimaryTypeClass {
        return new SoqlPrimaryTypeClass(
            {
                value: createNode(
                    ctx.soqlLiteral(),
                    (c) => SoqlLiteralTypeClass.create(c),
                    'soqlLiteral',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoqlPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isSoqlPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlPrimaryTypeClass => isSpicifyApexCommonTypeClass('soqlPrimary', target);
