import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { FieldSpecTypeClass, QueryVisitor, isFieldSpecType } from '../queryVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class FieldSpecListTypeClass extends ListTypeClass<'fieldSpecList', FieldSpecTypeClass> {
    private constructor(value: (FieldSpecTypeClass | ApexErrorTypeClass)[]) {
        super('fieldSpecList', value);
    }

    static create(ctx: FieldSpecListContext): FieldSpecListTypeClass {
        if (!ctx.fieldSpec()) {
            throw new Error('値が異常です。FieldSpecListContext: ' + ctx.getText());
        }

        const value: (FieldSpecTypeClass | ApexErrorTypeClass)[] = [
            visitNode(new QueryVisitor(), ctx.fieldSpec(), isFieldSpecType, 'fieldSpec'),
        ];

        if (ctx.fieldSpecList_list() && ctx.fieldSpecList_list().length > 0) {
            const nested = visitNodeList(
                new ListVisitor(),
                ctx.fieldSpecList_list(),
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

export const isFieldSpecListType = (
    target: ApexCommonTypeClass<string>,
): target is FieldSpecListTypeClass => {
    return target instanceof FieldSpecListTypeClass;
};
