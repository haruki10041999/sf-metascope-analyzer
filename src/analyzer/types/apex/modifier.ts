import typia from 'typia';

import {
    ErrorInfo,
    SourceInfoMap,
    assignMultiClass,
    isErrorInfo,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeErrorInfo,
    makeSourceInfo,
    makeEmptySourceInfoMap,
    makeSingleSourceInfoMap,
    makeArraySourceInfoMap,
} from './converter/commons';

import {
    NormalModifierTypeClass,
    AnnotationTypeClass,
    NormalLiteralTypeClass,
    ElementValuePairTypeClass,
    isAnnotationType,
    isNormalIdType,
    NormalIdTypeClass,
    isErrorType,
    ErrorTypeClass,
    isElementValuePairType,
    isElementValueType,
    ElementValueTypeClass,
    isNormalLiteralType,
    ElementValuePairsTypeClass,
    isElementValuePairsType,
} from '../apex_IR';

type AccessModifier = 'PUBLIC' | 'PRIVATE' | 'PROTECTED' | 'GLOBAL';
type DeclarationModifier = 'STATIC' | 'FINAL' | 'ABSTRACT' | 'VIRTUAL' | 'OVERRIDE';
type WebServiceModifier = 'WEBSERVICE';
type TestModifier = 'TESTMETHOD';
type SharingModifier = 'WITH_SHARING' | 'WITHOUT_SHARING' | 'INHERITED_SHARING';
type OtherModifier = 'TRANSIENT';

const isAccessModifier = (value: string): value is AccessModifier =>
    value === 'PUBLIC' || value === 'PRIVATE' || value === 'PROTECTED' || value === 'GLOBAL';

const isDeclarationModifier = (value: string): value is DeclarationModifier =>
    value === 'STATIC' ||
    value === 'FINAL' ||
    value === 'ABSTRACT' ||
    value === 'VIRTUAL' ||
    value === 'OVERRIDE';

const isWebServiceModifier = (value: string): value is WebServiceModifier => value === 'WEBSERVICE';

const isTestModifier = (value: string): value is TestModifier => value === 'TESTMETHOD';

const isSharingModifier = (value: string): value is SharingModifier =>
    value === 'WITH_SHARING' || value === 'WITHOUT_SHARING' || value === 'INHERITED_SHARING';

const isOtherModifier = (value: string): value is OtherModifier => value === 'TRANSIENT';

type LWCAnnotation = 'AURAENABLED';

const isLWCAnnotation = (value: string): value is LWCAnnotation => {
    return ['AURAENABLED'].includes(value.toUpperCase());
};

type FlowAnnotation = 'INVOCABLEMETHOD' | 'INVOCABLEVARIABLE';

const isFlowAnnotation = (value: string): value is FlowAnnotation => {
    return ['INVOCABLEMETHOD', 'INVOCABLEVARIABLE'].includes(value.toUpperCase());
};

type AsyncAnnotation = 'FUTURE';

const isAsyncAnnotation = (value: string): value is AsyncAnnotation => {
    return ['FUTURE'].includes(value.toUpperCase());
};

type TestAnnotation = 'ISTEST' | 'TESTSETUP' | 'TESTVISIBLE';

const isTestAnnotation = (value: string): value is TestAnnotation => {
    return ['ISTEST', 'TESTSETUP', 'TESTVISIBLE'].includes(value.toUpperCase());
};

type RestAnnotation =
    'RESTRESOURCE' | 'HTTPDELETE' | 'HTTPGET' | 'HTTPPATCH' | 'HTTPPOST' | 'HTTPPUT';

const isRestAnnotation = (value: string): value is RestAnnotation => {
    return ['RESTRESOURCE', 'HTTPDELETE', 'HTTPGET', 'HTTPPATCH', 'HTTPPOST', 'HTTPPUT'].includes(
        value.toUpperCase(),
    );
};

type VisualforceAnnotation = 'REMOTEACTION';

const isVisualforceAnnotation = (value: string): value is VisualforceAnnotation => {
    return ['REMOTEACTION'].includes(value.toUpperCase());
};

type AccessAnnotation = 'NAMESPACEACCESSIBLE';

const isAccessAnnotation = (value: string): value is AccessAnnotation => {
    return ['NAMESPACEACCESSIBLE'].includes(value.toUpperCase());
};

type SerializationAnnotation = 'JSONACCESS';

const isSerializationAnnotation = (value: string): value is SerializationAnnotation => {
    return ['JSONACCESS'].includes(value.toUpperCase());
};

type ExecutionAnnotation = 'READONLY';

const isExecutionAnnotation = (value: string): value is ExecutionAnnotation => {
    return ['READONLY'].includes(value.toUpperCase());
};

type CompatibilityAnnotation = 'DEPRECATED' | 'SUPPRESSWARNINGS';

const isCompatibilityAnnotation = (value: string): value is CompatibilityAnnotation => {
    return ['DEPRECATED', 'SUPPRESSWARNINGS'].includes(value.toUpperCase());
};

type AnnotationParam = {
    key?: string;
    value: string;
    valueType: string;
};

const isAnnotationParam = typia.createIs<AnnotationParam>();

type LWCAnnotationType = {
    name: LWCAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isLWCAnnotationType = typia.createIs<LWCAnnotationType>();

type FlowAnnotationType = {
    name: FlowAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isFlowAnnotationType = typia.createIs<FlowAnnotationType>();

type AsyncAnnotationType = {
    name: AsyncAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isAsyncAnnotationType = typia.createIs<AsyncAnnotationType>();

type TestAnnotationType = {
    name: TestAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isTestAnnotationType = typia.createIs<TestAnnotationType>();

type RestAnnotationType = {
    name: RestAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isRestAnnotationType = typia.createIs<RestAnnotationType>();

type VisualforceAnnotationType = {
    name: VisualforceAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isVisualforceAnnotationType = typia.createIs<VisualforceAnnotationType>();

type AccessAnnotationType = {
    name: AccessAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isAccessAnnotationType = typia.createIs<AccessAnnotationType>();

type SerializationAnnotationType = {
    name: SerializationAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isSerializationAnnotationType = typia.createIs<SerializationAnnotationType>();

type ExecutionAnnotationType = {
    name: ExecutionAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isExecutionAnnotationType = typia.createIs<ExecutionAnnotationType>();

type CompatibilityAnnotationType = {
    name: CompatibilityAnnotation;
    param?: AnnotationParam | AnnotationParam[];
};
const isCompatibilityAnnotationType = typia.createIs<CompatibilityAnnotationType>();

type OtherAnnotationType = {
    name: string;
    param?: AnnotationParam | AnnotationParam[];
};
const isOtherAnnotationType = typia.createIs<OtherAnnotationType>();

export type ModifierType = {
    access?: AccessModifier[];
    declaration?: DeclarationModifier[];
    webService?: WebServiceModifier[];
    test?: TestModifier[];
    sharing?: SharingModifier[];
    other?: OtherModifier[];
    annotation?: {
        lwc?: LWCAnnotationType[];
        flow?: FlowAnnotationType[];
        async?: AsyncAnnotationType[];
        test?: TestAnnotationType[];
        rest?: RestAnnotationType[];
        visualforce?: VisualforceAnnotationType[];
        access?: AccessAnnotationType[];
        serialize?: SerializationAnnotationType[];
        execution?: ExecutionAnnotationType[];
        compatibility?: CompatibilityAnnotationType[];
        other?: OtherAnnotationType[];
    };
};

export const isModifierType = typia.createIs<ModifierType>();

type ElementValueResult = {
    value: string | null | void;
    valueType: string;
} | null | void;

type ElementValuePairResult = {
    key: string | null | void;
    value: ElementValueResult | null;
};

type AnnotationResult = {
    name: string | null | void;
    annotationParam: AnnotationParam | AnnotationParam[] | null;
};

export const makeElementValueType = (
    elementValueClass: ElementValueTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): ElementValueResult => {
    const elementValueType = elementValueClass.getType();
    const elementValueSourceInfoMap = makeEmptySourceInfoMap();

    const elementValue = assignMultiClass(elementValueClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
            construct: (typeClass: NormalLiteralTypeClass) => {
                const value = typeClass.getValue();
                const valueType = typeClass.getValueType();
                elementValueSourceInfoMap[typeClass.getType()] = makeSingleSourceInfoMap(typeClass);
                return {
                    value: assignMultiClass(value, [
                        {
                            isValid: (target: unknown) => typeof target === 'string',
                            construct: (typeClass: string) => {
                                return typeClass;
                            },
                        },
                        makeErrorAssignRule(errorInfo),
                    ]),
                    valueType: valueType,
                };
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    sourceInfo[elementValueType] = elementValueSourceInfoMap;

    return elementValue;
};

const makeElementValuePairType = (
    elementValuePairTypeClass: ElementValuePairTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): ElementValuePairResult => {
    const elementValuePairType = elementValuePairTypeClass.getType();
    const elementValuePairSourceInfoMap = makeEmptySourceInfoMap();
    const key = elementValuePairTypeClass.getLeft();
    const value = elementValuePairTypeClass.getRight();

    const elementValuePair = {
        key: assignMultiClass(key, [
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
                construct: (typeClass: NormalIdTypeClass) => {
                    elementValuePairSourceInfoMap[typeClass.getType()] =
                        makeSingleSourceInfoMap(typeClass);
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
        value: assignMultiClass(value, [
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isElementValueType),
                construct: (typeClass: ElementValueTypeClass) => {
                    return makeElementValueType(
                        typeClass,
                        elementValuePairSourceInfoMap,
                        errorInfo,
                    );
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
    };

    sourceInfo[elementValuePairType] = elementValuePairSourceInfoMap;
    return elementValuePair;
};

const makeElementValuePairsType = (
    elementValuePairsTypeClass: ElementValuePairsTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): ElementValuePairResult[] => {
    const elementValuePairsType = elementValuePairsTypeClass.getType();
    const elementValuePairsSourceInfoMap = makeEmptySourceInfoMap();

    const elementValuePairs = elementValuePairsTypeClass
        .getValue()
        .map((value) => {
            return assignMultiClass(value, [
                {
                    isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairType),
                    construct: (typeClass: ElementValuePairTypeClass) => {
                        return makeElementValuePairType(
                            typeClass,
                            elementValuePairsSourceInfoMap,
                            errorInfo,
                        );
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        })
        .filter((value) => value != null);

    sourceInfo[elementValuePairsType] = elementValuePairsSourceInfoMap;
    return elementValuePairs;
};

const makeAnnotationType = (
    annotationTypeClass: AnnotationTypeClass,
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AnnotationResult => {
    const annotationType = annotationTypeClass.getType();
    const annotationSourceInfoMap = makeEmptySourceInfoMap();

    const name = assignMultiClass(annotationTypeClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
            construct: (typeClass: NormalIdTypeClass) => {
                annotationSourceInfoMap[typeClass.getType()] = makeSingleSourceInfoMap(typeClass);
                return typeClass.getValue();
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    const param = assignMultiClass(annotationTypeClass.getParam(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isElementValueType),
            construct: (typeClass: ElementValueTypeClass) => {
                return makeElementValueType(typeClass, annotationSourceInfoMap, errorInfo);
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsType),
            construct: (typeClass: ElementValuePairsTypeClass) => {
                return makeElementValuePairsType(typeClass, annotationSourceInfoMap, errorInfo);
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    let annotationParam: AnnotationParam | AnnotationParam[] | null = null;
    if (param != null) {
        if (Array.isArray(param)) {
            const annotationParams: AnnotationParam[] = [];
            param.forEach((p) => {
                const key = p.key;
                const value = p.value?.value;
                const valueType = p.value?.valueType;

                if (key != null && value != null && valueType != null) {
                    annotationParams.push({
                        key: key,
                        value: value,
                        valueType: valueType,
                    });
                }
            });
            annotationParam = annotationParams;
        } else {
            const value = param.value;
            const valueType = param.valueType;
            if (value != null) {
                annotationParam = {
                    value: value,
                    valueType: valueType,
                };
            }
        }
    }

    sourceInfo[annotationType] = annotationSourceInfoMap;

    return {
        name,
        annotationParam,
    };
};

export const makeModifierType = (
    modifiers: NormalModifierTypeClass[],
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): ModifierType | undefined => {
    const modifierType: ModifierType = {};

    modifiers.forEach((modifier, index) => {
        const modifierElement = assignMultiClass(modifier.getValue(), [
            {
                isValid: (target: unknown): target is AccessModifier =>
                    typeof target === 'string' && isAccessModifier(target.toUpperCase()),
                construct: (typeClass: AccessModifier) => {
                    if (!modifierType.access) {
                        modifierType.access = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.access.push(typeClass);
                },
            },
            {
                isValid: (target: unknown): target is DeclarationModifier =>
                    typeof target === 'string' && isDeclarationModifier(target.toUpperCase()),
                construct: (typeClass: DeclarationModifier) => {
                    if (!modifierType.declaration) {
                        modifierType.declaration = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.declaration.push(typeClass);
                },
            },
            {
                isValid: (target: unknown): target is WebServiceModifier =>
                    typeof target === 'string' && isWebServiceModifier(target.toUpperCase()),
                construct: (typeClass: WebServiceModifier) => {
                    if (!modifierType.webService) {
                        modifierType.webService = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.webService.push(typeClass);
                },
            },
            {
                isValid: (target: unknown): target is TestModifier =>
                    typeof target === 'string' && isTestModifier(target.toUpperCase()),
                construct: (typeClass: TestModifier) => {
                    if (!modifierType.test) {
                        modifierType.test = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.test.push(typeClass);
                },
            },

            {
                isValid: (target: unknown): target is SharingModifier =>
                    typeof target === 'string' && isSharingModifier(target.toUpperCase()),
                construct: (typeClass: SharingModifier) => {
                    if (!modifierType.sharing) {
                        modifierType.sharing = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.sharing.push(typeClass);
                },
            },

            {
                isValid: (target: unknown): target is OtherModifier =>
                    typeof target === 'string' && isOtherModifier(target.toUpperCase()),
                construct: (typeClass: OtherModifier) => {
                    if (!modifierType.other) {
                        modifierType.other = [];
                    }
                    sourceInfo[`${modifier.getType()}_${index}`] =
                        makeSingleSourceInfoMap(modifier);
                    modifierType.other.push(typeClass);
                },
            },
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isAnnotationType),
                construct: (typeClass: AnnotationTypeClass) => {
                    if (!modifierType.annotation) {
                        modifierType.annotation = {};
                    }
                    const annotationSourceInfo = makeEmptySourceInfoMap();
                    const { name, annotationParam } = makeAnnotationType(
                        typeClass,
                        annotationSourceInfo,
                        errorInfo,
                    );
                    sourceInfo[`${modifier.getType()}_${index}`] = annotationSourceInfo;

                    if (typeof name === 'string' && isLWCAnnotation(name)) {
                        if (!modifierType.annotation.lwc) {
                            modifierType.annotation.lwc = [];
                        }

                        const annotation: LWCAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.lwc.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isFlowAnnotation(name)) {
                        if (!modifierType.annotation.flow) {
                            modifierType.annotation.flow = [];
                        }

                        const annotation: FlowAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.flow.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isAsyncAnnotation(name)) {
                        if (!modifierType.annotation.async) {
                            modifierType.annotation.async = [];
                        }

                        const annotation: AsyncAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.async.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isTestAnnotation(name)) {
                        if (!modifierType.annotation.test) {
                            modifierType.annotation.test = [];
                        }

                        const annotation: TestAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.test.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isRestAnnotation(name)) {
                        if (!modifierType.annotation.rest) {
                            modifierType.annotation.rest = [];
                        }

                        const annotation: RestAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.rest.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isVisualforceAnnotation(name)) {
                        if (!modifierType.annotation.visualforce) {
                            modifierType.annotation.visualforce = [];
                        }

                        const annotation: VisualforceAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.visualforce.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isAccessAnnotation(name)) {
                        if (!modifierType.annotation.access) {
                            modifierType.annotation.access = [];
                        }

                        const annotation: AccessAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.access.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isAccessAnnotation(name)) {
                        if (!modifierType.annotation.access) {
                            modifierType.annotation.access = [];
                        }

                        const annotation: AccessAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.access.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isSerializationAnnotation(name)) {
                        if (!modifierType.annotation.serialize) {
                            modifierType.annotation.serialize = [];
                        }

                        const annotation: SerializationAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.serialize.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isExecutionAnnotation(name)) {
                        if (!modifierType.annotation.execution) {
                            modifierType.annotation.execution = [];
                        }

                        const annotation: ExecutionAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.execution.push(annotation);
                        return;
                    }

                    if (typeof name === 'string' && isCompatibilityAnnotation(name)) {
                        if (!modifierType.annotation.compatibility) {
                            modifierType.annotation.compatibility = [];
                        }

                        const annotation: CompatibilityAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.compatibility.push(annotation);
                        return;
                    }

                    if (typeof name === 'string') {
                        if (!modifierType.annotation.other) {
                            modifierType.annotation.other = [];
                        }

                        const annotation: OtherAnnotationType = {
                            name,
                        };

                        if (annotationParam != null) {
                            annotation.param = annotationParam;
                        }

                        modifierType.annotation.other.push(annotation);
                        return;
                    }
                },
            },
            makeErrorAssignRule(errorInfo),
        ]);
    });

    return modifierType;
};
