import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import { DateFieldNameTypeClass, FieldNameTypeClass } from '../nameVisitor';
import { SoqlFieldsParameterTypeClass } from '../parameterVisitor';
import { LocationValueTypeClass } from '../valueVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type NormalSoqlFunctionType =
    'AVG' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'SUM' | 'TOLABEL' | 'GROUPING' | 'CONVERT_CURRENCY';
export type DateFunctionType =
    | 'CALENDAR_MONTH'
    | 'CALENDAR_QUARTER'
    | 'CALENDAR_YEAR'
    | 'DAY_IN_MONTH'
    | 'DAY_IN_WEEK'
    | 'DAY_IN_YEAR'
    | 'DAY_ONLY'
    | 'FISCAL_MONTH'
    | 'FISCAL_QUARTER'
    | 'FISCAL_YEAR'
    | 'HOUR_IN_DAY'
    | 'WEEK_IN_MONTH'
    | 'WEEK_IN_YEAR';

/** 関数ごとに引数の形が決まる (判別 union) */
export type SoqlFunctionType = TypeField<'soqlFunction'> &
    (
        | { kind: NormalSoqlFunctionType; param: FieldNameTypeClass }
        | { kind: DateFunctionType; param: DateFieldNameTypeClass }
        /** `COUNT()` は引数なし (null)、`COUNT(field)` は fieldName */
        | { kind: 'COUNT'; param: FieldNameTypeClass | null }
        | { kind: 'FORMAT'; param: FieldNameTypeClass | SoqlFunctionTypeClass }
        | { kind: 'FIELDS'; param: SoqlFieldsParameterTypeClass }
        | {
              kind: 'DISTANCE';
              /** DISTANCE(from, to, 'unit')。unit は文字列リテラル (引用符つき) */
              param: { from: LocationValueTypeClass; to: LocationValueTypeClass; unit: string };
          }
    );

const getNormalFunction = (ctx: SoqlFunctionContext): NormalSoqlFunctionType | null => {
    if (ctx.AVG()) return 'AVG';
    if (ctx.COUNT_DISTINCT()) return 'COUNT_DISTINCT';
    if (ctx.MIN()) return 'MIN';
    if (ctx.MAX()) return 'MAX';
    if (ctx.SUM()) return 'SUM';
    if (ctx.TOLABEL()) return 'TOLABEL';
    if (ctx.GROUPING()) return 'GROUPING';
    if (ctx.CONVERT_CURRENCY()) return 'CONVERT_CURRENCY';
    return null;
};

const getDateFunction = (ctx: SoqlFunctionContext): DateFunctionType | null => {
    if (ctx.CALENDAR_MONTH()) return 'CALENDAR_MONTH';
    if (ctx.CALENDAR_QUARTER()) return 'CALENDAR_QUARTER';
    if (ctx.CALENDAR_YEAR()) return 'CALENDAR_YEAR';
    if (ctx.DAY_IN_MONTH()) return 'DAY_IN_MONTH';
    if (ctx.DAY_IN_WEEK()) return 'DAY_IN_WEEK';
    if (ctx.DAY_IN_YEAR()) return 'DAY_IN_YEAR';
    if (ctx.DAY_ONLY()) return 'DAY_ONLY';
    if (ctx.FISCAL_MONTH()) return 'FISCAL_MONTH';
    if (ctx.FISCAL_QUARTER()) return 'FISCAL_QUARTER';
    if (ctx.FISCAL_YEAR()) return 'FISCAL_YEAR';
    if (ctx.HOUR_IN_DAY()) return 'HOUR_IN_DAY';
    if (ctx.WEEK_IN_MONTH()) return 'WEEK_IN_MONTH';
    if (ctx.WEEK_IN_YEAR()) return 'WEEK_IN_YEAR';
    return null;
};

export class SoqlFunctionTypeClass extends ApexCommonTypeClass<'soqlFunction', SoqlFunctionType> {
    private constructor(fields: FieldsOf<SoqlFunctionType>, sourceSpan: SourceSpan) {
        super('soqlFunction', fields, sourceSpan);
    }

    static create(ctx: SoqlFunctionContext): SoqlFunctionTypeClass {
        return new SoqlFunctionTypeClass(
            SoqlFunctionTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(ctx: SoqlFunctionContext): FieldsOf<SoqlFunctionType> {
        const normal = getNormalFunction(ctx);
        if (normal) {
            return {
                kind: normal,
                param: createNode(
                    ctx.fieldName(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
            };
        }

        const date = getDateFunction(ctx);
        if (date) {
            return {
                kind: date,
                param: createNode(
                    ctx.dateFieldName(),
                    (c) => DateFieldNameTypeClass.create(c),
                    'dateFieldName',
                ),
            };
        }

        if (ctx.COUNT()) {
            // `COUNT()` は引数なし、`COUNT(field)` は fieldName
            return {
                kind: 'COUNT',
                param: ctx.fieldName()
                    ? createNode(ctx.fieldName(), (c) => FieldNameTypeClass.create(c), 'fieldName')
                    : null,
            };
        }

        if (ctx.FORMAT()) {
            return {
                kind: 'FORMAT',
                param: ctx.soqlFunction()
                    ? createNode(
                          ctx.soqlFunction(),
                          (c) => SoqlFunctionTypeClass.create(c),
                          'soqlFunction',
                      )
                    : createNode(ctx.fieldName(), (c) => FieldNameTypeClass.create(c), 'fieldName'),
            };
        }

        if (ctx.FIELDS()) {
            return {
                kind: 'FIELDS',
                param: createNode(
                    ctx.soqlFieldsParameter(),
                    (c) => SoqlFieldsParameterTypeClass.create(c),
                    'soqlFieldsParameter',
                ),
            };
        }

        if (ctx.DISTANCE()) {
            const unit = ctx.StringLiteral() ?? ctx.MultilineStringLiteral();
            if (!unit) {
                throw new Error('値が異常です。SoqlFunctionContext: ' + ctx.getText());
            }
            const locations = ctx.locationValue_list();
            return {
                kind: 'DISTANCE',
                param: {
                    from: createNode(
                        locations[0],
                        (c) => LocationValueTypeClass.create(c),
                        'locationValue',
                    ),
                    to: createNode(
                        locations[1],
                        (c) => LocationValueTypeClass.create(c),
                        'locationValue',
                    ),
                    unit: unit.getText(),
                },
            };
        }

        throw new Error('値が異常です。SoqlFunctionContext: ' + ctx.getText());
    }

    getKind(): SoqlFunctionType['kind'] {
        return this.getFields().kind;
    }

    getParam(): SoqlFunctionType['param'] {
        return this.getFields().param;
    }
}

export const isSoqlFunctionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SoqlFunctionTypeClass => {
    return isSpicifyApexCommonTypeClass('soqlFunction', target);
};
