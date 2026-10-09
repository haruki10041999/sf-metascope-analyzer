import { NormalModifier, Annotation, ElementValue, ElementValuePairs } from './converter';

type AnnotationParam = {
    key?: string;
    value: string;
    valueType: string;
};

type AccessModifier = 'PUBLIC' | 'PRIVATE' | 'PROTECTED' | 'GLOBAL';
type DeclarationModifier = 'STATIC' | 'FINAL' | 'ABSTRACT' | 'VIRTUAL' | 'OVERRIDE';
type WebServiceModifier = 'WEBSERVICE';
type TestModifier = 'TESTMETHOD';
type SharingModifier = 'WITH_SHARING' | 'WITHOUT_SHARING' | 'INHERIT_SHARING';
type OtherModifier = 'TRANSIENT';

export const isAccessModifier = (value: string): value is AccessModifier =>
    value === 'PUBLIC' || value === 'PRIVATE' || value === 'PROTECTED' || value === 'GLOBAL';

export const isDeclarationModifier = (value: string): value is DeclarationModifier =>
    value === 'STATIC' ||
    value === 'FINAL' ||
    value === 'ABSTRACT' ||
    value === 'VIRTUAL' ||
    value === 'OVERRIDE';

export const isWebServiceModifier = (value: string): value is WebServiceModifier =>
    value === 'WEBSERVICE';

export const isTestModifier = (value: string): value is TestModifier => value === 'TESTMETHOD';

export const isSharingModifier = (value: string): value is SharingModifier =>
    value === 'WITH_SHARING' || value === 'WITHOUT_SHARING' || value === 'INHERIT_SHARING';

export const isOtherModifier = (value: string): value is OtherModifier => value === 'TRANSIENT';

export type ModifierType = {
    access?: AccessModifier[];
    declaration?: DeclarationModifier[];
    webService?: WebServiceModifier[];
    test?: TestModifier[];
    sharing?: SharingModifier[];
    other?: OtherModifier[];
    annotation?: {
        [key: string]: AnnotationParam[];
    };
};

export const makeModifierType = (modifier: NormalModifier[]): ModifierType => {
    const modifierType: ModifierType = {};

    modifier.forEach((m) => {
        if (!m) return;

        if (m.type === 'modifier') {
            if (isAccessModifier(m.value)) {
                if (!modifierType.access) {
                    modifierType.access = [];
                }
                modifierType.access.push(m.value);
            }

            if (isDeclarationModifier(m.value)) {
                if (!modifierType.declaration) {
                    modifierType.declaration = [];
                }
                modifierType.declaration.push(m.value);
            } else if (isWebServiceModifier(m.value)) {
                if (!modifierType.webService) {
                    modifierType.webService = [];
                }
                modifierType.webService.push(m.value);
            } else if (isTestModifier(m.value)) {
                if (!modifierType.test) {
                    modifierType.test = [];
                }
                modifierType.test.push(m.value);
            } else if (isSharingModifier(m.value)) {
                if (!modifierType.sharing) {
                    modifierType.sharing = [];
                }
                modifierType.sharing.push(m.value);
            } else if (isOtherModifier(m.value)) {
                if (!modifierType.other) {
                    modifierType.other = [];
                }
                modifierType.other.push(m.value);
            }
        }

        if (m.type === 'annotation') {
            if (!modifierType.annotation) {
                modifierType.annotation = {};
            }

            const key = m.value.value;
            const param = m.value.param;

            if (key) {
                if (!param) {
                    modifierType.annotation[key] = [];
                    return;
                }

                if (Array.isArray(param)) {
                    const annotationParams: AnnotationParam[] = [];
                    param.forEach((p) => {
                        const annotationParam = {
                            key: p.left || '',
                            value: p.right!.value || '',
                            valueType: p.right!.valueType || '',
                        };
                        annotationParams.push(annotationParam);
                    });
                    modifierType.annotation[key] = annotationParams;
                } else {
                    const annotationParam: AnnotationParam = {
                        value: param.value || '',
                        valueType: param.valueType || '',
                    };
                    modifierType.annotation[key] = [annotationParam];
                }
            }
        }
    });

    return modifierType;
};
