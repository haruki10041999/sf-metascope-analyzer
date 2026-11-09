import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { BasedExpressionTypeClass, ExpressionVisitor, isBasedExpressionType } from '.';

import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** `(valueType) value` */
export type CastExpressionType = TypeField<'castExpression'> & {
    valueType: TypeRefTypeClass;
    value: BasedExpressionTypeClass;
};

export class CastExpressionTypeClass extends ApexCommonTypeClass<
    'castExpression',
    CastExpressionType
> {
    private constructor(fields: FieldsOf<CastExpressionType>, sourceSpan: SourceSpan) {
        super('castExpression', fields, sourceSpan);
    }

    static create(ctx: CastExpressionContext): CastExpressionTypeClass {
        return new CastExpressionTypeClass(
            {
                valueType: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): CastExpressionType['value'] {
        return this.getFields().value;
    }

    getValueType(): CastExpressionType['valueType'] {
        return this.getFields().valueType;
    }
}

export const isCastExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CastExpressionTypeClass => isSpicifyApexCommonTypeClass('castExpression', target);
