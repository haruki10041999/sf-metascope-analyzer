import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
    isErrorJson,
} from './commons';

import {
    ModifierType,
    AnnotationType,
    ElementValuePairsType,
    ErrorInfo,
    isAnnotationType,
    isElementValueType,
    isElementValuePairsType,
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

export type AnnotationJson = JsonType & {
    kind: 'modifier';
    type: 'annotation';
    name: string;
    arg?: AnnotationArgJson | AnnotationArgJson[];
};

export const isAnnotationJson = typia.createIs<AnnotationJson>();

export type ModifierJson = JsonType & {
    kind: 'modifier';
    type: 'modifier';
    name: string;
};

export const isModifierJson = typia.createIs<ModifierJson>();

export type AllModifierJson = {
    access?: ModifierJson[];
    declaration?: ModifierJson[];
    webService?: ModifierJson[];
    test?: ModifierJson[];
    sharing?: ModifierJson[];
    other?: ModifierJson[];
    annotation?: {
        lwc?: AnnotationJson[];
        flow?: AnnotationJson[];
        async?: AnnotationJson[];
        test?: AnnotationJson[];
        rest?: AnnotationJson[];
        visualforce?: AnnotationJson[];
        access?: AnnotationJson[];
        serialize?: AnnotationJson[];
        execution?: AnnotationJson[];
        compatibility?: AnnotationJson[];
        other?: AnnotationJson[];
    };
    error?: ErrorJson[];
};

const makeAnnotationJson = (
    target: Convert<AnnotationType>,
    targetObjectKey: string,
    targetSourceKey: string,
): AnnotationJson => {
    const name = castConvert(castExcludeErrorInfo(target.value)).value;

    const annotationJson: AnnotationJson = {
        kind: 'modifier',
        type: 'annotation',
        sourceKeys: {},
        name: name,
    };

    const arg = target.param ? castConvert(castExcludeErrorInfo(target.param)) : null;

    if (arg) {
        if (isConvert(arg, isElementValueType)) {
            const literal = castConvert(castExcludeErrorInfo(arg.value));
            const literalValue = castExcludeErrorInfo(literal.value);
            const literalValueType = literal.valueType;
            annotationJson.arg = {
                value: literalValue,
                valueType: literalValueType,
            };
        } else {
            const annotationArgs: AnnotationArgJson[] = [];
            const pairs = arg as Convert<ElementValuePairsType>;
            const pairList = castConvertArray(castExcludeErrorInfoArray(pairs.value));
            pairList.forEach((pair) => {
                const key = castConvert(castExcludeErrorInfo(pair.left)).value;
                const value = castConvert(
                    castExcludeErrorInfo(castExcludeErrorInfo(pair.right).value),
                );
                const literalValue = castExcludeErrorInfo(value.value);
                const valueType = value.valueType;

                annotationArgs.push({
                    key: key,
                    value: literalValue,
                    valueType: valueType,
                });
            });
            annotationJson.arg = annotationArgs;

            writeSourceKeys(annotationJson, targetObjectKey, targetSourceKey);
            return annotationJson;
        }
    }

    writeSourceKeys(annotationJson, targetObjectKey, targetSourceKey);
    return annotationJson;
};

const makeModifierJson = (
    target: Convert<ModifierType | ErrorInfo>,
    sourceObject: SourceJson[],
): ModifierJson | AnnotationJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);
    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);

    const error: ErrorJson = {
        kind: 'error',
        kindType: 'modifier',
        sourceKeys: {},
    };

    writeSourceKeys(error, targetObjectKey, targetSourceKey);

    if (isError(convertJsons)) {
        return error;
    }

    const _target = target as Convert<ModifierType>;
    const value = castExcludeErrorInfo(_target.value);
    const modifier = typeof value === 'string' ? value : castConvert(value);

    if (typeof modifier === 'string') {
        const modifierJson: ModifierJson = {
            kind: 'modifier',
            type: 'modifier',
            sourceKeys: {},
            name: modifier,
        };

        writeSourceKeys(modifierJson, targetObjectKey, targetSourceKey);
        return modifierJson;
    }

    if (isConvert(modifier, isAnnotationType)) {
        const annotationJson = makeAnnotationJson(modifier, targetObjectKey, targetSourceKey);

        writeSourceKeys(annotationJson, targetObjectKey, targetSourceKey);
        return annotationJson;
    }

    return error;
};

export const makeAllModifierJson = (
    target: Convert<ModifierType | ErrorInfo>[],
    sourceObject: SourceJson[],
): AllModifierJson => {
    const allModifierJson: AllModifierJson = {};

    target.forEach((t) => {
        const modifierJson = makeModifierJson(t, sourceObject);
        if (isErrorJson(modifierJson)) {
            if (!allModifierJson.error) {
                allModifierJson.error = [];
            }
            allModifierJson.error.push(modifierJson);
            return;
        }

        if (isModifierJson(modifierJson)) {
            if (isAccessModifier(modifierJson.name)) {
                if (!allModifierJson.access) {
                    allModifierJson.access = [];
                }
                allModifierJson.access.push(modifierJson);
                return;
            }

            if (isDeclarationModifier(modifierJson.name)) {
                if (!allModifierJson.declaration) {
                    allModifierJson.declaration = [];
                }
                allModifierJson.declaration.push(modifierJson);
                return;
            }

            if (isWebServiceModifier(modifierJson.name)) {
                if (!allModifierJson.webService) {
                    allModifierJson.webService = [];
                }
                allModifierJson.webService.push(modifierJson);
                return;
            }

            if (isTestModifier(modifierJson.name)) {
                if (!allModifierJson.test) {
                    allModifierJson.test = [];
                }
                allModifierJson.test.push(modifierJson);
                return;
            }

            if (isSharingModifier(modifierJson.name)) {
                if (!allModifierJson.sharing) {
                    allModifierJson.sharing = [];
                }
                allModifierJson.sharing.push(modifierJson);
                return;
            }

            if (isOtherModifier(modifierJson.name)) {
                if (!allModifierJson.other) {
                    allModifierJson.other = [];
                }
                allModifierJson.other.push(modifierJson);
                return;
            }
        }

        if (isAnnotationJson(modifierJson)) {
            if (!allModifierJson.annotation) {
                allModifierJson.annotation = {};
            }

            if (isLWCAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.lwc) {
                    allModifierJson.annotation.lwc = [];
                }
                allModifierJson.annotation.lwc.push(modifierJson);
                return;
            }

            if (isAsyncAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.async) {
                    allModifierJson.annotation.async = [];
                }
                allModifierJson.annotation.async.push(modifierJson);
                return;
            }

            if (isTestAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.test) {
                    allModifierJson.annotation.test = [];
                }
                allModifierJson.annotation.test.push(modifierJson);
                return;
            }

            if (isRestAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.rest) {
                    allModifierJson.annotation.rest = [];
                }
                allModifierJson.annotation.rest.push(modifierJson);
                return;
            }

            if (isVisualforceAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.visualforce) {
                    allModifierJson.annotation.visualforce = [];
                }
                allModifierJson.annotation.visualforce.push(modifierJson);
                return;
            }

            if (isAccessAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.access) {
                    allModifierJson.annotation.access = [];
                }
                allModifierJson.annotation.access.push(modifierJson);
                return;
            }

            if (isSerializationAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.serialize) {
                    allModifierJson.annotation.serialize = [];
                }
                allModifierJson.annotation.serialize.push(modifierJson);
                return;
            }

            if (isExecutionAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.execution) {
                    allModifierJson.annotation.execution = [];
                }
                allModifierJson.annotation.execution.push(modifierJson);
                return;
            }

            if (isCompatibilityAnnotation(modifierJson.name)) {
                if (!allModifierJson.annotation.compatibility) {
                    allModifierJson.annotation.compatibility = [];
                }
                allModifierJson.annotation.compatibility.push(modifierJson);
                return;
            }

            if (!allModifierJson.annotation.other) {
                allModifierJson.annotation.other = [];
            }
            allModifierJson.annotation.other.push(modifierJson);
        }
    });

    return allModifierJson;
};
