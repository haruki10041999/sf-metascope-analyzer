import {
    ApexParserBaseVisitor,
    SelectEntryContext,
    SubFieldEntryContext,
} from '@apexdevtools/apex-parser';

import { SelectEntryType, makeSelectEntryType } from './selectEntry';
import { SubFieldEntryType, makeSubFieldEntryType } from './subFieldEntry';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type EntryType = SelectEntryType | SubFieldEntryType | ErrorType;

export class EntryVisitor extends CommonVisitor<EntryType> {
    visitSelectEntry(ctx: SelectEntryContext) {
        console.log('解析を開始します。' + 'SelectEntryContext:  ' + ctx.getText());
        const result = makeSelectEntryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SelectEntryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSubFieldEntry(ctx: SubFieldEntryContext) {
        console.log('解析を開始します。' + 'SubFieldEntryContext:  ' + ctx.getText());
        const result = makeSubFieldEntryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SubFieldEntryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
