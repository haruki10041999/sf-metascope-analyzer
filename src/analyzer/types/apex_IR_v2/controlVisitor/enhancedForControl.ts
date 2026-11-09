import { EnhancedForControlContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** `for (型 変数 : 式)` */
export type EnhancedForControlType = TypeField<'enhancedForControl'> & {
    value: IdTypeClass;
    valueType: TypeRefTypeClass;
    fromVariant: BasedExpressionTypeClass;
};

export class EnhancedForControlTypeClass extends ApexCommonTypeClass<
    'enhancedForControl',
    EnhancedForControlType
> {
    private constructor(fields: FieldsOf<EnhancedForControlType>, sourceSpan: SourceSpan) {
        super('enhancedForControl', fields, sourceSpan);
    }

    static create(ctx: EnhancedForControlContext): EnhancedForControlTypeClass {
        return new EnhancedForControlTypeClass(
            {
                value: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                valueType: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                fromVariant: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): EnhancedForControlType['value'] {
        return this.getFields().value;
    }

    getValueType(): EnhancedForControlType['valueType'] {
        return this.getFields().valueType;
    }

    getFromVariant(): EnhancedForControlType['fromVariant'] {
        return this.getFields().fromVariant;
    }
}

export const isEnhancedForControlType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is EnhancedForControlTypeClass => {
    return isSpicifyApexCommonTypeClass('enhancedForControl', target);
};
