import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNodeList,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SetCreatorRestType = TypeField<'setCreatorRest'> & {
    value: BasedExpressionTypeClass[];
};

export class SetCreatorRestTypeClass extends ApexCommonTypeClass<
    'setCreatorRest',
    SetCreatorRestType
> {
    private constructor(fields: FieldsOf<SetCreatorRestType>, sourceSpan: SourceSpan) {
        super('setCreatorRest', fields, sourceSpan);
    }

    static create(ctx: SetCreatorRestContext): SetCreatorRestTypeClass {
        return new SetCreatorRestTypeClass(
            {
                value: visitNodeList(
                    new ExpressionVisitor(),
                    ctx.expression_list(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SetCreatorRestType['value'] {
        return this.getFields().value;
    }
}

export const isSetCreatorRestType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SetCreatorRestTypeClass => isSpicifyApexCommonTypeClass('setCreatorRest', target);
