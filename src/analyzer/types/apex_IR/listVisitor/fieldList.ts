import { FieldListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { SoslIdTypeClass, IdVisitor, isSoslIdType } from '../idVisitor';
import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

type SoslFieldFunction = 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';

// 入れ子の fieldList を平坦化しても関数指定を失わないよう、項目ごとに関数名を持たせる
export class SoslFieldTypeClass extends ApexCommonTypeClass<'soslField'> {
    private value: SoslIdTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass;
    private func: SoslFieldFunction | null;

    private constructor(
        value: SoslIdTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass,
        func: SoslFieldFunction | null,
    ) {
        super('soslField');
        this.value = value;
        this.func = func;
    }

    static create(
        value: SoslIdTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass,
        func: SoslFieldFunction | null,
    ): SoslFieldTypeClass {
        const field = new SoslFieldTypeClass(value, func);
        field.setSpan(value.getSpan());
        return field;
    }

    getValue(): SoslIdTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass {
        return this.value;
    }

    getFunc(): SoslFieldFunction | null {
        return this.func;
    }
}

export const isSoslFieldType = (
    target: ApexCommonTypeClass<string>,
): target is SoslFieldTypeClass => {
    return target instanceof SoslFieldTypeClass;
};

export class FieldListTypeClass extends ListTypeClass<'fieldList', SoslFieldTypeClass> {
    private constructor(value: (SoslFieldTypeClass | ApexErrorTypeClass)[]) {
        super('fieldList', value);
    }

    static create(ctx: FieldListContext): FieldListTypeClass {
        if (ctx.soslId_list().length === 0 && !ctx.soqlFunction()) {
            throw new Error('値が異常です。FieldListContext: ' + ctx.getText());
        }

        const head =
            ctx.soslId_list().length > 0
                ? isApexValidClass(new IdVisitor().visit(ctx.soslId(0)), isSoslIdType, 'soslId')
                : isApexValidClass(
                      new QueryVisitor().visit(ctx.soqlFunction()),
                      isSoqlFunctionType,
                      'soqlFunction',
                  );

        const func: SoslFieldFunction | null = ctx.TOLABEL()
            ? 'TOLABEL'
            : ctx.CONVERT_CURRENCY()
              ? 'CONVERT_CURRENCY'
              : ctx.FORMAT()
                ? 'FORMAT'
                : null;

        const value: (SoslFieldTypeClass | ApexErrorTypeClass)[] = [
            SoslFieldTypeClass.create(head, func),
        ];

        isApexValidClassList(
            ctx.fieldList_list(),
            (ctx) => new ListVisitor().visit(ctx),
            isFieldListType,
            'fieldList',
        ).forEach((nested) => {
            if (isFieldListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        });

        return new FieldListTypeClass(value);
    }
}

export const isFieldListType = (
    target: ApexCommonTypeClass<string>,
): target is FieldListTypeClass => {
    return target instanceof FieldListTypeClass;
};
