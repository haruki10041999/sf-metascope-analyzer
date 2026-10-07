import { AnnotationTypeClass, NormalModifierTypeClass, ErrorTypeClass } from '../apex_IR';

type AccessModifier = 'GLOBAL' | 'PUBLIC' | 'PROTECTED' | 'PRIVATE';

type StateModifier = 'STATIC' | 'FINAL' | 'TRANSIENT';

type InheritanceModifier = 'ABSTRACT' | 'VIRTUAL' | 'OVERRIDE';

type WebModifier = 'WEBSERVICE';

type TestModifier = 'TESTMETHOD';

type SharingModifier = 'WITH_SHARING' | 'WITHOUT_SHARING' | 'INHERITED_SHARING';

type AnnotationField = {
    name: string;
    param: {
        name?: string;
        value: string;
    }[];
};

export type ModifierField = {
    annotation?: AnnotationField;
    access?: AccessModifier;
    state?: StateModifier;
    inheritance?: InheritanceModifier;
    web?: WebModifier;
    test?: TestModifier;
    sharing?: SharingModifier;
};

export const makeModifierField = (
    modifierTypes: (NormalModifierTypeClass | ErrorTypeClass)[],
): ModifierField => {
    const modifierField: ModifierField = {};

    return modifierField;
};
