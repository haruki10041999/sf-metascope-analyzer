import { SoslClausesContext } from '@apexdevtools/apex-parser';

import { SoslWithClauseTypeClass } from './soslWithClause';
import { LimitClauseTypeClass } from './limitClause';

import { FieldSpecListTypeClass, UpdateListTypeClass } from '../listVisitor';
import { SearchGroupTypeClass } from '../queryVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SoslClausesType = TypeField<'soslClauses'> & {
    value: SearchGroupTypeClass | null;
    fieldSpecList: FieldSpecListTypeClass | null;
    withList: SoslWithClauseTypeClass[] | null;
    limitClause: LimitClauseTypeClass | null;
    updateList: UpdateListTypeClass | null;
};

export class SoslClausesTypeClass extends ApexCommonTypeClass<'soslClauses', SoslClausesType> {
    private constructor(fields: FieldsOf<SoslClausesType>, sourceSpan: SourceSpan) {
        super('soslClauses', fields, sourceSpan);
    }

    static create(ctx: SoslClausesContext): SoslClausesTypeClass {
        // `IN ... FIELDS` / `RETURNING ...` はいずれも任意
        return new SoslClausesTypeClass(
            {
                value: createOptionalNode(
                    ctx.searchGroup(),
                    (c) => SearchGroupTypeClass.create(c),
                    'searchGroup',
                ),
                fieldSpecList: createOptionalNode(
                    ctx.fieldSpecList(),
                    (c) => FieldSpecListTypeClass.create(c),
                    'fieldSpecList',
                ),
                withList:
                    ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0
                        ? createNodeList(
                              ctx.soslWithClause_list(),
                              (c) => SoslWithClauseTypeClass.create(c),
                              'soslWithClause',
                          )
                        : null,
                limitClause: createOptionalNode(
                    ctx.limitClause(),
                    (c) => LimitClauseTypeClass.create(c),
                    'limitClause',
                ),
                updateList: ctx.UPDATE()
                    ? createOptionalNode(
                          ctx.updateList(),
                          (c) => UpdateListTypeClass.create(c),
                          'updateList',
                      )
                    : null,
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SoslClausesType['value'] {
        return this.getFields().value;
    }

    getFieldSpecList(): SoslClausesType['fieldSpecList'] {
        return this.getFields().fieldSpecList;
    }

    getWithList(): SoslClausesType['withList'] {
        return this.getFields().withList;
    }

    getLimitClause(): SoslClausesType['limitClause'] {
        return this.getFields().limitClause;
    }

    getUpdateList(): SoslClausesType['updateList'] {
        return this.getFields().updateList;
    }
}

export const isSoslClausesType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoslClausesTypeClass => {
    return isSpicifyApexCommonTypeClass('soslClauses', target);
};
