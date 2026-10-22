import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    GenerateResult,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    collectDelteteKeys,
    mergeRecord,
    isConvert,
} from './commons';

import {
    ModifierType,
    AnnotationType,
    ElementValueType,
    ElementValuePairsType,
    ErrorInfo,
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
        if (isConvert<ElementValueType>(arg)) {
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

const makeModifierJson = (
    target: Convert<ModifierType | ErrorInfo>,
): GenerateResult<ModifierJson | AnnotationJson | ErrorJson> => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };
    const deleteKeys = collectDelteteKeys(target, targetRecords);

    const { value, errorInfos } = convertExcludeError(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'modifier' });

    if (!value && errorInfos.length > 0) {
        return { result: error, deleteKeys: deleteKeys };
    }

    const modifier = value!.value;
    if (typeof modifier === 'string') {
        return {
            result: makeJsonType('modifier', targetRecords, {
                type: 'modifier',
                name: modifier,
            }),
            deleteKeys: deleteKeys,
        };
    }

    if (isConvert<AnnotationType>(target)) {
        return {
            result: makeAnnotationJson(modifier, targetRecords),
            deleteKeys: deleteKeys,
        };
    }

    return {
        result: error,
        deleteKeys: deleteKeys,
    };
};

export const makeAllModifierJson = (
    target: Convert<ModifierType | ErrorInfo>[],
): GenerateResult<AllModifierJson> => {
    const allModifierJson: AllModifierJson = {};
    let allDeleteKeys: Record<string, string[]> = {};

    target.forEach((t) => {
        const { result, deleteKeys } = makeModifierJson(t);
        allDeleteKeys = mergeRecord(allDeleteKeys, deleteKeys);

        if (isErrorJson(result)) {
            if (!allModifierJson.error) {
                allModifierJson.error = [];
            }
            allModifierJson.error.push(result);
            return;
        }

        if (isModifierJson(result)) {
            if (isAccessModifier(result.name)) {
                if (!allModifierJson.access) {
                    allModifierJson.access = [];
                }
                allModifierJson.access.push(result);
                return;
            }

            if (isDeclarationModifier(result.name)) {
                if (!allModifierJson.declaration) {
                    allModifierJson.declaration = [];
                }
                allModifierJson.declaration.push(result);
                return;
            }

            if (isWebServiceModifier(result.name)) {
                if (!allModifierJson.webService) {
                    allModifierJson.webService = [];
                }
                allModifierJson.webService.push(result);
                return;
            }

            if (isTestModifier(result.name)) {
                if (!allModifierJson.test) {
                    allModifierJson.test = [];
                }
                allModifierJson.test.push(result);
                return;
            }

            if (isSharingModifier(result.name)) {
                if (!allModifierJson.sharing) {
                    allModifierJson.sharing = [];
                }
                allModifierJson.sharing.push(result);
                return;
            }

            if (isOtherModifier(result.name)) {
                if (!allModifierJson.other) {
                    allModifierJson.other = [];
                }
                allModifierJson.other.push(result);
                return;
            }
        }

        if (isAnnotationJson(result)) {
            if (!allModifierJson.annotation) {
                allModifierJson.annotation = {};
            }

            if (isLWCAnnotation(result.name)) {
                if (!allModifierJson.annotation.lwc) {
                    allModifierJson.annotation.lwc = [];
                }
                allModifierJson.annotation.lwc.push(result);
                return;
            }

            if (isFlowAnnotation(result.name)) {
                if (!allModifierJson.annotation.flow) {
                    allModifierJson.annotation.flow = [];
                }
                allModifierJson.annotation.flow.push(result);
                return;
            }

            if (isAsyncAnnotation(result.name)) {
                if (!allModifierJson.annotation.async) {
                    allModifierJson.annotation.async = [];
                }
                allModifierJson.annotation.async.push(result);
                return;
            }

            if (isTestAnnotation(result.name)) {
                if (!allModifierJson.annotation.test) {
                    allModifierJson.annotation.test = [];
                }
                allModifierJson.annotation.test.push(result);
                return;
            }

            if (isRestAnnotation(result.name)) {
                if (!allModifierJson.annotation.rest) {
                    allModifierJson.annotation.rest = [];
                }
                allModifierJson.annotation.rest.push(result);
                return;
            }

            if (isVisualforceAnnotation(result.name)) {
                if (!allModifierJson.annotation.visualforce) {
                    allModifierJson.annotation.visualforce = [];
                }
                allModifierJson.annotation.visualforce.push(result);
                return;
            }

            if (isAccessAnnotation(result.name)) {
                if (!allModifierJson.annotation.access) {
                    allModifierJson.annotation.access = [];
                }
                allModifierJson.annotation.access.push(result);
                return;
            }

            if (isSerializationAnnotation(result.name)) {
                if (!allModifierJson.annotation.serialize) {
                    allModifierJson.annotation.serialize = [];
                }
                allModifierJson.annotation.serialize.push(result);
                return;
            }

            if (isExecutionAnnotation(result.name)) {
                if (!allModifierJson.annotation.execution) {
                    allModifierJson.annotation.execution = [];
                }
                allModifierJson.annotation.execution.push(result);
                return;
            }

            if (isCompatibilityAnnotation(result.name)) {
                if (!allModifierJson.annotation.compatibility) {
                    allModifierJson.annotation.compatibility = [];
                }
                allModifierJson.annotation.compatibility.push(result);
                return;
            }

            if (!allModifierJson.annotation.other) {
                allModifierJson.annotation.other = [];
            }
            allModifierJson.annotation.other.push(result);
        }
    });

    return { result: allModifierJson, deleteKeys: allDeleteKeys };
};
