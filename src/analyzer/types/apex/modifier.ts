import typia from 'typia';

import {
    ErrorInfo,
    SourceInfo,
    assignMultiClass,
    isErrorInfo,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeErrorInfo,
    makeSourceInfo,
    splitSourceInfo,
} from './commons';

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

type AnnotationType<TName extends string> = {
    name: TName;
    param?: AnnotationParam | AnnotationParam[];
};

export type ModifierType = {
    access?: AccessModifier[];
    declaration?: DeclarationModifier[];
    webService?: WebServiceModifier[];
    test?: TestModifier[];
    sharing?: SharingModifier[];
    other?: OtherModifier[];
    annotation?: {
        lwc?: AnnotationType<LWCAnnotation>[];
        flow?: AnnotationType<FlowAnnotation>[];
        async?: AnnotationType<AsyncAnnotation>[];
        test?: AnnotationType<TestAnnotation>[];
        rest?: AnnotationType<RestAnnotation>[];
        visualforce?: AnnotationType<VisualforceAnnotation>[];
        access?: AnnotationType<AccessAnnotation>[];
        serialize?: AnnotationType<SerializationAnnotation>[];
        execution?: AnnotationType<ExecutionAnnotation>[];
        compatibility?: AnnotationType<CompatibilityAnnotation>[];
        other?: AnnotationType<string>[];
    };
};

export const isModifierType = typia.createIs<ModifierType>();

export const makeElementValueType = (
    type: string,
    elementValueClass: ElementValueTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    return assignMultiClass(elementValueClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
            construct: (typeClass: NormalLiteralTypeClass) => {
                const normalLiteral = splitSourceInfo(
                    typeClass,
                    [type, elementValueClass.getType(), typeClass.getType()].join('_'),
                    sourceInfo,
                );
                const value = normalLiteral.getValue();
                const valueType = normalLiteral.getValueType();

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
};

const makeElementValuePairType = (
    type: string,
    elementValuePairTypeClass: ElementValuePairTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    const elementValuePairType = elementValuePairTypeClass.getType();
    const key = elementValuePairTypeClass.getLeft();
    const value = elementValuePairTypeClass.getRight();

    return {
        key: assignMultiClass(key, [
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
                construct: (typeClass: NormalIdTypeClass) => {
                    return splitSourceInfo(
                        typeClass,
                        [type, elementValuePairType, typeClass.getType()].join('_'),
                        sourceInfo,
                    ).getValue();
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
        value: assignMultiClass(value, [
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isElementValueType),
                construct: (typeClass: ElementValueTypeClass) => {
                    return makeElementValueType(
                        [type, elementValuePairType].join('_'),
                        typeClass,
                        sourceInfo,
                        errorInfo,
                    );
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
    };
};

const makeElementValuePairsType = (
    type: string,
    elementValuePairsTypeClass: ElementValuePairsTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
) => {
    const elementValuePairsType = elementValuePairsTypeClass.getType();

    return elementValuePairsTypeClass
        .getValue()
        .map((value) => {
            return assignMultiClass(value, [
                {
                    isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairType),
                    construct: (typeClass: ElementValuePairTypeClass) => {
                        return makeElementValuePairType(
                            [type, elementValuePairsType].join('_'),
                            typeClass,
                            sourceInfo,
                            errorInfo,
                        );
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        })
        .filter((value) => value != null);
};

const makeAnnotationType = (
    modifierType: ModifierType,
    type: string,
    annotationTypeClass: AnnotationTypeClass,
    sourceInfo: { [key: string]: SourceInfo },
    errorInfo: ErrorInfo[],
): void => {
    if (!modifierType.annotation) {
        modifierType.annotation = {};
    }

    const annotationType = annotationTypeClass.getType();
    const name = assignMultiClass(annotationTypeClass.getValue(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
            construct: (typeClass: NormalIdTypeClass) => {
                return splitSourceInfo(
                    typeClass,
                    [type, annotationType, typeClass.getType()].join('_'),
                    sourceInfo,
                ).getValue();
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    const param = assignMultiClass(annotationTypeClass.getParam(), [
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isElementValueType),
            construct: (typeClass: ElementValueTypeClass) => {
                return makeElementValueType(
                    [type, annotationType].join('_'),
                    typeClass,
                    sourceInfo,
                    errorInfo,
                );
            },
        },
        {
            isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsType),
            construct: (typeClass: ElementValuePairsTypeClass) => {
                return makeElementValuePairsType(
                    [type, annotationType].join('_'),
                    typeClass,
                    sourceInfo,
                    errorInfo,
                );
            },
        },
        makeErrorAssignRule(errorInfo),
    ]);

    let annotationParam: AnnotationParam | AnnotationParam[] | undefined = undefined;
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

    if (name != null) {
        if (isLWCAnnotation(name)) {
            if (!modifierType.annotation.lwc) {
                modifierType.annotation.lwc = [];
            }

            const annotationType: AnnotationType<LWCAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.lwc.push(annotationType);

            return;
        }

        if (isFlowAnnotation(name)) {
            if (!modifierType.annotation.flow) {
                modifierType.annotation.flow = [];
            }

            const annotationType: AnnotationType<FlowAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.flow.push(annotationType);

            return;
        }

        if (isAsyncAnnotation(name)) {
            if (!modifierType.annotation.async) {
                modifierType.annotation.async = [];
            }

            const annotationType: AnnotationType<AsyncAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.async.push(annotationType);

            return;
        }

        if (isTestAnnotation(name)) {
            if (!modifierType.annotation.test) {
                modifierType.annotation.test = [];
            }

            const annotationType: AnnotationType<TestAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.test.push(annotationType);

            return;
        }

        if (isRestAnnotation(name)) {
            if (!modifierType.annotation.rest) {
                modifierType.annotation.rest = [];
            }

            const annotationType: AnnotationType<RestAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.rest.push(annotationType);

            return;
        }

        if (isVisualforceAnnotation(name)) {
            if (!modifierType.annotation.visualforce) {
                modifierType.annotation.visualforce = [];
            }

            const annotationType: AnnotationType<VisualforceAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.visualforce.push(annotationType);

            return;
        }

        if (isAccessAnnotation(name)) {
            if (!modifierType.annotation.access) {
                modifierType.annotation.access = [];
            }

            const annotationType: AnnotationType<AccessAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.access.push(annotationType);

            return;
        }

        if (isSerializationAnnotation(name)) {
            if (!modifierType.annotation.serialize) {
                modifierType.annotation.serialize = [];
            }

            const annotationType: AnnotationType<SerializationAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.serialize.push(annotationType);

            return;
        }

        if (isExecutionAnnotation(name)) {
            if (!modifierType.annotation.execution) {
                modifierType.annotation.execution = [];
            }

            const annotationType: AnnotationType<ExecutionAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.execution.push(annotationType);

            return;
        }

        if (isCompatibilityAnnotation(name)) {
            if (!modifierType.annotation.compatibility) {
                modifierType.annotation.compatibility = [];
            }

            const annotationType: AnnotationType<CompatibilityAnnotation> = {
                name: name,
            };
            if (annotationParam) {
                annotationType.param = annotationParam;
            }

            modifierType.annotation.compatibility.push(annotationType);

            return;
        }

        if (!modifierType.annotation.other) {
            modifierType.annotation.other = [];
        }

        const annotationType: AnnotationType<string> = {
            name: name,
        };
        if (annotationParam) {
            annotationType.param = annotationParam;
        }

        modifierType.annotation.other.push(annotationType);
    }
};

export const makeModifierType = (
    type: string,
    modifiers: NormalModifierTypeClass[],
    sourceInfo: { [key: string]: SourceInfo },
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
                    modifierType.other.push(typeClass);
                },
            },
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isAnnotationType),
                construct: (typeClass: AnnotationTypeClass) => {
                    makeAnnotationType(modifierType, type, typeClass, sourceInfo, errorInfo);
                },
            },
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
                construct: (typeClass: ErrorTypeClass) => {
                    return makeErrorInfo(typeClass);
                },
            },
        ]);
        if (!modifierElement) {
            sourceInfo = {
                ...sourceInfo,
                [[type, modifier.getType()].join('_')]: makeSourceInfo(modifier),
            };
            return;
        }

        if (isErrorInfo(modifierElement)) {
            errorInfo.push(modifierElement);
            return;
        }
    });

    if (Object.keys(modifierType).length > 0) {
        return modifierType;
    }

    return undefined;
};
