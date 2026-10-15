import {
    SwitchStatementClass,
    WhenControlClass,
    WhenValueClass,
    isString,
    isWhenLiteralClassArray,
    isStringArray,
} from '../converter';

import { BlockField, makeBlockField } from './block';
import { ExpressionType, makeExpressionType } from '../expression';
import { TypeType, makeTypeType } from '../type';

type WhenValue =
    | {
          value: string | 'else';
          valueType?: TypeType;
      }
    | { value: string | string[]; valueType: string; operator?: string }[];

type WhenBlock = {
    conditionValue: WhenValue;
} & BlockField;

export type SwitchField = {
    kind: 'switch';
    variant: ExpressionType;
    block: WhenBlock[];
};

const makeWhenValue = (whenValue: WhenValueClass): WhenValue | undefined => {
    const value = whenValue.getValue();

    if (value) {
        if (isString(value)) {
            if (value.toLowerCase() === 'else') {
                return {
                    value: 'else',
                };
            } else {
                const field: WhenValue = {
                    value: value.replace(/^(['"])(.*)\1$/, '$2'),
                };

                const valueType = makeTypeType(whenValue.getValueType());
                if (valueType) {
                    field.valueType = valueType;
                }

                return field;
            }
        }

        if (isWhenLiteralClassArray(value)) {
            const literals: { value: string | string[]; valueType: string; operator?: string }[] =
                [];
            value.forEach((l) => {
                const value = l.getValue();
                const valueType = l.getValueType();
                const operator = l.getOperator();

                if (((isStringArray(value) && value.length > 0) || isString(value)) && valueType) {
                    const literal: {
                        value: string | string[];
                        valueType: string;
                        operator?: string;
                    } = {
                        value: isString(value) ? value.replace(/^(['"])(.*)\1$/, '$2') : value,
                        valueType: valueType,
                    };

                    if (operator) {
                        literal.operator = operator;
                    }

                    literals.push(literal);
                }
            });
            if (literals.length > 0) {
                return literals;
            }
        }
    }
    return undefined;
};

const makeWhenBlock = (whenControl: WhenControlClass[]): WhenBlock[] | undefined => {
    const whenBlock: WhenBlock[] = [];
    whenControl.forEach((c) => {
        const whenValue = makeWhenValue(c.getValue());
        const block = makeBlockField(c.getBlock());

        if (whenValue && block) {
            whenBlock.push({
                conditionValue: whenValue,
                ...block,
            });
        }
    });

    if (whenBlock.length > 0) {
        return whenBlock;
    }

    return undefined;
};

export const makeSwitchField = (switchStatement: SwitchStatementClass): SwitchField | undefined => {
    const value = makeExpressionType(switchStatement.getValue());
    const block = makeWhenBlock(switchStatement.getBlock());

    if (value && block) {
        return {
            kind: 'switch',
            variant: value,
            block: block,
        };
    }

    return undefined;
};

