import { VALIDATION_RULE_SCHEMA, ValidationRuleJson } from '../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { PropertiesDiff, makePropertiesDiff } from '../../commons/diff/present';

export type ValidationRuleJsonDiff = NodeDiff<
    'validationRule',
    ValidationRuleJson,
    { fullName: ValueDiff<string> } & PropertiesDiff<typeof VALIDATION_RULE_SCHEMA>
>;

export const makeValidationRuleDiff = (
    before: ValidationRuleJson,
    after: ValidationRuleJson,
    match: Match = 'slot',
): ValidationRuleJsonDiff =>
    makeNodeDiff('validationRule', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(VALIDATION_RULE_SCHEMA, b, a),
    }));
