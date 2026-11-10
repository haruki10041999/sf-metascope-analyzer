import { SoslLiteralContext } from '@apexdevtools/apex-parser';

import { BoundExpressionTypeClass } from '../expressionVisitor';
import { SoslClausesTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoslLiteralType = TypeField<'soslLiteral'> & {
    /** `FIND 'xxx'` (literal) と `FIND :var` (bind) */
    search: { kind: 'literal'; text: string } | { kind: 'bind'; expr: BoundExpressionTypeClass };
    soslClauses: SoslClausesTypeClass;
};

export class SoslLiteralTypeClass extends ApexCommonTypeClass<'soslLiteral', SoslLiteralType> {
    private constructor(fields: FieldsOf<SoslLiteralType>, sourceSpan: SourceSpan) {
        super('soslLiteral', fields, sourceSpan);
    }

    static create(ctx: SoslLiteralContext): SoslLiteralTypeClass {
        // `[FIND 'xxx' ...]` は FindLiteral、`[FIND :var ...]` は boundExpression
        const search: SoslLiteralType['search'] = ctx.FindLiteral()
            ? { kind: 'literal', text: ctx.FindLiteral().getText() }
            : {
                  kind: 'bind',
                  expr: createNode(
                      ctx.boundExpression(),
                      (c) => BoundExpressionTypeClass.create(c),
                      'boundExpression',
                  ),
              };

        return new SoslLiteralTypeClass(
            {
                search,
                soslClauses: createNode(
                    ctx.soslClauses(),
                    (c) => SoslClausesTypeClass.create(c),
                    'soslClauses',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getSearch(): SoslLiteralType['search'] {
        return this.getFields().search;
    }

    getSoslClauses(): SoslLiteralType['soslClauses'] {
        return this.getFields().soslClauses;
    }
}

export const isSoslLiteralType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslLiteralTypeClass => isSpicifyApexCommonTypeClass('soslLiteral', target);
