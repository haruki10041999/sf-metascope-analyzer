import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass, NameVisitor, FieldNameTypeClass, isFieldNameType } from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class DateFieldNameTypeClass extends NameTypeClass<FieldNameTypeClass> {
    private isConvertTimeZone: boolean | null = null;
    private constructor(
        value: FieldNameTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
        isConvertTimeZone: boolean | null,
    ) {
        super('dateFieldName', value, errorClasses);
        this.isConvertTimeZone = isConvertTimeZone;
    }

    static create(ctx: DateFieldNameContext): DateFieldNameTypeClass {
        if (!ctx.fieldName()) {
            throw new Error('値が異常です。DateFieldNameContext: ' + ctx.getText());
        }

        let value: FieldNameTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const isConvertTimeZone = Boolean(ctx.CONVERT_TIMEZONE());
        const nameTypeClass = new NameVisitor().visit(ctx.fieldName());
        if (isFieldNameType(nameTypeClass)) {
            value = nameTypeClass;
        } else if (isErrorType(nameTypeClass)) {
            errorClasses['value'] = nameTypeClass;
        }

        return new DateFieldNameTypeClass(value, errorClasses, isConvertTimeZone);
    }

    getConvertTimeZone(): boolean | null {
        return this.isConvertTimeZone;
    }

    isConvertTimeZoneNull(): boolean {
        return this.isConvertTimeZone === null;
    }
}

export const isDateFieldNameType = (target: CommonTypeClass): target is DateFieldNameTypeClass => {
    return target instanceof DateFieldNameTypeClass;
};
