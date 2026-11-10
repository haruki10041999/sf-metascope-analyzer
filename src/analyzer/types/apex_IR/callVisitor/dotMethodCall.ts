import { DotMethodCallContext } from '@apexdevtools/apex-parser';

import { AnyIdTypeClass } from '../idVisitor';
import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DotMethodCallType = TypeField<'dotMethodCall'> & {
    value: AnyIdTypeClass;
    param: ExpressionListTypeClass | null;
};

export class DotMethodCallTypeClass extends ApexCommonTypeClass<
    'dotMethodCall',
    DotMethodCallType
> {
    private constructor(fields: FieldsOf<DotMethodCallType>, sourceSpan: SourceSpan) {
        super('dotMethodCall', fields, sourceSpan);
    }

    static create(ctx: DotMethodCallContext): DotMethodCallTypeClass {
        return new DotMethodCallTypeClass(
            {
                value: createNode(ctx.anyId(), (c) => AnyIdTypeClass.create(c), 'anyId'),
                param: createOptionalNode(
                    ctx.expressionList(),
                    (c) => ExpressionListTypeClass.create(c),
                    'expressionList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DotMethodCallType['value'] {
        return this.getFields().value;
    }

    getParam(): DotMethodCallType['param'] {
        return this.getFields().param;
    }
}

export const isDotMethodCallType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DotMethodCallTypeClass => isSpicifyApexCommonTypeClass('dotMethodCall', target);
