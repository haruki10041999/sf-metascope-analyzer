import { SelectEntryContext } from '@apexdevtools/apex-parser';

import { SoqlIdTypeClass } from '../idVisitor';
import { FieldNameTypeClass } from '../nameVisitor';
import { TypeOfTypeClass } from '../clauseVisitor';
import { SubQueryTypeClass, SoqlFunctionTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 別名 (alias) を書けるのは typeOf 以外のとき。value の種類は子のノードの kind で見分ける */
export type SelectEntryType = TypeField<'selectEntry'> &
    (
        | {
              value: FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass;
              /** 文法上 soqlId は常に別名（`COUNT(Id) total`） */
              alias: SoqlIdTypeClass | null;
          }
        | { value: TypeOfTypeClass }
    );

export class SelectEntryTypeClass extends ApexCommonTypeClass<'selectEntry', SelectEntryType> {
    private constructor(fields: FieldsOf<SelectEntryType>, sourceSpan: SourceSpan) {
        super('selectEntry', fields, sourceSpan);
    }

    static create(ctx: SelectEntryContext): SelectEntryTypeClass {
        return new SelectEntryTypeClass(SelectEntryTypeClass.createFields(ctx), getSourceSpan(ctx));
    }

    private static createFields(ctx: SelectEntryContext): FieldsOf<SelectEntryType> {
        let value: FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass;
        if (ctx.fieldName()) {
            value = createNode(ctx.fieldName(), (c) => FieldNameTypeClass.create(c), 'fieldName');
        } else if (ctx.soqlFunction()) {
            value = createNode(
                ctx.soqlFunction(),
                (c) => SoqlFunctionTypeClass.create(c),
                'soqlFunction',
            );
        } else if (ctx.subQuery()) {
            value = createNode(ctx.subQuery(), (c) => SubQueryTypeClass.create(c), 'subQuery');
        } else {
            return { value: createNode(ctx.typeOf(), (c) => TypeOfTypeClass.create(c), 'typeOf') };
        }

        return {
            value,
            alias: createOptionalNode(ctx.soqlId(), (c) => SoqlIdTypeClass.create(c), 'soqlId'),
        };
    }

    getValue(): SelectEntryType['value'] {
        return this.getFields().value;
    }
}

export const isSelectEntryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SelectEntryTypeClass => isSpicifyApexCommonTypeClass('selectEntry', target);
