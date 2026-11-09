import { IfStatementContext, StatementContext } from '@apexdevtools/apex-parser';

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

/** if / else if の 1 つの分岐 */
export type IfStatementBranchType = {
    condition: ParExpressionTypeClass;
    block: StatementTypeClass;
};

export type IfStatementType = TypeField<'ifStatement'> & {
    /** if と、それに続く else if を平らにした分岐の並び (先頭は if) */
    branches: [IfStatementBranchType, ...IfStatementBranchType[]];
    /** 最後の else (ないときは null) */
    elseBlock: StatementTypeClass | null;
};

export class IfStatementTypeClass extends ApexCommonTypeClass<'ifStatement', IfStatementType> {
    private constructor(fields: FieldsOf<IfStatementType>, sourceSpan: SourceSpan) {
        super('ifStatement', fields, sourceSpan);
    }

    static create(ctx: IfStatementContext): IfStatementTypeClass {
        const createBranch = (branchCtx: IfStatementContext): IfStatementBranchType => ({
            condition: createNode(
                branchCtx.parExpression(),
                (c) => ParExpressionTypeClass.create(c),
                'parExpression',
            ),
            block: createNode(
                (branchCtx.statement_list() ?? []).at(0),
                (c) => StatementTypeClass.create(c),
                'statement',
            ),
        });
        // else の文 (ELSE がなければ undefined)
        const elseOf = (branchCtx: IfStatementContext): StatementContext | undefined =>
            branchCtx.ELSE() ? (branchCtx.statement_list() ?? []).at(1) : undefined;

        const branches: IfStatementType['branches'] = [createBranch(ctx)];
        let elseBlock: IfStatementType['elseBlock'] = null;

        let elseStatementCtx = elseOf(ctx);
        while (elseStatementCtx) {
            // else if は入れ子の ifStatement なので、同じ並びに続けて入れる
            const nestedIf: IfStatementContext | null = elseStatementCtx.ifStatement();
            if (nestedIf) {
                branches.push(createBranch(nestedIf));
                elseStatementCtx = elseOf(nestedIf);
                continue;
            }

            elseBlock = createNode(
                elseStatementCtx,
                (c) => StatementTypeClass.create(c),
                'statement',
            );
            break;
        }

        return new IfStatementTypeClass({ branches, elseBlock }, getSourceSpan(ctx));
    }

    getBranches(): IfStatementType['branches'] {
        return this.getFields().branches;
    }

    getElseBlock(): IfStatementType['elseBlock'] {
        return this.getFields().elseBlock;
    }
}

export const isIfStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is IfStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('ifStatement', target);
};
