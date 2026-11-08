import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ArrayInitializerType = TypeField<'arrayInitializer'> & {
    element: BasedExpressionTypeClass[];
};

export class ArrayInitializerTypeClass extends ApexCommonTypeClass<
    'arrayInitializer',
    ArrayInitializerType
> {
    private constructor(element: BasedExpressionTypeClass[], sourceSpan: SourceSpan) {
        super('arrayInitializer', { element: element }, sourceSpan);
    }

    public static create(ctx: ArrayInitializerContext) {
        return new ArrayInitializerTypeClass(
            ctx.expression_list().map((e) => new ExpressionVisitor().visit(e)),
            getSourceSpan(ctx),
        );
    }

    getElement(): ArrayInitializerType['element'] {
        return this.getFields().element;
    }
}

export const isArrayInitializerType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArrayInitializerTypeClass => {
    return isSpicifyApexCommonTypeClass('arrayInitializer', target);
};
