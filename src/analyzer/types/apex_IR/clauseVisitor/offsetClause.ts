import { OffsetClauseContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type OffsetClauseType = TypeField<'offsetClause'> & {
    /** 整数リテラル (literal) かバインド式 (bind) */
    value: { kind: 'literal'; value: string } | { kind: 'bind'; value: BoundExpressionTypeClass };
};

export class OffsetClauseTypeClass extends ApexCommonTypeClass<'offsetClause', OffsetClauseType> {
    private constructor(fields: FieldsOf<OffsetClauseType>, sourceSpan: SourceSpan) {
        super('offsetClause', fields, sourceSpan);
    }

    static create(ctx: OffsetClauseContext): OffsetClauseTypeClass {
        return new OffsetClauseTypeClass(
            {
                value: ctx.IntegerLiteral()
                    ? { kind: 'literal', value: ctx.IntegerLiteral().getText() }
                    : {
                          kind: 'bind',
                          value: createNode(
                              ctx.boundExpression(),
                              (c) => BoundExpressionTypeClass.create(c),
                              'boundExpression',
                          ),
                      },
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): OffsetClauseType['value'] {
        return this.getFields().value;
    }
}

export const isOffsetClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is OffsetClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('offsetClause', target);
};
