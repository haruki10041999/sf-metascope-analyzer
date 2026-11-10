import { ForClausesContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

type ForClauseValueType = 'VIEW' | 'UPDATE' | 'REFERENCE';

export type ForClausesType = TypeField<'forClauses'> & {
    value: ForClauseValueType[];
};

export class ForClausesTypeClass extends ApexCommonTypeClass<'forClauses', ForClausesType> {
    private constructor(fields: FieldsOf<ForClausesType>, sourceSpan: SourceSpan) {
        super('forClauses', fields, sourceSpan);
    }

    static create(ctx: ForClausesContext): ForClausesTypeClass {
        if (ctx.FOR_list().length === 0) {
            throw new Error('値が異常です。ForClausesContext: ' + ctx.getText());
        }

        const tokens: [ForClauseValueType, number][] = [
            ...ctx
                .VIEW_list()
                .map((n): [ForClauseValueType, number] => ['VIEW', n.symbol.tokenIndex]),
            ...ctx
                .UPDATE_list()
                .map((n): [ForClauseValueType, number] => ['UPDATE', n.symbol.tokenIndex]),
            ...ctx
                .REFERENCE_list()
                .map((n): [ForClauseValueType, number] => ['REFERENCE', n.symbol.tokenIndex]),
        ];

        return new ForClausesTypeClass(
            { value: tokens.sort((a, b) => a[1] - b[1]).map(([value]) => value) },
            getSourceSpan(ctx),
        );
    }

    getValue(): ForClausesType['value'] {
        return this.getFields().value;
    }
}

export const isForClausesType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ForClausesTypeClass => {
    return isSpicifyApexCommonTypeClass('forClauses', target);
};
