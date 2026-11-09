import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass } from './fieldName';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DateFieldNameType = TypeField<'dateFieldName'> & {
    value: FieldNameTypeClass;
    isConvertTimeZone: boolean;
};

export class DateFieldNameTypeClass extends ApexCommonTypeClass<
    'dateFieldName',
    DateFieldNameType
> {
    private constructor(fields: FieldsOf<DateFieldNameType>, sourceSpan: SourceSpan) {
        super('dateFieldName', fields, sourceSpan);
    }

    static create(ctx: DateFieldNameContext): DateFieldNameTypeClass {
        return new DateFieldNameTypeClass(
            {
                value: createNode(
                    ctx.fieldName(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
                isConvertTimeZone: !!ctx.CONVERT_TIMEZONE(),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DateFieldNameType['value'] {
        return this.getFields().value;
    }

    getConvertTimeZone(): DateFieldNameType['isConvertTimeZone'] {
        return this.getFields().isConvertTimeZone;
    }
}

export const isDateFieldNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DateFieldNameTypeClass => isSpicifyApexCommonTypeClass('dateFieldName', target);
