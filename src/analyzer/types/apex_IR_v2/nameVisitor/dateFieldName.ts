import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass, NameVisitor, FieldNameTypeClass, isFieldNameType } from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class DateFieldNameTypeClass extends NameTypeClass<'dateFieldName', FieldNameTypeClass> {
    private isConvertTimeZone: boolean;
    private constructor(
        value: FieldNameTypeClass | ApexErrorTypeClass,
        isConvertTimeZone: boolean,
    ) {
        super('dateFieldName', value);
        this.isConvertTimeZone = isConvertTimeZone;
    }

    static create(ctx: DateFieldNameContext): DateFieldNameTypeClass {
        if (!ctx.fieldName()) {
            throw new Error('値が異常です。DateFieldNameContext: ' + ctx.getText());
        }

        return new DateFieldNameTypeClass(
            visitNode(new NameVisitor(), ctx.fieldName(), isFieldNameType, 'fieldName'),
            ctx.CONVERT_TIMEZONE() !== null,
        );
    }

    getConvertTimeZone(): boolean {
        return this.isConvertTimeZone;
    }
}

export const isDateFieldNameType = (
    target: ApexCommonTypeClass<string>,
): target is DateFieldNameTypeClass => {
    return target instanceof DateFieldNameTypeClass;
};
