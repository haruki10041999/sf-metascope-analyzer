import { ForStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from './statement';

import { ForControlTypeClass } from '../controlVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ForStatementType = TypeField<'forStatement'> & {
    value: ForControlTypeClass;
    block: StatementTypeClass;
};

export class ForStatementTypeClass extends ApexCommonTypeClass<'forStatement', ForStatementType> {
    private constructor(fields: FieldsOf<ForStatementType>, sourceSpan: SourceSpan) {
        super('forStatement', fields, sourceSpan);
    }

    static create(ctx: ForStatementContext): ForStatementTypeClass {
        return new ForStatementTypeClass(
            {
                value: createNode(
                    ctx.forControl(),
                    (c) => ForControlTypeClass.create(c),
                    'forControl',
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

    getValue(): ForStatementType['value'] {
        return this.getFields().value;
    }

    getBlock(): ForStatementType['block'] {
        return this.getFields().block;
    }
}

export const isForStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ForStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('forStatement', target);
};
