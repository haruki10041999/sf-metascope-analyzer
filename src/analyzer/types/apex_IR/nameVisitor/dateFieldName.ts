import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass, NameVisitor, FieldNameTypeClass, isFieldNameType } from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DateFieldNameTypeClass extends NameTypeClass<FieldNameTypeClass> {
    private isConvertTimeZone: boolean;
    private constructor(value: FieldNameTypeClass | ErrorTypeClass, isConvertTimeZone: boolean) {
        super('dateFieldName', value);
        this.isConvertTimeZone = isConvertTimeZone;
    }

    static create(ctx: DateFieldNameContext): DateFieldNameTypeClass {
        if (!ctx.fieldName()) {
            throw new Error('値が異常です。DateFieldNameContext: ' + ctx.getText());
        }

        return new DateFieldNameTypeClass(
            isValidClass(new NameVisitor().visit(ctx.fieldName()), isFieldNameType, 'fieldName'),
            ctx.CONVERT_TIMEZONE() !== null,
        );
    }

    getConvertTimeZone(): boolean {
        return this.isConvertTimeZone;
    }
}

export const isDateFieldNameType = (target: CommonTypeClass): target is DateFieldNameTypeClass => {
    return target instanceof DateFieldNameTypeClass;
};
