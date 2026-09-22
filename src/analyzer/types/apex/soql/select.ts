import { SelectEntryContext, SelectListContext, SubQueryContext } from '@apexdevtools/apex-parser';

import { SoqlFunctionField, makeSoqlFunctionField } from './function';
import { SoqlField, makeSoqlField } from './field';
import { SubQueryField, makeSubQueryField } from './subQuery';

export type SelectField =
    | {
          type: 'field';
          field: SoqlField;
      }
    | {
          type: 'function';
          field: SoqlFunctionField[];
      }
    | {
          type: 'subQuery';
          field: SubQueryField;
      };

export const makeSelectList = (ctx: SelectListContext): SelectField[] => {
    const selectFields: SelectField[] = [];

    ctx.selectEntry_list().forEach((entry: SelectEntryContext) => {
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
