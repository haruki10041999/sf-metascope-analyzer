import { WhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from './statement';

import { ParExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type WhileStatementType = TypeField<'whileStatement'> & {
    value: ParExpressionTypeClass;
    block: StatementTypeClass;
};

export class WhileStatementTypeClass extends ApexCommonTypeClass<
    'whileStatement',
    WhileStatementType
> {
    private constructor(fields: FieldsOf<WhileStatementType>, sourceSpan: SourceSpan) {
        super('whileStatement', fields, sourceSpan);
    }

    static create(ctx: WhileStatementContext): WhileStatementTypeClass {
        return new WhileStatementTypeClass(
            {
                value: createNode(
                    ctx.parExpression(),
                    (c) => ParExpressionTypeClass.create(c),
                    'parExpression',
                ),
                block: createNode(
                    ctx.statement(),
                    (c) => StatementTypeClass.create(c),
                    'statement',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): WhileStatementType['value'] {
        return this.getFields().value;
    }

    getBlock(): WhileStatementType['block'] {
        return this.getFields().block;
    }
}

export const isWhileStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhileStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('whileStatement', target);
};
