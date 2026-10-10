import {
    ErrorTypeClass,
    AnonymousMemberDeclarationTypeClass,
    ClassBodyDeclarationTypeClass,
    ClassDeclarationTypeClass,
    ConstructorDeclarationTypeClass,
    EnumConstantsTypeClass,
    EnumDeclarationTypeClass,
    FieldDeclarationTypeClass,
    InterfaceDeclarationTypeClass,
    InterfaceMethodDeclarationTypeClass,
    LocalVariableDeclarationTypeClass,
    MemberDeclarationTypeClass,
    MethodDeclarationTypeClass,
    PropertyDeclarationTypeClass,
    TriggerMemberDeclarationTypeClass,
    TypeDeclarationTypeClass,
    NormalBlockTypeClass,
    isClassBodyType,
    isClassDeclarationType,
    isConstructorDeclarationType,
    isEnumConstantsType,
    isEnumDeclarationType,
    isFieldDeclarationType,
    isFormalParametersType,
    isInterfaceBodyType,
    isInterfaceDeclarationType,
    isMemberDeclarationType,
    isMethodDeclarationType,
    isNormalBlockType,
    isNormalIdType,
    isPropertyBlockType,
    isPropertyDeclarationType,
    isQualifiedNameType,
    isTypeListType,
    isTypeRefType,
    isVariableDeclaratorsType,
    isNormalModifierType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { qualifiedNameConvert } from './name';
import { TypeRef, typeRefConvert } from './type';
import { typeListConvert } from './list';
import { normalBlockConvert, PropertyBlock, propertyBlockConvert } from './block';
import { classBodyConvert, interfaceBodyConvert } from './body';
import { NormalModifier, normalModifierConvert } from './modifier';
import { FormalParameter, formalParametersConvert } from './parameter';
import { VariableDeclarator, variableDeclaratorsConvert } from './variable';
import { NormalStatement } from './statement';

export type MemberDeclaration =
    | {
          type: 'method';
          member: MethodDeclaration;
      }
    | {
          type: 'constructor';
          member: ConstructorDeclaration;
      }
    | {
          type: 'interface';
          member: InterfaceDeclaration;
      }
    | {
          type: 'class';
          member: ClassDeclaration;
      }
    | {
          type: 'enum';
          member: EnumDeclaration;
      }
    | {
          type: 'property';
          member: PropertyDeclaration;
      }
    | {
          type: 'field';
          member: FieldDeclaration;
      };

const memberDeclarationConvert = (
    target: MemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MemberDeclaration | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            | MethodDeclarationTypeClass
            | ConstructorDeclarationTypeClass
            | InterfaceDeclarationTypeClass
            | ClassDeclarationTypeClass
            | EnumDeclarationTypeClass
            | PropertyDeclarationTypeClass
            | FieldDeclarationTypeClass =>
            isMethodDeclarationType(target) ||
            isConstructorDeclarationType(target) ||
            isInterfaceDeclarationType(target) ||
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isPropertyDeclarationType(target) ||
            isFieldDeclarationType(target),
        errorClass,
    );

    let memberDeclaration: MemberDeclaration | undefined = undefined;

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'method',
                member: {
                    param: [],
                    block: [],
                },
            };

            const member = methodDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.param.push(...member.param);
            memberDeclaration.member.block.push(...member.block);
            if (member.value) {
                memberDeclaration.member.value = member.value;
            }

            if (member.valueType) {
                memberDeclaration.member.valueType = member.valueType;
            }
        }
        if (isConstructorDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'constructor',
                member: {
                    value: [],
                    param: [],
                    block: [],
                },
            };

            const member = constructorDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.value.push(...member.value);
            memberDeclaration.member.param.push(...member.param);
            memberDeclaration.member.block.push(...member.block);
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'interface',
                member: {
                    body: [],
                    extend: [],
                },
            };

            const member = interfaceDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.body.push(...member.body);
            memberDeclaration.member.extend.push(...member.extend);
            if (member.value) {
                memberDeclaration.member.value = member.value;
            }
        }
        if (isClassDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'class',
                member: {
                    body: [],
                    extend: {
                        value: [],
                    },
                    implement: [],
                },
            };

            const member = classDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.body.push(...member.body);
            memberDeclaration.member.extend.value.push(...member.extend.value);
            memberDeclaration.member.implement.push(...member.implement);
            if (member.value) {
                memberDeclaration.member.value = member.value;
            }
            if (member.extend.dimension) {
                memberDeclaration.member.extend.dimension = member.extend.dimension;
            }
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'enum',
                member: {
                    constant: [],
                },
            };

            const member = enumDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.constant.push(...member.constant);
            if (member.value) {
                memberDeclaration.member.value = member.value;
            }
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'property',
                member: {
                    valueType: {
                        value: [],
                    },
                    block: [],
                },
            };

            const member = propertyDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.valueType.value.push(...member.valueType.value);
            memberDeclaration.member.block.push(...member.block);
            if (member.value) {
                memberDeclaration.member.value = member.value;
            }
            if (member.valueType.dimension) {
                memberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            memberDeclaration = {
                type: 'field',
                member: {
                    value: [],
                    valueType: {
                        value: [],
                    },
                },
            };

            const member = fieldDeclarationConvert(valueTypeClass, errorClass);
            memberDeclaration.member.value.push(...member.value);
            memberDeclaration.member.valueType.value.push(...member.valueType.value);
            if (member.valueType.dimension) {
                memberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
    }

    return memberDeclaration;
};

export type AnonymousMemberDeclaration =
    | {
          type: 'method';
          member: MethodDeclaration;
      }
    | {
          type: 'interface';
          member: InterfaceDeclaration;
      }
    | {
          type: 'class';
          member: ClassDeclaration;
      }
    | {
          type: 'enum';
          member: EnumDeclaration;
      }
    | {
          type: 'property';
          member: PropertyDeclaration;
      }
    | {
          type: 'field';
          member: FieldDeclaration;
      };

export const anonymousMemberDeclarationConvert = (
    target: AnonymousMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousMemberDeclaration | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            | MethodDeclarationTypeClass
            | InterfaceDeclarationTypeClass
            | ClassDeclarationTypeClass
            | EnumDeclarationTypeClass
            | PropertyDeclarationTypeClass
            | FieldDeclarationTypeClass =>
            isMethodDeclarationType(target) ||
            isInterfaceDeclarationType(target) ||
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isPropertyDeclarationType(target) ||
            isFieldDeclarationType(target),
        errorClass,
    );

    let anonymousMemberDeclaration: AnonymousMemberDeclaration | undefined = undefined;

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'method',
                member: {
                    param: [],
                    block: [],
                },
            };

            const member = methodDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.param.push(...member.param);
            anonymousMemberDeclaration.member.block.push(...member.block);
            if (member.value) {
                anonymousMemberDeclaration.member.value = member.value;
            }

            if (member.valueType) {
                anonymousMemberDeclaration.member.valueType = member.valueType;
            }
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'interface',
                member: {
                    body: [],
                    extend: [],
                },
            };

            const member = interfaceDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.body.push(...member.body);
            anonymousMemberDeclaration.member.extend.push(...member.extend);
            if (member.value) {
                anonymousMemberDeclaration.member.value = member.value;
            }
        }
        if (isClassDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'class',
                member: {
                    body: [],
                    extend: {
                        value: [],
                    },
                    implement: [],
                },
            };

            const member = classDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.body.push(...member.body);
            anonymousMemberDeclaration.member.extend.value.push(...member.extend.value);
            anonymousMemberDeclaration.member.implement.push(...member.implement);
            if (member.value) {
                anonymousMemberDeclaration.member.value = member.value;
            }
            if (member.extend.dimension) {
                anonymousMemberDeclaration.member.extend.dimension = member.extend.dimension;
            }
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'enum',
                member: {
                    constant: [],
                },
            };

            const member = enumDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.constant.push(...member.constant);
            if (member.value) {
                anonymousMemberDeclaration.member.value = member.value;
            }
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'property',
                member: {
                    valueType: {
                        value: [],
                    },
                    block: [],
                },
            };

            const member = propertyDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.valueType.value.push(...member.valueType.value);
            anonymousMemberDeclaration.member.block.push(...member.block);
            if (member.value) {
                anonymousMemberDeclaration.member.value = member.value;
            }
            if (member.valueType.dimension) {
                anonymousMemberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration = {
                type: 'field',
                member: {
                    value: [],
                    valueType: {
                        value: [],
                    },
                },
            };

            const member = fieldDeclarationConvert(valueTypeClass, errorClass);
            anonymousMemberDeclaration.member.value.push(...member.value);
            anonymousMemberDeclaration.member.valueType.value.push(...member.valueType.value);
            if (member.valueType.dimension) {
                anonymousMemberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
    }

    return anonymousMemberDeclaration;
};

export type TriggerMemberDeclaration =
    | {
          type: 'method';
          member: MethodDeclaration;
      }
    | {
          type: 'interface';
          member: InterfaceDeclaration;
      }
    | {
          type: 'class';
          member: ClassDeclaration;
      }
    | {
          type: 'enum';
          member: EnumDeclaration;
      }
    | {
          type: 'property';
          member: PropertyDeclaration;
      }
    | {
          type: 'field';
          member: FieldDeclaration;
      };

export const triggerMemberDeclarationConvert = (
    target: TriggerMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerMemberDeclaration | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            | MethodDeclarationTypeClass
            | InterfaceDeclarationTypeClass
            | ClassDeclarationTypeClass
            | EnumDeclarationTypeClass
            | PropertyDeclarationTypeClass
            | FieldDeclarationTypeClass =>
            isMethodDeclarationType(target) ||
            isInterfaceDeclarationType(target) ||
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isPropertyDeclarationType(target) ||
            isFieldDeclarationType(target),
        errorClass,
    );

    let triggerMemberDeclaration: TriggerMemberDeclaration | undefined = undefined;

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'method',
                member: {
                    param: [],
                    block: [],
                },
            };

            const member = methodDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.param.push(...member.param);
            triggerMemberDeclaration.member.block.push(...member.block);
            if (member.value) {
                triggerMemberDeclaration.member.value = member.value;
            }

            if (member.valueType) {
                triggerMemberDeclaration.member.valueType = member.valueType;
            }
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'interface',
                member: {
                    body: [],
                    extend: [],
                },
            };

            const member = interfaceDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.body.push(...member.body);
            triggerMemberDeclaration.member.extend.push(...member.extend);
            if (member.value) {
                triggerMemberDeclaration.member.value = member.value;
            }
        }
        if (isClassDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'class',
                member: {
                    body: [],
                    extend: {
                        value: [],
                    },
                    implement: [],
                },
            };

            const member = classDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.body.push(...member.body);
            triggerMemberDeclaration.member.extend.value.push(...member.extend.value);
            triggerMemberDeclaration.member.implement.push(...member.implement);
            if (member.value) {
                triggerMemberDeclaration.member.value = member.value;
            }
            if (member.extend.dimension) {
                triggerMemberDeclaration.member.extend.dimension = member.extend.dimension;
            }
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'enum',
                member: {
                    constant: [],
                },
            };

            const member = enumDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.constant.push(...member.constant);
            if (member.value) {
                triggerMemberDeclaration.member.value = member.value;
            }
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'property',
                member: {
                    valueType: {
                        value: [],
                    },
                    block: [],
                },
            };

            const member = propertyDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.valueType.value.push(...member.valueType.value);
            triggerMemberDeclaration.member.block.push(...member.block);
            if (member.value) {
                triggerMemberDeclaration.member.value = member.value;
            }
            if (member.valueType.dimension) {
                triggerMemberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration = {
                type: 'field',
                member: {
                    value: [],
                    valueType: {
                        value: [],
                    },
                },
            };

            const member = fieldDeclarationConvert(valueTypeClass, errorClass);
            triggerMemberDeclaration.member.value.push(...member.value);
            triggerMemberDeclaration.member.valueType.value.push(...member.valueType.value);
            if (member.valueType.dimension) {
                triggerMemberDeclaration.member.valueType.dimension = member.valueType.dimension;
            }
        }
    }

    return triggerMemberDeclaration;
};
export type ClassBodyDeclaration = {
    value?: MemberDeclaration | NormalStatement[];
    modifier: NormalModifier[];
    isStatic?: boolean;
};

export const classBodyDeclarationConvert = (
    target: ClassBodyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBodyDeclaration => {
    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    const classBodyDeclaration: ClassBodyDeclaration = {
        modifier: modifiers,
    };

    const valueValue = target.getValue();

    if (valueValue) {
        const valueTypeClass = toTypeClass(
            valueValue,
            (target): target is MemberDeclarationTypeClass | NormalBlockTypeClass =>
                isMemberDeclarationType(target) || isNormalBlockType(target),
            errorClass,
        );
        if (valueTypeClass) {
            if (isMemberDeclarationType(valueTypeClass)) {
                const member = memberDeclarationConvert(valueTypeClass, errorClass);
                if (member) {
                    classBodyDeclaration.value = member;
                }
            }
            if (isNormalBlockType(valueTypeClass)) {
                classBodyDeclaration.value = normalBlockConvert(valueTypeClass, errorClass);
            }
        }

        const isStatic: boolean = target.getIsStatic();
        if (valueValue && isNormalBlockType(valueValue)) {
            classBodyDeclaration.isStatic = isStatic;
        }
    }

    return classBodyDeclaration;
};

export type ClassDeclaration = {
    value?: string;
    body: ClassBodyDeclaration[];
    extend: TypeRef;
    implement: TypeRef[];
};

export const classDeclarationConvert = (
    target: ClassDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassDeclaration => {
    const body: ClassBodyDeclaration[] = [];
    const bodyTypeClass = toTypeClass(target.getBody(), isClassBodyType, errorClass);
    if (bodyTypeClass) {
        body.push(...classBodyConvert(bodyTypeClass, errorClass));
    }

    const implement: TypeRef[] = [];
    const implementValue = target.getExtend();
    if (implementValue) {
        const implementTypeClass = toTypeClass(implementValue, isTypeListType, errorClass);
        if (implementTypeClass) {
            implement.push(...typeListConvert(implementTypeClass, errorClass));
        }
    }

    const classDeclaration: ClassDeclaration = {
        body: body,
        extend: {
            value: [],
        },
        implement: [],
    };

    const extendValue = target.getExtend();
    if (extendValue) {
        const extendTypeClass = toTypeClass(extendValue, isTypeRefType, errorClass);
        if (extendTypeClass) {
            const extend = typeRefConvert(extendTypeClass, errorClass);
            classDeclaration.extend.value = extend.value;
            if (extend.dimension) {
                classDeclaration.extend.dimension = extend.dimension;
            }
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        classDeclaration.value = normalIdConvert(valueTypeClass);
    }

    return classDeclaration;
};

export type ConstructorDeclaration = {
    value: string[];
    param: FormalParameter[];
    block: NormalStatement[];
};

export const constructorDeclarationConvert = (
    target: ConstructorDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ConstructorDeclaration => {
    const value: string[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isQualifiedNameType, errorClass);
    if (valueTypeClass) {
        value.push(...qualifiedNameConvert(valueTypeClass, errorClass));
    }

    const param: FormalParameter[] = [];
    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            param.push(...formalParametersConvert(paramTypeClass, errorClass));
        }
    }

    const block: NormalStatement[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }

    return {
        value: value,
        param: param,
        block: block,
    };
};

export const enumConstantsConvert = (
    target: EnumConstantsTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (valueTypeClass) {
            values.push(normalIdConvert(valueTypeClass));
        }
    });
    return values;
};

export type EnumDeclaration = {
    value?: string;
    constant: string[];
};

export const enumDeclarationConvert = (
    target: EnumDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): EnumDeclaration => {
    const constant: string[] = [];
    const constantValue = target.getConstant();
    if (constantValue) {
        const constantTypeClass = toTypeClass(constantValue, isEnumConstantsType, errorClass);
        if (constantTypeClass) {
            constant.push(...enumConstantsConvert(constantTypeClass, errorClass));
        }
    }

    const enumDeclaration: EnumDeclaration = {
        constant: constant,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        enumDeclaration.value = normalIdConvert(valueTypeClass);
    }

    return enumDeclaration;
};

export type FieldDeclaration = {
    value: VariableDeclarator[];
    valueType: TypeRef;
};

export const fieldDeclarationConvert = (
    target: FieldDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): FieldDeclaration => {
    const value: VariableDeclarator[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);
    if (valueTypeClass) {
        value.push(...variableDeclaratorsConvert(valueTypeClass, errorClass));
    }

    const fieldDeclaration: FieldDeclaration = {
        value: value,
        valueType: {
            value: [],
        },
    };

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        fieldDeclaration.valueType.value = typeRef.value;
        if (typeRef.dimension) {
            fieldDeclaration.valueType.dimension = typeRef.dimension;
        }
    }

    return fieldDeclaration;
};

export type InterfaceDeclaration = {
    value?: string;
    body: InterfaceMethodDeclaration[];
    extend: TypeRef[];
};

export const interfaceDeclarationConvert = (
    target: InterfaceDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceDeclaration => {
    const body: InterfaceMethodDeclaration[] = [];
    const bodyTypeClass = toTypeClass(target.getBody(), isInterfaceBodyType, errorClass);
    if (bodyTypeClass) {
        body.push(...interfaceBodyConvert(bodyTypeClass, errorClass));
    }

    const extend: TypeRef[] = [];
    const extendValue = target.getExtend();
    if (extendValue) {
        const extendTypeClass = toTypeClass(extendValue, isTypeListType, errorClass);
        if (extendTypeClass) {
            extend.push(...typeListConvert(extendTypeClass, errorClass));
        }
    }

    const interfaceDeclaration: InterfaceDeclaration = {
        body: body,
        extend: extend,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        interfaceDeclaration.value = normalIdConvert(valueTypeClass);
    }
    return interfaceDeclaration;
};

export type InterfaceMethodDeclaration = {
    value?: string;
    valueType?: TypeRef | 'void';
    param: FormalParameter[];
    modifier: NormalModifier[];
};

export const interfaceMethodDeclarationConvert = (
    target: InterfaceMethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceMethodDeclaration => {
    const param: FormalParameter[] = [];
    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            param.push(...formalParametersConvert(paramTypeClass, errorClass));
        }
    }

    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    const interfaceMethodDeclaration: InterfaceMethodDeclaration = {
        param: param,
        modifier: modifiers,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        interfaceMethodDeclaration.value = normalIdConvert(valueTypeClass);
    }

    const valueType = target.getValueType();
    if (typeof valueType === 'string') {
        interfaceMethodDeclaration.valueType = valueType;
    } else {
        const valueTypeTypeClass = toTypeClass(valueType, isTypeRefType, errorClass);
        if (valueTypeTypeClass) {
            interfaceMethodDeclaration.valueType = typeRefConvert(valueTypeTypeClass, errorClass);
        }
    }

    return interfaceMethodDeclaration;
};

export type LocalVariableDeclaration = {
    value: VariableDeclarator[];
    valueType: TypeRef;
    modifier: NormalModifier[];
};

export const localVariableDeclarationConvert = (
    target: LocalVariableDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclaration => {
    const value: VariableDeclarator[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);
    if (valueTypeClass) {
        value.push(...variableDeclaratorsConvert(valueTypeClass, errorClass));
    }

    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    const localVariableDeclaration: LocalVariableDeclaration = {
        value: value,
        valueType: {
            value: [],
        },
        modifier: modifiers,
    };

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        localVariableDeclaration.valueType.value = typeRef.value;
        if (typeRef.dimension) {
            localVariableDeclaration.valueType.dimension = typeRef.dimension;
        }
    }

    return localVariableDeclaration;
};

export type MethodDeclaration = {
    value?: string;
    valueType?: TypeRef | 'void';
    param: FormalParameter[];
    block: NormalStatement[];
};

export const methodDeclarationConvert = (
    target: MethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MethodDeclaration => {
    const param: FormalParameter[] = [];
    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            param.push(...formalParametersConvert(paramTypeClass, errorClass));
        }
    }

    const block: NormalStatement[] = [];
    const blockValue = target.getBlock();
    if (blockValue) {
        const blockTypeClass = toTypeClass(blockValue, isNormalBlockType, errorClass);
        if (blockTypeClass) {
            block.push(...normalBlockConvert(blockTypeClass, errorClass));
        }
    }

    const methodDeclaration: MethodDeclaration = {
        param: param,
        block: block,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        methodDeclaration.value = normalIdConvert(valueTypeClass);
    }

    const valueType = target.getValueType();
    if (typeof valueType === 'string') {
        methodDeclaration.valueType = valueType;
    } else {
        const valueTypeTypeClass = toTypeClass(valueType, isTypeRefType, errorClass);
        if (valueTypeTypeClass) {
            methodDeclaration.valueType = typeRefConvert(valueTypeTypeClass, errorClass);
        }
    }

    return methodDeclaration;
};

export type PropertyDeclaration = {
    value?: string;
    valueType: TypeRef;
    block: PropertyBlock[];
};

export const propertyDeclarationConvert = (
    target: PropertyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyDeclaration => {
    const block: PropertyBlock[] = [];
    target.getBlock().forEach((item) => {
        const blockTypeClass = toTypeClass(item, isPropertyBlockType, errorClass);
        if (blockTypeClass) {
            block.push(propertyBlockConvert(blockTypeClass, errorClass));
        }
    });

    const propertyDeclaration: PropertyDeclaration = {
        valueType: {
            value: [],
        },
        block: block,
    };

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        propertyDeclaration.valueType.value = typeRef.value;
        if (typeRef.dimension) {
            propertyDeclaration.valueType.dimension = typeRef.dimension;
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        propertyDeclaration.value = normalIdConvert(valueTypeClass);
    }

    return propertyDeclaration;
};

export type TypeDeclaration =
    | {
          type: 'class';
          value: ClassDeclaration;
          modifier: NormalModifier[];
      }
    | {
          type: 'enum';
          value: EnumDeclaration;
          modifier: NormalModifier[];
      }
    | {
          type: 'interface';
          value: InterfaceDeclaration;
          modifier: NormalModifier[];
      };

export const typeDeclarationConvert = (
    target: TypeDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclaration | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass =>
            isClassDeclarationType(target) ||
            isEnumDeclarationType(target) ||
            isInterfaceDeclarationType(target),
        errorClass,
    );

    const modifiers: NormalModifier[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });

    let typeDeclaration: TypeDeclaration | undefined = undefined;

    if (valueTypeClass) {
        if (isClassDeclarationType(valueTypeClass)) {
            typeDeclaration = {
                type: 'class',
                value: {
                    body: [],
                    extend: {
                        value: [],
                    },
                    implement: [],
                },
                modifier: modifiers,
            };

            const value = classDeclarationConvert(valueTypeClass, errorClass);
            typeDeclaration.value.body.push(...value.body);
            typeDeclaration.value.extend.value.push(...value.extend.value);
            typeDeclaration.value.implement.push(...value.implement);
            if (value.value) {
                typeDeclaration.value.value = value.value;
            }
            if (value.extend.dimension) {
                typeDeclaration.value.extend.dimension = value.extend.dimension;
            }
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            typeDeclaration = {
                type: 'enum',
                value: {
                    constant: [],
                },
                modifier: modifiers,
            };
            const value = enumDeclarationConvert(valueTypeClass, errorClass);
            typeDeclaration.value.constant.push(...value.constant);
            if (value.value) {
                typeDeclaration.value.value = value.value;
            }
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            typeDeclaration = {
                type: 'interface',
                value: {
                    body: [],
                    extend: [],
                },
                modifier: modifiers,
            };

            const value = interfaceDeclarationConvert(valueTypeClass, errorClass);
            typeDeclaration.value.body.push(...value.body);
            typeDeclaration.value.extend.push(...value.extend);
            if (value.value) {
                typeDeclaration.value.value = value.value;
            }
        }
    }

    return typeDeclaration;
};
