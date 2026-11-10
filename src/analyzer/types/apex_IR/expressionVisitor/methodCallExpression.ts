import { MethodCallExpressionContext } from '@apexdevtools/apex-parser';

import { MethodCallTypeClass } from '../callVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type MethodCallExpressionType = TypeField<'methodCallExpression'> & {
    value: MethodCallTypeClass;
};

export class MethodCallExpressionTypeClass extends ApexCommonTypeClass<
    'methodCallExpression',
    MethodCallExpressionType
> {
    private constructor(fields: FieldsOf<MethodCallExpressionType>, sourceSpan: SourceSpan) {
        super('methodCallExpression', fields, sourceSpan);
    }

    static create(ctx: MethodCallExpressionContext): MethodCallExpressionTypeClass {
        return new MethodCallExpressionTypeClass(
            {
                value: createNode(
                    ctx.methodCall(),
                    (c) => MethodCallTypeClass.create(c),
                    'methodCall',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): MethodCallExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isMethodCallExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MethodCallExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('methodCallExpression', target);
