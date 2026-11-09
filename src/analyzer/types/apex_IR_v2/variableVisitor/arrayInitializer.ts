import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ArrayInitializerType = TypeField<'arrayInitializer'> & {
    element: BasedExpressionTypeClass[];
};

export class ArrayInitializerTypeClass extends ApexCommonTypeClass<
    'arrayInitializer',
    ArrayInitializerType
> {
    private constructor(fields: FieldsOf<ArrayInitializerType>, sourceSpan: SourceSpan) {
        super('arrayInitializer', fields, sourceSpan);
    }

    static create(ctx: ArrayInitializerContext): ArrayInitializerTypeClass {
        return new ArrayInitializerTypeClass(
            {
                element: visitNodeList(
                    new ExpressionVisitor(),
                    ctx.expression_list(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
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
