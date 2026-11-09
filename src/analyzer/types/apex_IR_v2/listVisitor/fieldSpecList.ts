import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { FieldSpecTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldSpecListType = TypeField<'fieldSpecList'> & {
    value: FieldSpecTypeClass[];
};

export class FieldSpecListTypeClass extends ApexCommonTypeClass<
    'fieldSpecList',
    FieldSpecListType
> {
    private constructor(fields: FieldsOf<FieldSpecListType>, sourceSpan: SourceSpan) {
        super('fieldSpecList', fields, sourceSpan);
    }

    static create(ctx: FieldSpecListContext): FieldSpecListTypeClass {
        const value: FieldSpecListType['value'] = [
            createNode(ctx.fieldSpec(), (c) => FieldSpecTypeClass.create(c), 'fieldSpec'),
        ];

        // 入れ子の fieldSpecList は平坦化する
        ctx.fieldSpecList_list().forEach((nestedCtx) => {
            const nested = createNode(
                nestedCtx,
                (c) => FieldSpecListTypeClass.create(c),
                'fieldSpecList',
            );
            if (isFieldSpecListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        });

        return new FieldSpecListTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): FieldSpecListType['value'] {
        return this.getFields().value;
    }
}

export const isFieldSpecListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldSpecListTypeClass => isSpicifyApexCommonTypeClass('fieldSpecList', target);
