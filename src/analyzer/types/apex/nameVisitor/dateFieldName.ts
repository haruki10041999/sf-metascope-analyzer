import { DateFieldNameContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '.';

export type DateFieldNameType = {
    type: 'dateFieldName';
    name: Omit<NameType, 'type'>;
    isConvertTimeZone: boolean;
};

export const makeDateFieldNameType = (ctx: DateFieldNameContext): DateFieldNameType => {
    const { type, ...name } = new NameVisitor().visit(ctx.fieldName());

    return {
        type: 'dateFieldName',
        name: name,
        isConvertTimeZone: ctx.CONVERT_TIMEZONE() !== undefined,
    };
};
