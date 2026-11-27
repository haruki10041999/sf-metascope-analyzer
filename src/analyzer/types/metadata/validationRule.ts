import { type SchemaChildJson, schemaChildJsonOf } from '../commons/xmlJson';

export const VALIDATION_RULE_SCHEMA = {
    active: 'boolean',
    description: 'string',
    errorConditionFormula: 'formula',
    errorDisplayField: 'string',
    errorMessage: 'string',
} as const;

/** 入力規則 (validationRules/*.validationRule-meta.xml) */
export type ValidationRuleJson = SchemaChildJson<'validationRule', typeof VALIDATION_RULE_SCHEMA>;

export const makeValidationRuleJson = schemaChildJsonOf('validationRule', VALIDATION_RULE_SCHEMA);
