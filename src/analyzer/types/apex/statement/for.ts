import {
    ForStatementClass,
    EnhancedForControlClass,
    LocalVariableDeclarationClass,
    ExpressionClass,
    isLocalVariableDeclarationClass,
    isExpressionClass,
    isExpressionClassArray,
    isEnhancedForControlClass,
} from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ExpressionType, makeExpressionType } from '../expression';
import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from './statement';

type EnhancedFor = {
    variableName: string;
    variableType: TypeType;
    iterable: ExpressionType;
};

type NormalForInit =
    | {
          variant: { variant: string; initValue?: ExpressionType }[];
          variantType: TypeType;
          modifier?: ModifierType;
      }
    | ExpressionType[];

type NormalFor = {
    init: NormalForInit;
    condition: ExpressionType;
    update: ExpressionType[];
};

export type ForField = {
    type: 'for';
    condition: EnhancedFor | NormalFor;
    block: StatementType;
};

const makeEnhancedFor = (enhancedFor: EnhancedForControlClass): EnhancedFor | undefined => {
    const variableName = enhancedFor.getValue();
    const variableType = makeTypeType(enhancedFor.getValueType());
    const iterable = makeExpressionType(enhancedFor.getFromVariant());

    if (variableName && variableType && iterable) {
        return {
            variableName: variableName,
            variableType: variableType,
            iterable: iterable,
        };
    }

    return undefined;
};

const makeNormalFor = (
    init: LocalVariableDeclarationClass | ExpressionClass[],
    condition: ExpressionClass,
    update: ExpressionClass[],
): NormalFor | undefined => {
    const cond = makeExpressionType(condition);
    const updates = update.map((u) => makeExpressionType(u)).filter((u) => u !== undefined);

    if (cond && updates.length > 0) {
        if (isLocalVariableDeclarationClass(init)) {
            const value = init.getValue();
            const valueType = makeTypeType(init.getValueType());
            const modifier = makeModifierType(init.getModifier());

            if (valueType) {
                const initValues: { variant: string; initValue?: ExpressionType }[] = [];

                value.forEach((v) => {
                    const variant = v.getValue();
                    const content = makeExpressionType(v.getContent());

                    if (variant) {
                        const initValue: { variant: string; initValue?: ExpressionType } = {
                            variant: variant,
                        };

                        if (content) {
                            initValue.initValue = content;
                        }

                        initValues.push(initValue);
                    }
                });

                const inits: {
                    variant: { variant: string; initValue?: ExpressionType }[];
                    variantType: TypeType;
                    modifier?: ModifierType;
                } = {
                    variant: initValues,
                    variantType: valueType,
                };

                if (modifier) {
                    inits.modifier = modifier;
                }

                return {
                    init: inits,
                    condition: cond,
                    update: updates,
                };
            }
        }

        if (isExpressionClassArray(init)) {
            const inits = init.map((i) => makeExpressionType(i)).filter((i) => i !== undefined);
            if (inits) {
                return {
                    init: inits,
                    condition: cond,
                    update: updates,
                };
            }
        }
    }

    return undefined;
};

export const makeForField = (forStatement: ForStatementClass): ForField | undefined => {
    const forControl = forStatement.getValue();
    const block = makeStatementType(forStatement.getBlock());

    if (block) {
        const value = forControl.getValue();
        if (isEnhancedForControlClass(value)) {
            const enhancedFor = makeEnhancedFor(value);
            if (enhancedFor) {
                return {
                    type: 'for',
                    condition: enhancedFor,
                    block: block,
                };
            }
        }

        if (isExpressionClass(value)) {
            const init = forControl.getInit();
            if (init) {
                const normalFor = makeNormalFor(init, value, forControl.getUpdate());
                if (normalFor) {
                    return {
                        type: 'for',
                        condition: normalFor,
                        block: block,
                    };
                }
            }
        }
    }

    return undefined;
};
