import {
    ApexParserBaseVisitor,
    SelectEntryContext,
    SubFieldEntryContext,
} from '@apexdevtools/apex-parser';

import { SelectEntryType, makeSelectEntryType } from './selectEntry';
import { SubFieldEntryType, makeSubFieldEntryType } from './subFieldEntry';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export class EntryTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isEntryTypeAll = (target: CommonTypeClass): target is EntryTypeClass<unknown> => {
    return target instanceof EntryTypeClass;
};

export class EntryVisitor extends CommonVisitor<EntryTypeClass<unknown>> {
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
