import {
    ApexParserBaseVisitor,
    SelectEntryContext,
    SubFieldEntryContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { EntryTypeClass } from './base';

import { SelectEntryTypeClass } from './selectEntry';
import { SubFieldEntryTypeClass } from './subFieldEntry';

import { CommonVisitor } from '../commonVisitor';

export { isSelectEntryType, SelectEntryTypeClass } from './selectEntry';
export { isSubFieldEntryType, SubFieldEntryTypeClass } from './subFieldEntry';

export class EntryVisitor extends CommonVisitor<EntryTypeClass<unknown>> {
    visitSelectEntry(ctx: SelectEntryContext) {
        return SelectEntryTypeClass.create(ctx);
    }

    visitSubFieldEntry(ctx: SubFieldEntryContext) {
        return SubFieldEntryTypeClass.create(ctx);
    }
}
