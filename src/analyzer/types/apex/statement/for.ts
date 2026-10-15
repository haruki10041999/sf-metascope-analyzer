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
import { BlockField } from './block';
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
    init?: NormalForInit;
    condition?: ExpressionType;
    update?: ExpressionType[];
};

export type ForField = {
    kind: 'for';
    condition: EnhancedFor | NormalFor;
} & (BlockField | { block: StatementType });

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
    init: LocalVariableDeclarationClass | ExpressionClass[] | null,
    condition: ExpressionClass | null,
    update: ExpressionClass[],
): NormalFor | undefined => {
    const normalFor: NormalFor = {};

    if (condition) {
        const cond = makeExpressionType(condition);
        if (!cond) return undefined;
        normalFor.condition = cond;
    }

    const updates = update.map((u) => makeExpressionType(u)).filter((u) => u !== undefined);
    if (updates.length > 0) {
        normalFor.update = updates;
    }

    if (init) {
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

                normalFor.init = inits;
            } else {
                return undefined;
            }
        } else if (isExpressionClassArray(init)) {
            const inits = init.map((i) => makeExpressionType(i)).filter((i) => i !== undefined);
            normalFor.init = inits;
        } else {
            return undefined;
        }
    }

    return normalFor;
};

export const makeForField = (forStatement: ForStatementClass): ForField | undefined => {
    const forControl = forStatement.getValue();
    const block = makeStatementType(forStatement.getBlock());

    let blockField: BlockField | { block: StatementType } | undefined = undefined;
    if (block) {
        if ('kind' in block) {
            blockField = { block: block };
        } else {
            blockField = block;
        }
    }

    if (blockField) {
        const value = forControl.getValue();
        if (isEnhancedForControlClass(value)) {
            const enhancedFor = makeEnhancedFor(value);
            if (enhancedFor) {
                return {
                    kind: 'for',
                    condition: enhancedFor,
                    ...blockField,
                };
            }
        }

        if (isExpressionClass(value) || value === null) {
            const init = forControl.getInit();
            const normalFor = makeNormalFor(init, value, forControl.getUpdate());
            if (normalFor) {
                return {
                    kind: 'for',
                    condition: normalFor,
                    ...blockField,
                };
            }
        }
    }

    return undefined;
};

