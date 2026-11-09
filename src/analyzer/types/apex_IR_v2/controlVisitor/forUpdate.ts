import { ForUpdateContext } from '@apexdevtools/apex-parser';

import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ForUpdateType = TypeField<'forUpdate'> & {
    value: ExpressionListTypeClass;
};

export class ForUpdateTypeClass extends ApexCommonTypeClass<'forUpdate', ForUpdateType> {
    private constructor(fields: FieldsOf<ForUpdateType>, sourceSpan: SourceSpan) {
        super('forUpdate', fields, sourceSpan);
    }

    static create(ctx: ForUpdateContext): ForUpdateTypeClass {
        return new ForUpdateTypeClass(
            {
                value: createNode(
                    ctx.expressionList(),
                    (c) => ExpressionListTypeClass.create(c),
                    'expressionList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ForUpdateType['value'] {
        return this.getFields().value;
    }
}

export const isForUpdateType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ForUpdateTypeClass => {
    return isSpicifyApexCommonTypeClass('forUpdate', target);
};
