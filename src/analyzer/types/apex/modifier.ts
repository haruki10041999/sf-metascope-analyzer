import typia from 'typia';

import {
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertExcludeError,
    ConvertType,
    StructureJsonType,
    makeStructureJsonType,
    registerJson,
} from './commons';

import { ModifierType, AnnotationType } from './converter';

export type AnnotationArgJson = {
    key?: string;
    value: string;
    valueType: string;
};

export type AnnotationJson = JsonType<'annotation'> & {
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

export type ModifiersJson = StructureJsonType<
    'modifiers',
    {
        access?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        declaration?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        webService?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        test?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        sharing?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        other?: Omit<ModifierJson, 'kind' | 'sourceKeys'>[];
        lwcAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        flowAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        asyncAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        testAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        restAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        visualforceAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        accessAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        serializeAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        executionAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        compatibilityAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        otherAnnotation?: Omit<AnnotationJson, 'kind' | 'sourceKeys'>[];
        error?: Omit<ErrorJson, 'kind' | 'sourceKeys'>[];
    }
>;

export const isModifiersJson = typia.createIs<ModifiersJson>();

const isAccessModifier = (value: string): boolean =>
    ['PUBLIC', 'PRIVATE', 'PROTECTED', 'GLOBAL'].includes(value.toUpperCase());

const isDeclarationModifier = (value: string): boolean =>
    ['STATIC', 'FINAL', 'ABSTRACT', 'VIRTUAL', 'OVERRIDE'].includes(value.toUpperCase());

const isWebServiceModifier = (value: string): boolean => value.toUpperCase() === 'WEBSERVICE';

const isTestModifier = (value: string): boolean => value.toUpperCase() === 'TESTMETHOD';

const isSharingModifier = (value: string): boolean =>
    ['WITH_SHARING', 'WITHOUT_SHARING', 'INHERITED_SHARING'].includes(value.toUpperCase());

const isOtherModifier = (value: string): boolean => value.toUpperCase() === 'TRANSIENT';

const isLWCAnnotation = (value: string): boolean => value.toUpperCase() === 'AURAENABLED';

const isFlowAnnotation = (value: string): boolean =>
    ['INVOCABLEMETHOD', 'INVOCABLEVARIABLE'].includes(value.toUpperCase());

const isAsyncAnnotation = (value: string): boolean => value.toUpperCase() === 'FUTURE';

const isTestAnnotation = (value: string): boolean =>
    ['ISTEST', 'TESTSETUP', 'TESTVISIBLE'].includes(value.toUpperCase());

const isRestAnnotation = (value: string): boolean =>
    ['RESTRESOURCE', 'HTTPDELETE', 'HTTPGET', 'HTTPPATCH', 'HTTPPOST', 'HTTPPUT'].includes(
        value.toUpperCase(),
    );

const isVisualforceAnnotation = (value: string): boolean => value.toUpperCase() === 'REMOTEACTION';

const isAccessAnnotation = (value: string): boolean =>
    value.toUpperCase() === 'NAMESPACEACCESSIBLE';

const isSerializationAnnotation = (value: string): boolean => value.toUpperCase() === 'JSONACCESS';

const isExecutionAnnotation = (value: string): boolean => value.toUpperCase() === 'READONLY';

const isCompatibilityAnnotation = (value: string): boolean =>
    ['DEPRECATED', 'SUPPRESSWARNINGS'].includes(value.toUpperCase());

const makeAnnotationJson = (
    target: ConvertType<AnnotationType>,
    targetRecords?: Record<string, string[]>,
): AnnotationJson | ErrorJson => {
    return convertValue<'annotation', 'annotation', AnnotationType, AnnotationJson>(
        ['annotation'],
        target,
        ['annotation'],
        'annotation',
        (target, targetRecords, _) => {
            const name = target.value.value;
            const annotationJson: AnnotationJson = makeJsonType('annotation', targetRecords, {
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
        },
        targetRecords,
    );
};

export const makeModifierJson = (
    target: ConvertType<ModifierType>,
    targetRecords?: Record<string, string[]>,
): ModifierJson | AnnotationJson | ErrorJson => {
    return convertValue<
        'modifier' | 'annotation',
        'modifier' | 'annotation',
        ModifierType,
        ModifierJson | AnnotationJson
    >(
        ['modifier', 'annotation'],
        target,
        ['modifier', 'annotation'],
        'modifier',
        (target, targetRecords, errorJson) => {
            const modifier = target!.value;
            if (typeof modifier === 'string') {
                return makeJsonType('modifier', targetRecords, {
                    type: 'modifier',
                    name: modifier,
                });
            }

            if (modifier.type === 'annotation') {
                return makeAnnotationJson(modifier, targetRecords);
            }

            return errorJson;
        },
        targetRecords,
    );
};

export const makeModifiersJson = (targets: ConvertType<ModifierType>[]): ModifiersJson => {
    const modifiers: Record<string, ModifierJson[]> = {};
    const annotations: Record<string, AnnotationJson[]> = {};
    const errors: ErrorJson[] = [];
    const addModifier = (attribute: string, value: ModifierJson) => {
        (modifiers[attribute] ??= []).push(value);
    };
    const addAnnotation = (attribute: string, value: AnnotationJson) => {
        (annotations[attribute] ??= []).push(value);
    };

    targets.forEach((target) => {
        const result = makeModifierJson(target);

        if (isErrorJson(result)) {
            errors.push(result);
            return;
        }

        if (isModifierJson(result)) {
            if (isAccessModifier(result.name)) {
                addModifier('access', result);
            } else if (isDeclarationModifier(result.name)) {
                addModifier('declaration', result);
            } else if (isWebServiceModifier(result.name)) {
                addModifier('webService', result);
            } else if (isTestModifier(result.name)) {
                addModifier('test', result);
            } else if (isSharingModifier(result.name)) {
                addModifier('sharing', result);
            } else if (isOtherModifier(result.name)) {
                addModifier('other', result);
            }
            return;
        }

        if (isLWCAnnotation(result.name)) {
            addAnnotation('lwcAnnotation', result);
        } else if (isFlowAnnotation(result.name)) {
            addAnnotation('flowAnnotation', result);
        } else if (isAsyncAnnotation(result.name)) {
            addAnnotation('asyncAnnotation', result);
        } else if (isTestAnnotation(result.name)) {
            addAnnotation('testAnnotation', result);
        } else if (isRestAnnotation(result.name)) {
            addAnnotation('restAnnotation', result);
        } else if (isVisualforceAnnotation(result.name)) {
            addAnnotation('visualforceAnnotation', result);
        } else if (isAccessAnnotation(result.name)) {
            addAnnotation('accessAnnotation', result);
        } else if (isSerializationAnnotation(result.name)) {
            addAnnotation('serializeAnnotation', result);
        } else if (isExecutionAnnotation(result.name)) {
            addAnnotation('executionAnnotation', result);
        } else if (isCompatibilityAnnotation(result.name)) {
            addAnnotation('compatibilityAnnotation', result);
        } else {
            addAnnotation('otherAnnotation', result);
        }
    });

    const properties: Record<string, ModifierJson[] | AnnotationJson[] | ErrorJson[]> = {
        ...modifiers,
        ...annotations,
        ...(errors.length > 0 ? { error: errors } : {}),
    };
    return makeStructureJsonType('modifiers', properties);
};
