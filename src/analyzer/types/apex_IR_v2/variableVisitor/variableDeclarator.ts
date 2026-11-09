import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    visitOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { IdTypeClass } from '../idVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type VariableDeclaratorType = TypeField<'variableDeclarator'> & {
    variant: IdTypeClass;
    /** 初期化子は任意 (`String name;`) */
    init: BasedExpressionTypeClass | null;
};

export class VariableDeclaratorTypeClass extends ApexCommonTypeClass<
    'variableDeclarator',
    VariableDeclaratorType
> {
    private constructor(fields: FieldsOf<VariableDeclaratorType>, sourceSpan: SourceSpan) {
        super('variableDeclarator', fields, sourceSpan);
    }

    static create(ctx: VariableDeclaratorContext): VariableDeclaratorTypeClass {
        return new VariableDeclaratorTypeClass(
            {
                variant: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                init: visitOptionalNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getVariant(): VariableDeclaratorType['variant'] {
        return this.getFields().variant;
    }

    getInit(): VariableDeclaratorType['init'] {
        return this.getFields().init;
    }
}

export const isVariableDeclaratorType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclaratorTypeClass => {
    return isSpicifyApexCommonTypeClass('variableDeclarator', target);
};
