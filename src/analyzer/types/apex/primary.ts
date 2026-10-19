import typia from 'typia';

import {
    NormalPrimaryTypeClass,
    ThisPrimaryTypeClass,
    VoidPrimaryTypeClass,
    SuperPrimaryTypeClass,
    IdPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SoslPrimaryTypeClass,
    BasedPrimaryTypeClass,
    NormalIdTypeClass,
    isNormalPrimaryType,
    isThisPrimaryType,
    isVoidPrimaryType,
    isSuperPrimaryType,
    isTypeRefPrimaryType,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isSoqlPrimaryType,
    isSoslPrimaryType,
    isNormalIdType,
} from '../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    assignMultiClass,
    isErrorInfo,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeErrorInfo,
    makeSourceInfo,
    makeEmptySourceInfoMap,
    makeSingleSourceInfoMap,
    makeArraySourceInfoMap,
} from './converter/commons';
import { makeTypeType, TypeType } from './type';
import { SoqlType, makesoqlType } from './query';
import { SoslType, makeSoslType } from './query';

export const makePrimaryType = (
    target: BasedPrimaryTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
) => {
    const primary = assignMultiClass(target, [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
            construct: (primaryTypeClass: NormalPrimaryTypeClass) => {
                sourceInfo[primaryTypeClass.getType()] = makeSingleSourceInfoMap(primaryTypeClass);
                return assignMultiClass(target.getValue(), [
                    {
                        isValid: (target: unknown) => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryType),
            construct: (thisPrimaryTypeClass: ThisPrimaryTypeClass) => {
                sourceInfo[thisPrimaryTypeClass.getType()] =
                    makeSingleSourceInfoMap(thisPrimaryTypeClass);
                return assignMultiClass(target.getValue(), [
                    {
                        isValid: (target: unknown) => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryType),
            construct: (superPrimaryTypeClass: SuperPrimaryTypeClass) => {
                sourceInfo[superPrimaryTypeClass.getType()] =
                    makeSingleSourceInfoMap(superPrimaryTypeClass);
                return assignMultiClass(target.getValue(), [
                    {
                        isValid: (target: unknown) => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isVoidPrimaryType),
            construct: (voidPrimaryTypeClass: VoidPrimaryTypeClass) => {
                sourceInfo[voidPrimaryTypeClass.getType()] =
                    makeSingleSourceInfoMap(voidPrimaryTypeClass);
                return assignMultiClass(target.getValue(), [
                    {
                        isValid: (target: unknown) => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryType),
            construct: (idPrimaryTypeClass: IdPrimaryTypeClass) => {
                const idPrimarySouceType = idPrimaryTypeClass.getType();
                const idPrimarySourceInfo = makeEmptySourceInfoMap();
                const idPrimary = assignMultiClass(target.getValue(), [
                    {
                        isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
                        construct: (idTypeClass: NormalIdTypeClass) => {
                            idPrimarySourceInfo[idPrimarySouceType] =
                                makeSingleSourceInfoMap(idTypeClass);
                            return idTypeClass.getValue();
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[idPrimarySouceType] = idPrimarySourceInfo;
                return idPrimary;
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryType),
            construct: (literalPrimaryTypeClass: LiteralPrimaryTypeClass) => {},
        },
        makeErrorAssignRule(errorInfo),
    ]);

    return primary;
};
