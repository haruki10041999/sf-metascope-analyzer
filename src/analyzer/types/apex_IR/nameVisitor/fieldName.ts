import { FieldNameContext } from '@apexdevtools/apex-parser';

import { SoqlIdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldNameType = TypeField<'fieldName'> & {
    value: SoqlIdTypeClass[];
};

export class FieldNameTypeClass extends ApexCommonTypeClass<'fieldName', FieldNameType> {
    private constructor(fields: FieldsOf<FieldNameType>, sourceSpan: SourceSpan) {
        super('fieldName', fields, sourceSpan);
    }

    static create(ctx: FieldNameContext): FieldNameTypeClass {
        return new FieldNameTypeClass(
            {
                value: createNodeList(
                    ctx.soqlId_list(),
                    (c) => SoqlIdTypeClass.create(c),
                    'soqlId',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FieldNameType['value'] {
        return this.getFields().value;
    }
}

export const isFieldNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldNameTypeClass => isSpicifyApexCommonTypeClass('fieldName', target);
