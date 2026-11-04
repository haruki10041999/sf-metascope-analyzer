import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    readProperties,
    readText,
} from '../commons/xmlJson';
import { XmlElement } from '../commons/xml';

export const VALIDATION_RULE_SCHEMA = {
    active: 'boolean',
    description: 'string',
    errorConditionFormula: 'string',
    errorDisplayField: 'string',
    errorMessage: 'string',
} as const;

/** 入力規則 (validationRules/*.validationRule-meta.xml) */
export type ValidationRuleJson = JsonType<'validationRule'> & {
    fullName: string;
} & PropertiesOf<typeof VALIDATION_RULE_SCHEMA>;

export const makeValidationRuleJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): ValidationRuleJson =>
    makeXmlJson<ValidationRuleJson>(
        'validationRule',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, VALIDATION_RULE_SCHEMA),
        },
        element,
        file,
        registry,
    );
