import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoqlLiteralType = TypeField<'soqlLiteral'> & {
    value: QueryTypeClass;
};

export class SoqlLiteralTypeClass extends ApexCommonTypeClass<'soqlLiteral', SoqlLiteralType> {
    private constructor(fields: FieldsOf<SoqlLiteralType>, sourceSpan: SourceSpan) {
        super('soqlLiteral', fields, sourceSpan);
    }

    static create(ctx: SoqlLiteralContext): SoqlLiteralTypeClass {
        return new SoqlLiteralTypeClass(
            { value: createNode(ctx.query(), (c) => QueryTypeClass.create(c), 'query') },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoqlLiteralType['value'] {
        return this.getFields().value;
    }
}

export const isSoqlLiteralType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlLiteralTypeClass => isSpicifyApexCommonTypeClass('soqlLiteral', target);
