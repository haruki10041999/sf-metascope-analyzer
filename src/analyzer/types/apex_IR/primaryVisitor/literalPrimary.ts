import { LiteralPrimaryContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type LiteralPrimaryType = TypeField<'literalPrimary'> & {
    value: LiteralTypeClass;
};

export class LiteralPrimaryTypeClass extends ApexCommonTypeClass<
    'literalPrimary',
    LiteralPrimaryType
> {
    private constructor(fields: FieldsOf<LiteralPrimaryType>, sourceSpan: SourceSpan) {
        super('literalPrimary', fields, sourceSpan);
    }

    static create(ctx: LiteralPrimaryContext): LiteralPrimaryTypeClass {
        return new LiteralPrimaryTypeClass(
            {
                value: createNode(ctx.literal(), (c) => LiteralTypeClass.create(c), 'literal'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): LiteralPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isLiteralPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LiteralPrimaryTypeClass => isSpicifyApexCommonTypeClass('literalPrimary', target);
