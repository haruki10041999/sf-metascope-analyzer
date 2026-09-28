import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '.';

export type DateFieldNameType = {
    type: 'dateFieldName';
    name: { name: NameType; isConvertTimeZone: boolean };
};

export const makeDateFieldNameType = (ctx: DateFieldNameContext): DateFieldNameType => {
    const name = new NameVisitor().visit(ctx.fieldName());

    return {
        type: 'dateFieldName',
        name: { name: name, isConvertTimeZone: ctx.CONVERT_TIMEZONE() !== undefined },
    };
};
