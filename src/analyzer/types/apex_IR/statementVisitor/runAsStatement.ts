import { RunAsStatementContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from '../blockVisitor';
import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type RunAsStatementType = TypeField<'runAsStatement'> & {
    /** 文法上 `System.runAs()` の引数は省略できる */
    value: ExpressionListTypeClass | null;
    block: BlockTypeClass;
};

export class RunAsStatementTypeClass extends ApexCommonTypeClass<
    'runAsStatement',
    RunAsStatementType
> {
    private constructor(fields: FieldsOf<RunAsStatementType>, sourceSpan: SourceSpan) {
        super('runAsStatement', fields, sourceSpan);
    }

    static create(ctx: RunAsStatementContext): RunAsStatementTypeClass {
        return new RunAsStatementTypeClass(
            {
                value: createOptionalNode(
                    ctx.expressionList(),
                    (c) => ExpressionListTypeClass.create(c),
                    'expressionList',
                ),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): RunAsStatementType['value'] {
        return this.getFields().value;
    }

    getBlock(): RunAsStatementType['block'] {
        return this.getFields().block;
    }
}

export const isRunAsStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is RunAsStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('runAsStatement', target);
};
