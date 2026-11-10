import { ArgumentsContext } from '@apexdevtools/apex-parser';

import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ArgumentsType = TypeField<'arguments'> & {
    /** 引数なし `()` のときは null */
    elements: ExpressionListTypeClass | null;
};

export class ArgumentsTypeClass extends ApexCommonTypeClass<'arguments', ArgumentsType> {
    private constructor(fields: FieldsOf<ArgumentsType>, sourceSpan: SourceSpan) {
        super('arguments', fields, sourceSpan);
    }

    static create(ctx: ArgumentsContext): ArgumentsTypeClass {
        return new ArgumentsTypeClass(
            {
                elements: createOptionalNode(
                    ctx.expressionList(),
                    (c) => ExpressionListTypeClass.create(c),
                    'expressionList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getElements(): ArgumentsType['elements'] {
        return this.getFields().elements;
    }
}

export const isArgumentsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArgumentsTypeClass => isSpicifyApexCommonTypeClass('arguments', target);
