import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { FieldSpecTypeClass, QueryVisitor, isFieldSpecType } from '../queryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class FieldSpecListTypeClass extends ListTypeClass<FieldSpecTypeClass> {
    private constructor(value: (FieldSpecTypeClass | ErrorTypeClass)[]) {
        super('fieldSpecList', value);
    }

    static create(ctx: FieldSpecListContext): FieldSpecListTypeClass {
        if (!ctx.fieldSpec()) {
            throw new Error('値が異常です。FieldSpecListContext: ' + ctx.getText());
        }

        const value: (FieldSpecTypeClass | ErrorTypeClass)[] = [
            isValidClass(new QueryVisitor().visit(ctx.fieldSpec()), isFieldSpecType, 'fieldSpec'),
        ];

        if (ctx.fieldSpecList_list() && ctx.fieldSpecList_list().length > 0) {
            const nested = isValidClassList(
                ctx.fieldSpecList_list(),
                (ctx) => new ListVisitor().visit(ctx),
                isFieldSpecListType,
                'fieldSpecList',
            );

            nested.forEach((nest) => {
                if (isFieldSpecListType(nest)) {
                    value.push(...nest.getValue());
                } else {
                    value.push(nest);
                }
            });
        }

        return new FieldSpecListTypeClass(value);
    }
}

export const isFieldSpecListType = (target: CommonTypeClass): target is FieldSpecListTypeClass => {
    return target instanceof FieldSpecListTypeClass;
};

