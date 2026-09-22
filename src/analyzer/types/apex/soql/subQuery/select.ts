import {
    SubFieldListContext,
    SubFieldEntryContext,
    SubQueryContext,
} from '@apexdevtools/apex-parser';

import { SubQueryField, makeSubQueryField } from '.';

import { makeSoqlFunctionField } from '../function';
import { makeSoqlField } from '../field';
import { SelectField } from '../select';

export const makeSelectList_SubQuery = (ctx: SubFieldListContext): SelectField[] => {
    const selectFields: SelectField[] = [];

    ctx.subFieldEntry_list().forEach((entry: SubFieldEntryContext) => {
        if (entry.subQuery()) {
            selectFields.push({
                type: 'subQuery',
                field: makeSubQueryField(entry.subQuery()),
            });
            return;
        }

        if (entry.soqlFunction()) {
            selectFields.push({
                type: 'function',
                field: makeSoqlFunctionField(entry.soqlFunction()),
            });
            return;
        }

        selectFields.push({
            type: 'field',
            field: makeSoqlField(entry.fieldName()),
        });
    });

    return selectFields;
};
