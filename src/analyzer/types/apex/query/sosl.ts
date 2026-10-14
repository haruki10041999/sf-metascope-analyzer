import { SoslLiteralClass, SoslLiteralAltClass, isString, isExpressionClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { FieldSpecField, makeFieldSpecField } from './fieldSpec';
import { SoslWithField, makeSoslWithField } from './with';
import { LimitField, makeLimitField } from './limit';

export type KeyWordField =
    | {
          kind: 'string';
          value: string;
      }
    | {
          kind: 'bind';
          value: ExpressionType;
      };

export type SoslType = {
    keyword: KeyWordField;
    searchGroup?: string;
    fieldSpec?: FieldSpecField[];
    with?: SoslWithField[];
    limit?: LimitField;
    update?: string[];
};

export const makeSoslType = (
    soslLiteral: SoslLiteralClass | SoslLiteralAltClass,
): SoslType | undefined => {
    const value = soslLiteral.getValue();
    const soslClauses = soslLiteral.getSoslClauses();
    const searchGroup = soslClauses.getValue();
    const fieldSpecList = soslClauses.getFieldSpecList();
    const withList = soslClauses.getWithList();
    const limitClause = soslClauses.getLimitClause();
    const update = soslClauses.getUpdateList();

    if (value) {
        let keyWord: KeyWordField | undefined = undefined;
        if (isString(value)) {
            const word = value.match(/(['"])(.*?)\1/);
            if (word) {
                keyWord = {
                    kind: 'string',
                    value: word.at(2)!,
                };
            }
        }

        if (isExpressionClass(value)) {
            const expression = makeExpressionType(value);
            if (expression) {
                keyWord = {
                    kind: 'bind',
                    value: expression,
                };
            }
        }

        if (keyWord) {
            const soslField: SoslType = {
                keyword: keyWord,
            };

            if (searchGroup) {
                soslField.searchGroup = searchGroup;
            }

            const fieldSpecField = makeFieldSpecField(fieldSpecList);
            if (fieldSpecField) {
                soslField.fieldSpec = fieldSpecField;
            }

            const withField = makeSoslWithField(withList);
            if (withField) {
                soslField.with = withField;
            }

            if (limitClause) {
                const limitField = makeLimitField(limitClause);
                if (limitField) {
                    soslField.limit = limitField;
                }
            }

            if (update.length > 0) {
                soslField.update = update;
            }

            return soslField;
        }
    }

    return undefined;
};
