import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    StructureJsonType,
    makeJsonType,
    convertExcludeError,
    registerJson,
    makeStructureJsonType,
} from './commons';

import {
    ModifierType,
    AnnotationType,
    ElementValueType,
    ElementValuePairsType,
    ErrorType,
} from './converter';

const isAccessModifier = (value: string): boolean =>
    ['PUBLIC', 'PRIVATE', 'PROTECTED', 'GLOBAL'].includes(value.toUpperCase());

const isDeclarationModifier = (value: string): boolean =>
    ['STATIC', 'FINAL', 'ABSTRACT', 'VIRTUAL', 'OVERRIDE'].includes(value.toUpperCase());

const isWebServiceModifier = (value: string): boolean =>
    ['WEBSERVICE'].includes(value.toUpperCase());

const isTestModifier = (value: string): boolean => ['TESTMETHOD'].includes(value.toUpperCase());

const isSharingModifier = (value: string): boolean =>
    ['WITH_SHARING', 'WITHOUT_SHARING', 'INHERITED_SHARING'].includes(value.toUpperCase());

const isOtherModifier = (value: string): boolean => ['TRANSIENT'].includes(value.toUpperCase());

const isLWCAnnotation = (value: string): boolean => {
    return ['AURAENABLED'].includes(value.toUpperCase());
};

const isFlowAnnotation = (value: string): boolean => {
    return ['INVOCABLEMETHOD', 'INVOCABLEVARIABLE'].includes(value.toUpperCase());
};

const isAsyncAnnotation = (value: string): boolean => {
    return ['FUTURE'].includes(value.toUpperCase());
};

const isTestAnnotation = (value: string): boolean => {
    return ['ISTEST', 'TESTSETUP', 'TESTVISIBLE'].includes(value.toUpperCase());
};

const isRestAnnotation = (value: string): boolean => {
    return ['RESTRESOURCE', 'HTTPDELETE', 'HTTPGET', 'HTTPPATCH', 'HTTPPOST', 'HTTPPUT'].includes(
        value.toUpperCase(),
    );
};

const isVisualforceAnnotation = (value: string): boolean => {
    return ['REMOTEACTION'].includes(value.toUpperCase());
};

const isAccessAnnotation = (value: string): boolean => {
    return ['NAMESPACEACCESSIBLE'].includes(value.toUpperCase());
};

const isSerializationAnnotation = (value: string): boolean => {
    return ['JSONACCESS'].includes(value.toUpperCase());
};

const isExecutionAnnotation = (value: string): boolean => {
    return ['READONLY'].includes(value.toUpperCase());
};

const isCompatibilityAnnotation = (value: string): boolean => {
    return ['DEPRECATED', 'SUPPRESSWARNINGS'].includes(value.toUpperCase());
};

export type AnnotationArgJson = {
    key?: string;
    value: string;
    valueType: string;
};

export type AnnotationJson = JsonType<'modifier'> & {
    type: 'annotation';
    name: string;
    arg?: AnnotationArgJson | AnnotationArgJson[];
};

export const isAnnotationJson = typia.createIs<AnnotationJson>();

export type ModifierJson = JsonType<'modifier'> & {
    type: 'modifier';
    name:
        | 'GLOBAL'
        | 'PUBLIC'
        | 'PROTECTED'
        | 'PRIVATE'
        | 'TRANSIENT'
        | 'STATIC'
        | 'ABSTRACT'
        | 'FINAL'
        | 'WEBSERVICE'
        | 'OVERRIDE'
        | 'VIRTUAL'
        | 'TESTMETHOD'
        | 'WITH_SHARING'
        | 'WITHOUT_SHARING'
        | 'INHERITED_SHARING';
};

export const isModifierJson = typia.createIs<ModifierJson>();

export type AllModifierJson = StructureJsonType<'modifiers'> & {
    access?: Omit<ModifierJson, 'sourceKeys'>[];
    declaration?: Omit<ModifierJson, 'sourceKeys'>[];
    webService?: Omit<ModifierJson, 'sourceKeys'>[];
    test?: Omit<ModifierJson, 'sourceKeys'>[];
    sharing?: Omit<ModifierJson, 'sourceKeys'>[];
    other?: Omit<ModifierJson, 'sourceKeys'>[];
    lwcAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    flowAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    asyncAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    testAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    restAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    visualforceAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    accessAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    serializeAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    executionAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    compatibilityAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    otherAnnotation?: Omit<AnnotationJson, 'sourceKeys'>[];
    error?: Omit<ErrorJson, 'sourceKeys'>[];
};

const makeAnnotationJson = (
    target: ConvertExcludeError<AnnotationType>,
    records: Record<string, string[]>,
): AnnotationJson => {
    const name = target.value.value;

    const annotationJson: AnnotationJson = makeJsonType('modifier', records, {
        type: 'annotation',
        name: name,
    });

    const arg = target.param ? target.param : null;

    if (arg) {
        if (arg.type === 'elementValue') {
            const literalValue = arg.value.value;
            const literalValueType = arg.value.valueType;
            annotationJson.arg = {
                value: literalValue,
                valueType: literalValueType,
            };
            return annotationJson;
        } else {
            const annotationArgs: AnnotationArgJson[] = [];
            const pairList = arg.value;
            pairList.forEach((pair) => {
                const key = pair.left.value;
                const literalValue = pair.right.value.value;
                const valueType = pair.right.value.valueType;

                annotationArgs.push({
                    key: key,
                    value: literalValue,
                    valueType: valueType,
                });
            });
            annotationJson.arg = annotationArgs;
            return annotationJson;
        }
    }

    return annotationJson;
};

export const makeModifierJson = (
    target: Convert<ModifierType | ErrorType>,
): ModifierJson | AnnotationJson | ErrorJson => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };

    const { value, errorInfos } = convertExcludeError<ModifierType | ErrorType>(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'modifier' });

    if (!value || errorInfos.length > 0) {
        return error;
    }

    const modifier = value!.value;
    if (typeof modifier === 'string') {
        return makeJsonType('modifier', targetRecords, {
            type: 'modifier',
            name: modifier,
        });
    }

    if (modifier.type === 'annotation') {
        return makeAnnotationJson(modifier, targetRecords);
    }

    return error;
};

export const makeAllModifierJson = (
    target: Convert<ModifierType | ErrorType>[],
): AllModifierJson => {
    const properties: Record<string, JsonType<string>[]> = {};
    const add = (attribute: string, value: JsonType<string>) => {
        if (!properties[attribute]) {
            properties[attribute] = [];
        }
        properties[attribute].push(value);
    };

    target.forEach((t) => {
        const result = makeModifierJson(t);

        if (isErrorJson(result)) {
            add('error', result);
            return;
        }

        if (isModifierJson(result)) {
            if (isAccessModifier(result.name)) {
                add('access', result);
                return;
            }

            if (isDeclarationModifier(result.name)) {
                add('declaration', result);
                return;
            }

            if (isWebServiceModifier(result.name)) {
                add('webService', result);
                return;
            }

            if (isTestModifier(result.name)) {
                add('test', result);
                return;
            }

            if (isSharingModifier(result.name)) {
                add('sharing', result);
                return;
            }

            if (isOtherModifier(result.name)) {
                add('other', result);
            }
        }

        if (isAnnotationJson(result)) {
            if (isLWCAnnotation(result.name)) {
                add('lwcAnnotation', result);
                return;
            }

            if (isFlowAnnotation(result.name)) {
                add('flowAnnotation', result);
                return;
            }

            if (isAsyncAnnotation(result.name)) {
                add('asyncAnnotation', result);
                return;
            }

            if (isTestAnnotation(result.name)) {
                add('testAnnotation', result);
                return;
            }

            if (isRestAnnotation(result.name)) {
                add('restAnnotation', result);
                return;
            }

            if (isVisualforceAnnotation(result.name)) {
                add('visualforceAnnotation', result);
                return;
            }

            if (isAccessAnnotation(result.name)) {
                add('accessAnnotation', result);
                return;
            }

            if (isSerializationAnnotation(result.name)) {
                add('serializeAnnotation', result);
                return;
            }

            if (isExecutionAnnotation(result.name)) {
                add('executionAnnotation', result);
                return;
            }

            if (isCompatibilityAnnotation(result.name)) {
                add('compatibilityAnnotation', result);
                return;
            }

            add('otherAnnotation', result);
        }
    });

    const allModifierJson: AllModifierJson = makeStructureJsonType('modifiers', properties);

    return allModifierJson;
};
