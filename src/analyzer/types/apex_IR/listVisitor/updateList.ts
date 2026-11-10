import { UpdateListContext } from '@apexdevtools/apex-parser';

import { UpdateTypeTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type UpdateListType = TypeField<'updateList'> & {
    value: UpdateTypeTypeClass[];
};

export class UpdateListTypeClass extends ApexCommonTypeClass<'updateList', UpdateListType> {
    private constructor(fields: FieldsOf<UpdateListType>, sourceSpan: SourceSpan) {
        super('updateList', fields, sourceSpan);
    }

    static create(ctx: UpdateListContext): UpdateListTypeClass {
        const value: UpdateListType['value'] = [
            createNode(ctx.updateType(), (c) => UpdateTypeTypeClass.create(c), 'updateType'),
        ];

        // 入れ子の updateList は平坦化する
        if (ctx.updateList()) {
            const nested = createNode(
                ctx.updateList(),
                (c) => UpdateListTypeClass.create(c),
                'updateList',
            );
            if (isUpdateListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        }

        return new UpdateListTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): UpdateListType['value'] {
        return this.getFields().value;
    }
}

export const isUpdateListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UpdateListTypeClass => isSpicifyApexCommonTypeClass('updateList', target);
