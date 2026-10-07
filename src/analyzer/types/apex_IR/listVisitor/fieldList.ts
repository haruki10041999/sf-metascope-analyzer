import { FieldListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { SoslIdTypeClass, IdVisitor, isSoslIdType } from '../idVisitor';
import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

type SoslFieldFunction = 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';

// 入れ子の fieldList を平坦化しても関数指定を失わないよう、項目ごとに関数名を持たせる
export class SoslFieldTypeClass extends CommonTypeClass {
    private value: SoslIdTypeClass | SoqlFunctionTypeClass | ErrorTypeClass;
    private func: SoslFieldFunction | null;

    private constructor(
        value: SoslIdTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
        func: SoslFieldFunction | null,
    ) {
        super('soslField');
        this.value = value;
        this.func = func;
    }

    static create(
        value: SoslIdTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
        func: SoslFieldFunction | null,
    ): SoslFieldTypeClass {
        const field = new SoslFieldTypeClass(value, func);
        field.setSpan(value.getSpan());
        return field;
    }

    getValue(): SoslIdTypeClass | SoqlFunctionTypeClass | ErrorTypeClass {
        return this.value;
    }

    getFunc(): SoslFieldFunction | null {
        return this.func;
    }
}

export const isSoslFieldType = (target: CommonTypeClass): target is SoslFieldTypeClass => {
    return target instanceof SoslFieldTypeClass;
};

export class FieldListTypeClass extends ListTypeClass<SoslFieldTypeClass> {
    private constructor(value: (SoslFieldTypeClass | ErrorTypeClass)[]) {
        super('fieldList', value);
    }

    static create(ctx: FieldListContext): FieldListTypeClass {
        if (ctx.soslId_list().length === 0 && !ctx.soqlFunction()) {
            throw new Error('値が異常です。FieldListContext: ' + ctx.getText());
        }

        const head =
            ctx.soslId_list().length > 0
                ? isValidClass(new IdVisitor().visit(ctx.soslId(0)), isSoslIdType, 'soslId')
                : isValidClass(
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

        const value: (SoslFieldTypeClass | ErrorTypeClass)[] = [
            SoslFieldTypeClass.create(head, func),
        ];

        isValidClassList(
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

export const isFieldListType = (target: CommonTypeClass): target is FieldListTypeClass => {
    return target instanceof FieldListTypeClass;
};
