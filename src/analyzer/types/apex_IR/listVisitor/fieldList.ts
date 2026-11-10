import { FieldListContext } from '@apexdevtools/apex-parser';

import { SoslIdTypeClass } from '../idVisitor';
import { SoqlFunctionTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/**
 * SOSL の RETURNING の項目 1 つ。文法は `soslId`・`TOLABEL(soslId) alias?`・
 * `CONVERT_CURRENCY(soslId) alias?`・`FORMAT(soslId | soqlFunction) alias?` の 4 通り。
 * soqlFunction が入るのは FORMAT のときだけ、別名 (alias) を書けるのは関数のときだけ
 */
export type SoslFieldType = TypeField<'soslField'> &
    (
        | { kind: 'field'; value: SoslIdTypeClass }
        | {
              kind: 'TOLABEL' | 'CONVERT_CURRENCY';
              value: SoslIdTypeClass;
              alias: SoslIdTypeClass | null;
          }
        | {
              kind: 'FORMAT';
              value: SoslIdTypeClass | SoqlFunctionTypeClass;
              alias: SoslIdTypeClass | null;
          }
    );

// 入れ子の fieldList を平坦化しても関数指定を失わないよう、項目ごとに関数名を持たせる
export class SoslFieldTypeClass extends ApexCommonTypeClass<'soslField', SoslFieldType> {
    private constructor(fields: FieldsOf<SoslFieldType>, sourceSpan: SourceSpan) {
        super('soslField', fields, sourceSpan);
    }

    /** 文法上のルールを持たない組なので、ctx ではなくフィールドから作る (位置は fieldList のもの) */
    static create(fields: FieldsOf<SoslFieldType>, sourceSpan: SourceSpan): SoslFieldTypeClass {
        return new SoslFieldTypeClass(fields, sourceSpan);
    }

    getKind(): SoslFieldType['kind'] {
        return this.getFields().kind;
    }

    getValue(): SoslFieldType['value'] {
        return this.getFields().value;
    }
}

export const isSoslFieldType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslFieldTypeClass => isSpicifyApexCommonTypeClass('soslField', target);

export type FieldListType = TypeField<'fieldList'> & {
    value: SoslFieldTypeClass[];
};

/** fieldList の先頭の項目 (`, fieldList` より前) を読む */
const createHeadFields = (ctx: FieldListContext): FieldsOf<SoslFieldType> => {
    const soslId = (i: number) =>
        createNode(ctx.soslId(i), (c) => SoslIdTypeClass.create(c), 'soslId');
    const alias = (i: number) =>
        createOptionalNode(ctx.soslId(i), (c) => SoslIdTypeClass.create(c), 'soslId');

    if (ctx.TOLABEL() || ctx.CONVERT_CURRENCY()) {
        return {
            kind: ctx.TOLABEL() ? 'TOLABEL' : 'CONVERT_CURRENCY',
            value: soslId(0),
            alias: alias(1),
        };
    } else if (ctx.FORMAT()) {
        // FORMAT(soqlFunction) alias? のときは、soslId は別名だけ
        return ctx.soqlFunction()
            ? {
                  kind: 'FORMAT',
                  value: createNode(
                      ctx.soqlFunction(),
                      (c) => SoqlFunctionTypeClass.create(c),
                      'soqlFunction',
                  ),
                  alias: alias(0),
              }
            : { kind: 'FORMAT', value: soslId(0), alias: alias(1) };
    }
    return { kind: 'field', value: soslId(0) };
};

export class FieldListTypeClass extends ApexCommonTypeClass<'fieldList', FieldListType> {
    private constructor(fields: FieldsOf<FieldListType>, sourceSpan: SourceSpan) {
        super('fieldList', fields, sourceSpan);
    }

    static create(ctx: FieldListContext): FieldListTypeClass {
        const head = createHeadFields(ctx);
        const value: FieldListType['value'] = [
            SoslFieldTypeClass.create(head, head.value.getSpan()),
        ];

        ctx.fieldList_list().forEach((nestedCtx) => {
            const nested = createNode(nestedCtx, (c) => FieldListTypeClass.create(c), 'fieldList');
            value.push(...nested.getValue());
        });

        return new FieldListTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): FieldListType['value'] {
        return this.getFields().value;
    }
}

export const isFieldListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldListTypeClass => isSpicifyApexCommonTypeClass('fieldList', target);
