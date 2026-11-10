import { SwitchStatementContext } from '@apexdevtools/apex-parser';

import { WhenControlTypeClass } from '../controlVisitor';
import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SwitchStatementType = TypeField<'switchStatement'> & {
    value: BasedExpressionTypeClass;
    blocks: WhenControlTypeClass[];
};

export class SwitchStatementTypeClass extends ApexCommonTypeClass<
    'switchStatement',
    SwitchStatementType
> {
    private constructor(fields: FieldsOf<SwitchStatementType>, sourceSpan: SourceSpan) {
        super('switchStatement', fields, sourceSpan);
    }

    static create(ctx: SwitchStatementContext): SwitchStatementTypeClass {
        return new SwitchStatementTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                blocks: createNodeList(
                    ctx.whenControl_list(),
                    (c) => WhenControlTypeClass.create(c),
                    'whenControl',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SwitchStatementType['value'] {
        return this.getFields().value;
    }

    getBlocks(): SwitchStatementType['blocks'] {
        return this.getFields().blocks;
    }
}

export const isSwitchStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SwitchStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('switchStatement', target);
};
