import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { EntryTypeClass } from '../entryVisitor';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { TypeOfTypeClass, ClauseVisitor, isTypeOfType } from '../clauseVisitor';
import {
    SubQueryTypeClass,
    SoqlFunctionTypeClass,
    QueryVisitor,
    isSubQueryType,
    isSoqlFunctionType,
} from '../queryVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

type SelectEntryTypeClassType =
    FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass;

export class SelectEntryTypeClass extends EntryTypeClass<'selectEntry', SelectEntryTypeClassType> {
    private alias: SoqlIdTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: SelectEntryTypeClassType | ApexErrorTypeClass,
        alias: SoqlIdTypeClass | ApexErrorTypeClass | null,
    ) {
        super('selectEntry', value);
        this.alias = alias;
    }

    static create(ctx: SelectEntryContext): SelectEntryTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction() && !ctx.subQuery() && !ctx.typeOf()) {
            throw new Error('値が異常です。SelectEntryContext: ' + ctx.getText());
        }

        let value: SelectEntryTypeClassType | ApexErrorTypeClass;
        if (ctx.fieldName()) {
            value = visitNode(new NameVisitor(), ctx.fieldName(), isFieldNameType, 'fieldName');
        } else if (ctx.soqlFunction()) {
            value = visitNode(
                new QueryVisitor(),
                ctx.soqlFunction(),
                isSoqlFunctionType,
                'soqlFunction',
            );
        } else if (ctx.subQuery()) {
            value = visitNode(new QueryVisitor(), ctx.subQuery(), isSubQueryType, 'subQuery');
        } else {
            value = visitNode(new ClauseVisitor(), ctx.typeOf(), isTypeOfType, 'typeOf');
        }

        // 文法上 soqlId は常に別名（`COUNT(Id) total`）
        return new SelectEntryTypeClass(
            value,
            visitOptionalNode(new IdVisitor(), ctx.soqlId(), isSoqlIdType, 'soqlId'),
        );
    }

    getAlias(): SoqlIdTypeClass | ApexErrorTypeClass | null {
        return this.alias;
    }
}

export const isSelectEntryType = (
    target: ApexCommonTypeClass<string>,
): target is SelectEntryTypeClass => {
    return target instanceof SelectEntryTypeClass;
};
