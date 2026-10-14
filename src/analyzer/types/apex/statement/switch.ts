import {
    SwitchStatementClass,
    WhenControlClass,
    WhenValueClass,
    isString,
    isWhenLiteralClassArray,
    isStringArray,
} from '../converter';

import { BlockField, makeBlockField } from './statement';
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
    block: BlockField;
};

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
                const valueType = makeTypeType(whenValue.getValueType());
                if (valueType) {
                    return {
                        value: value,
                        valueType: valueType,
                    };
                }
            }
        }

        if (isWhenLiteralClassArray(value)) {
            const literals: { value: string | string[]; valueType: string; operator?: string }[] =
                [];
            value.forEach((literal) => {
                const value = literal.getValue();
                const valueType = literal.getValueType();
                const operator = literal.getOperator();

                if (
                    ((isStringArray(value) && value.length > 0) || isString(value)) &&
                    valueType &&
                    operator
                ) {
                    literals.push({
                        value: value,
                        valueType: valueType,
                        operator: operator,
                    });
                }

                if (literals.length > 0) {
                    return literals;
                }
            });
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
                block: block,
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
