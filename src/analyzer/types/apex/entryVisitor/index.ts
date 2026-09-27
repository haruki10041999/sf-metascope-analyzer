import {
    ApexParserBaseVisitor,
    SelectEntryContext,
    SubFieldEntryContext,
} from '@apexdevtools/apex-parser';

import { SelectEntryType, makeSelectEntryType } from './selectEntry';
import { SubFieldEntryType, makeSubFieldEntryType } from './subFieldEntry';

export type EntryType = SelectEntryType | SubFieldEntryType;

export class EntryVisitor extends ApexParserBaseVisitor<EntryType> {
    visitSelectEntry(ctx: SelectEntryContext) {
        return makeSelectEntryType(ctx);
    }

    visitSubFieldEntry(ctx: SubFieldEntryContext) {
        return makeSubFieldEntryType(ctx);
    }
}
