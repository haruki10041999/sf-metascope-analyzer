import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { CreatorTypeClass } from '../restVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `new creator` */
export type NewExpressionType = TypeField<'newExpression'> & {
    value: CreatorTypeClass;
};

export class NewExpressionTypeClass extends ApexCommonTypeClass<
    'newExpression',
    NewExpressionType
> {
    private constructor(fields: FieldsOf<NewExpressionType>, sourceSpan: SourceSpan) {
        super('newExpression', fields, sourceSpan);
    }

    static create(ctx: NewExpressionContext): NewExpressionTypeClass {
        return new NewExpressionTypeClass(
            { value: createNode(ctx.creator(), (c) => CreatorTypeClass.create(c), 'creator') },
            getSourceSpan(ctx),
        );
    }

    getValue(): NewExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isNewExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is NewExpressionTypeClass => isSpicifyApexCommonTypeClass('newExpression', target);
