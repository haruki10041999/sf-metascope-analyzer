import {
    ClassDeclarationClass,
    isMemberDeclarationClass,
    isNormalStatementClassArray,
} from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';
import { makeMemberType } from './member';
import { MethodField } from './method';
import { PropertyField } from './property';
import { FieldField } from './field';
import { EnumField } from './enum';
import { ConstructorField } from './constructor';
import { InterfaceField } from './interface';

export type InnerMethodField = Omit<MethodField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerPropertyField = Omit<PropertyField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerFieldField = Omit<FieldField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerEnumField = Omit<EnumField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerConstructorField = Omit<ConstructorField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerInterfaceField = Omit<InterfaceField, 'kind'> & {
    modifier?: ModifierType;
};

export type InnerClassField = Omit<ClassField, 'kind'> & {
    modifier?: ModifierType;
};

export type InitializeBlockField = {
    block: StatementType[];
    isStatic: boolean;
};

export type ClassField = {
    kind: 'class';
    name: string;
    method?: InnerMethodField[];
    property?: InnerPropertyField[];
    field?: InnerFieldField[];
    enum?: InnerEnumField[];
    construct?: InnerConstructorField[];
    interface?: InnerInterfaceField[];
    class?: InnerClassField[];
    initializerBlock?: InitializeBlockField[];
    extend?: TypeType;
    implement?: TypeType[];
};

export const makeClassField = (classDeclaration: ClassDeclarationClass): ClassField | undefined => {
    const name = classDeclaration.getValue();
    const bodies = classDeclaration.getBody();
    const extend = makeTypeType(classDeclaration.getExtend());
    const implement = classDeclaration
        .getImplement()
        .map((i) => makeTypeType(i))
        .filter((i) => i !== undefined);

    if (name) {
        const classField: ClassField = {
            kind: 'class',
            name: name,
        };

        if (extend) {
            classField.extend = extend;
        }

        if (implement.length > 0) {
            classField.implement = implement;
        }

        bodies.forEach((b) => {
            const body = b.getValue();
            if (isNormalStatementClassArray(body)) {
                if (!classField.initializerBlock) {
                    classField.initializerBlock = [];
                }

                const initializerBlock: InitializeBlockField = {
                    block: body.map((b) => makeStatementType(b)).filter((b) => b !== undefined),
                    isStatic: b.getIsStatic() || false,
                };
                classField.initializerBlock.push(initializerBlock);
            }

            if (isMemberDeclarationClass(body)) {
                const modifier = makeModifierType(b.getModifier());

                const member = makeMemberType(body);

                if (member) {
                    if (member.kind === 'constructor') {
                        const { kind, ...content } = member;

                        if (!classField.construct) {
                            classField.construct = [];
                        }

                        const field: InnerConstructorField = {
                            ...content,
                        };

                        if (modifier) {
                            field.modifier = modifier;
                        }

                        classField.construct.push(field);
                    }

                    if (member.kind === 'method') {
                        const { kind, ...content } = member;

                        if (!classField.method) {
                            classField.method = [];
                        }

                        const fieldField: InnerMethodField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.method.push(fieldField);
                    }

                    if (member.kind === 'property') {
                        const { kind, ...content } = member;

                        if (!classField.property) {
                            classField.property = [];
                        }

                        const fieldField: InnerPropertyField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.property.push(fieldField);
                    }

                    if (member.kind === 'field') {
                        const { kind, ...content } = member;

                        if (!classField.field) {
                            classField.field = [];
                        }

                        const fieldField: InnerFieldField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.field.push(fieldField);
                    }

                    if (member.kind === 'enum') {
                        const { kind, ...content } = member;

                        if (!classField.enum) {
                            classField.enum = [];
                        }

                        const fieldField: InnerEnumField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.enum.push(fieldField);
                    }

                    if (member.kind === 'interface') {
                        const { kind, ...content } = member;

                        if (!classField.interface) {
                            classField.interface = [];
                        }

                        const fieldField: InnerInterfaceField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.interface.push(fieldField);
                    }

                    if (member.kind === 'class') {
                        const { kind, ...content } = member;

                        if (!classField.class) {
                            classField.class = [];
                        }

                        const fieldField: InnerClassField = {
                            ...content,
                        };

                        if (modifier) {
                            fieldField.modifier = modifier;
                        }

                        classField.class.push(fieldField);
                    }
                }
            }
        });

        return classField;
    }

    return undefined;
};
