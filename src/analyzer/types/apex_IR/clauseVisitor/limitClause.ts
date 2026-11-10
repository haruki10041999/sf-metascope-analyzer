import { LimitClauseContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type LimitClauseType = TypeField<'limitClause'> & {
    /** 整数リテラル (literal) かバインド式 (bind) */
    value: { kind: 'literal'; value: string } | { kind: 'bind'; value: BoundExpressionTypeClass };
};

export class LimitClauseTypeClass extends ApexCommonTypeClass<'limitClause', LimitClauseType> {
    private constructor(fields: FieldsOf<LimitClauseType>, sourceSpan: SourceSpan) {
        super('limitClause', fields, sourceSpan);
    }

    static create(ctx: LimitClauseContext): LimitClauseTypeClass {
        return new LimitClauseTypeClass(
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

    getValue(): LimitClauseType['value'] {
        return this.getFields().value;
    }
}

export const isLimitClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LimitClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('limitClause', target);
};
