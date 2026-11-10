import { DoWhileStatementContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from '../blockVisitor';
import { ParExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DoWhileStatementType = TypeField<'doWhileStatement'> & {
    value: ParExpressionTypeClass;
    block: BlockTypeClass;
};

export class DoWhileStatementTypeClass extends ApexCommonTypeClass<
    'doWhileStatement',
    DoWhileStatementType
> {
    private constructor(fields: FieldsOf<DoWhileStatementType>, sourceSpan: SourceSpan) {
        super('doWhileStatement', fields, sourceSpan);
    }

    static create(ctx: DoWhileStatementContext): DoWhileStatementTypeClass {
        return new DoWhileStatementTypeClass(
            {
                value: createNode(
                    ctx.parExpression(),
                    (c) => ParExpressionTypeClass.create(c),
                    'parExpression',
                ),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DoWhileStatementType['value'] {
        return this.getFields().value;
    }

    getBlock(): DoWhileStatementType['block'] {
        return this.getFields().block;
    }
}

export const isDoWhileStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DoWhileStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('doWhileStatement', target);
};
