import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import {
    NormalSoqlFunctionName,
    isNormalSoqlFunctionType,
    makeNormalSoqlFunctionName,
    NormalSoqlFunctionType,
    makeNormalSoqlFunctionType,
} from './normal';
import { CountFunctionType, isCountFunctionType, makeCountFunctionType } from './count';
import {
    SoqlFieldParameterName,
    isFieldsFunctionType,
    FieldsFunctionType,
    makeFieldsFunctionType,
} from './soqlFieldParameter';
import {
    DateSoqlFunctionName,
    isDateFunctionType,
    makeDateSoqlFunctionName,
    DateFunctionType,
    makeDateFunctionType,
} from './dateFieldName';
import {
    DistanceValueType,
    isDistanceFunctionType,
    DistanceFunctionType,
    makeDistanceFunctionType,
} from './locationValue';

export type SoqlFunctionField = { order: number } & (
    | NormalSoqlFunctionType
    | CountFunctionType
    | FieldsFunctionType
    | DateFunctionType
    | DistanceFunctionType
);

export const makeSoqlFunctionField = (ctx: SoqlFunctionContext): SoqlFunctionField[] => {
    const soqlFunctionfields: SoqlFunctionField[] = [];
    let order: number = 1;
    _makeSoqlFunctionField(ctx, order, soqlFunctionfields);
    return soqlFunctionfields;
};

const _makeSoqlFunctionField = (
    ctx: SoqlFunctionContext,
    order: number,
    soqlFunctionFields: SoqlFunctionField[],
): void => {
    if (ctx.soqlFunction()) {
        return _makeSoqlFunctionField(ctx, order, soqlFunctionFields);
    }

    if (isCountFunctionType(ctx)) {
        soqlFunctionFields.push({
            order: order,
            ...makeCountFunctionType(ctx),
        });
        order++;
        return;
    }

    if (isNormalSoqlFunctionType(ctx)) {
        const type = makeNormalSoqlFunctionName(ctx);
        soqlFunctionFields.push({
            order: order,
            ...makeNormalSoqlFunctionType(type, ctx.fieldName()),
        });
        order++;
        return;
    }

    if (isFieldsFunctionType(ctx)) {
        soqlFunctionFields.push({
            order: order,
            ...makeFieldsFunctionType(ctx.soqlFieldsParameter()),
        });
        order++;
        return;
    }

    if (isDateFunctionType(ctx)) {
        const type = makeDateSoqlFunctionName(ctx);
        soqlFunctionFields.push({
            order: order,
            ...makeDateFunctionType(type, ctx.dateFieldName()),
        });
        order++;
        return;
    }

    if (isDistanceFunctionType(ctx)) {
        const unit = ctx.StringLiteral().getText();
        soqlFunctionFields.push({
            order: order,
            ...makeDistanceFunctionType(ctx.locationValue_list(), unit),
        });
        order++;
        return;
    }
};
