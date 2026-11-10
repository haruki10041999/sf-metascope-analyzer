import { TypeOfContext } from '@apexdevtools/apex-parser';

import { WhenClauseTypeClass } from './whenClause';
import { ElseClauseTypeClass } from './elseClause';

import { FieldNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeOfType = TypeField<'typeOf'> & {
    value: FieldNameTypeClass;
    whenClause: WhenClauseTypeClass[];
    elseClause: ElseClauseTypeClass | null;
};

export class TypeOfTypeClass extends ApexCommonTypeClass<'typeOf', TypeOfType> {
    private constructor(fields: FieldsOf<TypeOfType>, sourceSpan: SourceSpan) {
        super('typeOf', fields, sourceSpan);
    }

    static create(ctx: TypeOfContext): TypeOfTypeClass {
        if (!ctx.whenClause_list() || ctx.whenClause_list().length === 0) {
            throw new Error('値が異常です。TypeOfContext: ' + ctx.getText());
        }

        return new TypeOfTypeClass(
            {
                value: createNode(
                    ctx.fieldName(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
                whenClause: createNodeList(
                    ctx.whenClause_list(),
                    (c) => WhenClauseTypeClass.create(c),
                    'whenClause',
                ),
                elseClause: createOptionalNode(
                    ctx.elseClause(),
                    (c) => ElseClauseTypeClass.create(c),
                    'elseClause',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): TypeOfType['value'] {
        return this.getFields().value;
    }

    getWhenClause(): TypeOfType['whenClause'] {
        return this.getFields().whenClause;
    }

    getElseClause(): TypeOfType['elseClause'] {
        return this.getFields().elseClause;
    }
}

export const isTypeOfType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeOfTypeClass => {
    return isSpicifyApexCommonTypeClass('typeOf', target);
};
