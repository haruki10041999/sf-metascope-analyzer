import { SoslPrimaryContext } from '@apexdevtools/apex-parser';

import { SoslLiteralTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type SoslPrimaryType = TypeField<'soslPrimary'> & {
    value: SoslLiteralTypeClass;
};

export class SoslPrimaryTypeClass extends ApexCommonTypeClass<'soslPrimary', SoslPrimaryType> {
    private constructor(fields: FieldsOf<SoslPrimaryType>, sourceSpan: SourceSpan) {
        super('soslPrimary', fields, sourceSpan);
    }

    static create(ctx: SoslPrimaryContext): SoslPrimaryTypeClass {
        return new SoslPrimaryTypeClass(
            {
                value: createNode(
                    ctx.soslLiteral(),
                    (c) => SoslLiteralTypeClass.create(c),
                    'soslLiteral',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoslPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isSoslPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslPrimaryTypeClass => isSpicifyApexCommonTypeClass('soslPrimary', target);
