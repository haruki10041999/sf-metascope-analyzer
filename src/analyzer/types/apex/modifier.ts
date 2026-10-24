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
    mergeRecord,
    isConvertOf,
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
    name: string;
};

export const isModifierJson = typia.createIs<ModifierJson>();

export type AllModifierJson = StructureJsonType<'modifiers'> & {
    sourceKeys: { [key: string]: Record<string, string[]>[] };
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
    const allModifierJson: AllModifierJson = {
        kind: 'modifiers',
        sourceKeys: {},
    };

    target.forEach((t) => {
        const result = makeModifierJson(t);

        if (isErrorJson(result)) {
            if (!allModifierJson.error) {
                allModifierJson.sourceKeys['error'] = [];
                allModifierJson.error = [];
            }

            const { sourceKeys, ...content } = result;

            allModifierJson.error.push(content);
            allModifierJson.sourceKeys['error']!.push(result.sourceKeys);
            return;
        }

        if (isModifierJson(result)) {
            if (isAccessModifier(result.name)) {
                if (!allModifierJson.access) {
                    allModifierJson.sourceKeys['access'] = [];
                    allModifierJson.access = [];
                }

                const { sourceKeys, ...content } = result;

                allModifierJson.access.push(content);
                allModifierJson.sourceKeys['access']!.push(result.sourceKeys);
                return;
            }

            if (isDeclarationModifier(result.name)) {
                if (!allModifierJson.declaration) {
                    allModifierJson.sourceKeys['declaration'] = [];
                    allModifierJson.declaration = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.declaration.push(content);
                allModifierJson.sourceKeys['declaration']!.push(result.sourceKeys);
                return;
            }

            if (isWebServiceModifier(result.name)) {
                if (!allModifierJson.webService) {
                    allModifierJson.sourceKeys['webService'] = [];
                    allModifierJson.webService = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.webService.push(content);
                allModifierJson.sourceKeys['webService']!.push(result.sourceKeys);
                return;
            }

            if (isTestModifier(result.name)) {
                if (!allModifierJson.test) {
                    allModifierJson.sourceKeys['test'] = [];
                    allModifierJson.test = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.test.push(content);
                allModifierJson.sourceKeys['test']!.push(result.sourceKeys);
                return;
            }

            if (isSharingModifier(result.name)) {
                if (!allModifierJson.sharing) {
                    allModifierJson.sourceKeys['sharing'] = [];
                    allModifierJson.sharing = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.sharing.push(content);
                allModifierJson.sourceKeys['sharing']!.push(result.sourceKeys);
                return;
            }

            if (isOtherModifier(result.name)) {
                if (!allModifierJson.other) {
                    allModifierJson.sourceKeys['other'] = [];
                    allModifierJson.other = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.other.push(content);
                allModifierJson.sourceKeys['other']!.push(result.sourceKeys);
                return;
            }
        }

        if (isAnnotationJson(result)) {
            if (isLWCAnnotation(result.name)) {
                if (!allModifierJson.lwcAnnotation) {
                    allModifierJson.sourceKeys['lwcAnnotation'] = [];
                    allModifierJson.lwcAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.lwcAnnotation.push(content);
                allModifierJson.sourceKeys['lwcAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isFlowAnnotation(result.name)) {
                if (!allModifierJson.flowAnnotation) {
                    allModifierJson.sourceKeys['flowAnnotation'] = [];
                    allModifierJson.flowAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.flowAnnotation.push(content);
                allModifierJson.sourceKeys['flowAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isAsyncAnnotation(result.name)) {
                if (!allModifierJson.asyncAnnotation) {
                    allModifierJson.sourceKeys['asyncAnnotation'] = [];
                    allModifierJson.asyncAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.asyncAnnotation.push(content);
                allModifierJson.sourceKeys['asyncAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isTestAnnotation(result.name)) {
                if (!allModifierJson.testAnnotation) {
                    allModifierJson.sourceKeys['testAnnotation'] = [];
                    allModifierJson.testAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.testAnnotation.push(content);
                allModifierJson.sourceKeys['testAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isRestAnnotation(result.name)) {
                if (!allModifierJson.restAnnotation) {
                    allModifierJson.sourceKeys['restAnnotation'] = [];
                    allModifierJson.restAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.restAnnotation.push(content);
                allModifierJson.sourceKeys['restAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isVisualforceAnnotation(result.name)) {
                if (!allModifierJson.visualforceAnnotation) {
                    allModifierJson.sourceKeys['visualforceAnnotation'] = [];
                    allModifierJson.visualforceAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.visualforceAnnotation.push(content);
                allModifierJson.sourceKeys['visualforceAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isAccessAnnotation(result.name)) {
                if (!allModifierJson.accessAnnotation) {
                    allModifierJson.sourceKeys['accessAnnotation'] = [];
                    allModifierJson.accessAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.accessAnnotation.push(content);
                allModifierJson.sourceKeys['accessAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isSerializationAnnotation(result.name)) {
                if (!allModifierJson.serializeAnnotation) {
                    allModifierJson.sourceKeys['serializeAnnotation'] = [];
                    allModifierJson.serializeAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.serializeAnnotation.push(content);
                allModifierJson.sourceKeys['serializeAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isExecutionAnnotation(result.name)) {
                if (!allModifierJson.executionAnnotation) {
                    allModifierJson.sourceKeys['executionAnnotation'] = [];
                    allModifierJson.executionAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.executionAnnotation.push(content);
                allModifierJson.sourceKeys['executionAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (isCompatibilityAnnotation(result.name)) {
                if (!allModifierJson.compatibilityAnnotation) {
                    allModifierJson.sourceKeys['compatibilityAnnotation'] = [];
                    allModifierJson.compatibilityAnnotation = [];
                }
                const { sourceKeys, ...content } = result;
                allModifierJson.compatibilityAnnotation.push(content);
                allModifierJson.sourceKeys['compatibilityAnnotation']!.push(result.sourceKeys);
                return;
            }

            if (!allModifierJson.otherAnnotation) {
                allModifierJson.otherAnnotation = [];
            }
            allModifierJson.otherAnnotation.push(result);
        }
    });

    return allModifierJson;
};
