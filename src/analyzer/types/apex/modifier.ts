import {
    NormalModifierClass,
    AnnotationClass,
    NormalLiteralClass,
    ElementValuePairClass,
} from './converter';

type AccessModifier = 'PUBLIC' | 'PRIVATE' | 'PROTECTED' | 'GLOBAL';
type DeclarationModifier = 'STATIC' | 'FINAL' | 'ABSTRACT' | 'VIRTUAL' | 'OVERRIDE';
type WebServiceModifier = 'WEBSERVICE';
type TestModifier = 'TESTMETHOD';
type SharingModifier = 'WITH_SHARING' | 'WITHOUT_SHARING' | 'INHERIT_SHARING';
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
    value === 'WITH_SHARING' || value === 'WITHOUT_SHARING' || value === 'INHERIT_SHARING';

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
    param?: AnnotationParam[];
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

const makeAnnotationType = <TName extends string>(
    result: AnnotationType<TName>[],
    name: TName,
    param: NormalLiteralClass | ElementValuePairClass[] | null,
): void => {
    const annotation: AnnotationType<TName> = {
        name: name,
    };

    if (param) {
        if (Array.isArray(param)) {
            param.forEach((p) => {
                const key = p.getLeft();

                const right = p.getRight();
                const value = right.getValue();
                const valueType = right.getValueType();

                if (!key || !value || !valueType) return;

                if (!annotation.param) {
                    annotation.param = [];
                }

                annotation.param.push({
                    key: key,
                    value: value,
                    valueType: valueType,
                });
            });
        } else {
            const value = param.getValue();
            const valueType = param.getValueType();

            if (!value || !valueType) return;

            annotation.param = [
                {
                    value: value,
                    valueType: valueType,
                },
            ];
        }
    }
    result.push(annotation);
};
export const makeModifierType = (modifiers: NormalModifierClass[]): ModifierType | undefined => {
    const modifierType: ModifierType = {};

    modifiers.forEach((modifier) => {
        const modifierElement = modifier.getValue();
        if (!modifierElement) return;

        if (modifierElement.getType() === 'normal') {
            const modifier = modifierElement.getModifier() as string;

            if (isAccessModifier(modifier)) {
                if (!modifierType.access) {
                    modifierType.access = [];
                }
                modifierType.access.push(modifier);
                return;
            }

            if (isDeclarationModifier(modifier)) {
                if (!modifierType.declaration) {
                    modifierType.declaration = [];
                }
                modifierType.declaration.push(modifier);
                return;
            }

            if (isWebServiceModifier(modifier)) {
                if (!modifierType.webService) {
                    modifierType.webService = [];
                }
                modifierType.webService.push(modifier);
                return;
            }

            if (isTestModifier(modifier)) {
                if (!modifierType.test) {
                    modifierType.test = [];
                }
                modifierType.test.push(modifier);
                return;
            }

            if (isSharingModifier(modifier)) {
                if (!modifierType.sharing) {
                    modifierType.sharing = [];
                }
                modifierType.sharing.push(modifier);
                return;
            }

            if (isOtherModifier(modifier)) {
                if (!modifierType.other) {
                    modifierType.other = [];
                }
                modifierType.other.push(modifier);
                return;
            }
        }

        if (modifierElement.getModifier() === 'annotation') {
            const modifier = modifierElement.getModifier() as AnnotationClass;

            if (!modifierType.annotation) {
                modifierType.annotation = {};
            }

            const name = modifier.getValue();
            const param = modifier.getParam();

            if (name) {
                if (isLWCAnnotation(name)) {
                    if (!modifierType.annotation.lwc) {
                        modifierType.annotation.lwc = [];
                    }
                    makeAnnotationType(modifierType.annotation.lwc, name, param);
                    return;
                }

                if (isFlowAnnotation(name)) {
                    if (!modifierType.annotation.flow) {
                        modifierType.annotation.flow = [];
                    }

                    makeAnnotationType(modifierType.annotation.flow, name, param);
                    return;
                }

                if (isAsyncAnnotation(name)) {
                    if (!modifierType.annotation.async) {
                        modifierType.annotation.async = [];
                    }

                    makeAnnotationType(modifierType.annotation.async, name, param);
                    return;
                }

                if (isTestAnnotation(name)) {
                    if (!modifierType.annotation.test) {
                        modifierType.annotation.test = [];
                    }

                    makeAnnotationType(modifierType.annotation.test, name, param);
                    return;
                }

                if (isRestAnnotation(name)) {
                    if (!modifierType.annotation.rest) {
                        modifierType.annotation.rest = [];
                    }

                    makeAnnotationType(modifierType.annotation.rest, name, param);
                    return;
                }

                if (isVisualforceAnnotation(name)) {
                    if (!modifierType.annotation.visualforce) {
                        modifierType.annotation.visualforce = [];
                    }

                    makeAnnotationType(modifierType.annotation.visualforce, name, param);
                    return;
                }

                if (isAccessAnnotation(name)) {
                    if (!modifierType.annotation.access) {
                        modifierType.annotation.access = [];
                    }

                    makeAnnotationType(modifierType.annotation.access, name, param);
                    return;
                }

                if (isSerializationAnnotation(name)) {
                    if (!modifierType.annotation.serialize) {
                        modifierType.annotation.serialize = [];
                    }

                    makeAnnotationType(modifierType.annotation.serialize, name, param);
                    return;
                }

                if (isExecutionAnnotation(name)) {
                    if (!modifierType.annotation.execution) {
                        modifierType.annotation.execution = [];
                    }

                    makeAnnotationType(modifierType.annotation.execution, name, param);
                    return;
                }

                if (isCompatibilityAnnotation(name)) {
                    if (!modifierType.annotation.compatibility) {
                        modifierType.annotation.compatibility = [];
                    }

                    makeAnnotationType(modifierType.annotation.compatibility, name, param);
                    return;
                }

                if (!modifierType.annotation.other) {
                    modifierType.annotation.other = [];
                }

                makeAnnotationType(modifierType.annotation.other, name, param);
            }
        }
    });

    if (Object.keys(modifierType).length > 0) {
        return modifierType;
    }

    return undefined;
};
