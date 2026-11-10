import { FieldSpecContext } from '@apexdevtools/apex-parser';

import { SoslIdTypeClass } from '../idVisitor';
import { FieldListTypeClass, FieldOrderListTypeClass } from '../listVisitor';
import { LogicalExpressionTypeClass } from '../expressionVisitor';
import { LimitClauseTypeClass, OffsetClauseTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** `obj(fieldList WHERE ... USING LISTVIEW = ... ORDER BY ... LIMIT ... OFFSET ...)` の括弧の中 */
export type FieldSpecDetail = {
    fieldList: FieldListTypeClass;
    where: LogicalExpressionTypeClass | null;
    listView: SoslIdTypeClass | null;
    orderBy: FieldOrderListTypeClass | null;
    limitClause: LimitClauseTypeClass | null;
    offsetClause: OffsetClauseTypeClass | null;
};

// value はオブジェクト名 (soslId[0])。where 以降は括弧 (fieldList) があるときだけ書ける
export type FieldSpecType = TypeField<'fieldSpec'> & {
    value: SoslIdTypeClass;
    /** 括弧の部分。`RETURNING Account` のように括弧がなければ null */
    spec: FieldSpecDetail | null;
};

export class FieldSpecTypeClass extends ApexCommonTypeClass<'fieldSpec', FieldSpecType> {
    private constructor(fields: FieldsOf<FieldSpecType>, sourceSpan: SourceSpan) {
        super('fieldSpec', fields, sourceSpan);
    }

    static create(ctx: FieldSpecContext): FieldSpecTypeClass {
        return new FieldSpecTypeClass(
            {
                value: createNode(ctx.soslId(0), (c) => SoslIdTypeClass.create(c), 'soslId'),
                spec: ctx.fieldList() ? FieldSpecTypeClass.createDetail(ctx) : null,
            },
            getSourceSpan(ctx),
        );
    }

    private static createDetail(ctx: FieldSpecContext): FieldSpecDetail {
        // soslId[1] は USING LISTVIEW = xxx のビュー名
        const listViewCtx = ctx.LISTVIEW() ? ctx.soslId(1) : null;

        return {
            fieldList: createNode(
                ctx.fieldList(),
                (c) => FieldListTypeClass.create(c),
                'fieldList',
            ),
            where: createOptionalNode(
                ctx.logicalExpression(),
                (c) => LogicalExpressionTypeClass.create(c),
                'logicalExpression',
            ),
            listView: createOptionalNode(listViewCtx, (c) => SoslIdTypeClass.create(c), 'soslId'),
            orderBy: createOptionalNode(
                ctx.fieldOrderList(),
                (c) => FieldOrderListTypeClass.create(c),
                'fieldOrderList',
            ),
            limitClause: createOptionalNode(
                ctx.limitClause(),
                (c) => LimitClauseTypeClass.create(c),
                'limitClause',
            ),
            offsetClause: createOptionalNode(
                ctx.offsetClause(),
                (c) => OffsetClauseTypeClass.create(c),
                'offsetClause',
            ),
        };
    }

    getValue(): FieldSpecType['value'] {
        return this.getFields().value;
    }

    getSpec(): FieldSpecType['spec'] {
        return this.getFields().spec;
    }
}

export const isFieldSpecType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldSpecTypeClass => {
    return isSpicifyApexCommonTypeClass('fieldSpec', target);
};
