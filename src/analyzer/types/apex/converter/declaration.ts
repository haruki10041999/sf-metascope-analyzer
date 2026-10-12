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

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert } from './id';
import { qualifiedNameConvert } from './name';
import { TypeRefClass, typeRefConvert } from './type';
import { typeListConvert } from './list';
import { PropertyBlockClass, normalBlockConvert, propertyBlockConvert } from './block';
import { classBodyConvert, interfaceBodyConvert } from './body';
import { NormalModifierClass, normalModifierConvert } from './modifier';
import { FormalParameterClass, formalParametersConvert } from './parameter';
import { VariableDeclaratorClass, variableDeclaratorsConvert } from './variable';
import { NormalStatementClass } from './statement';

export abstract class DeclarationElementClass<TType, TDeclaration> extends CommonClass {
    private type: TType;
    private declaration: TDeclaration;

    constructor(type: TType, declaration: TDeclaration) {
        super();
        this.type = type;
        this.declaration = declaration;
    }

    getType(): TType {
        return this.type;
    }

    getDeclaration(): TDeclaration {
        return this.declaration;
    }
}

export const isDeclarationElementClass = (
    target: CommonClass,
): target is DeclarationElementClass<unknown, unknown> => {
    return isCommonClass(target, DeclarationElementClass);
};

export class MethodDeclarationElementClass extends DeclarationElementClass<
    'method',
    MethodDeclarationClass
> {
    constructor(declartion: MethodDeclarationClass) {
        super('method', declartion);
    }
}

export const isMethodDeclarationElementClass = (
    target: CommonClass,
): target is MethodDeclarationElementClass => {
    return isCommonClass(target, MethodDeclarationElementClass);
};

export class ConstructorDeclarationElementClass extends DeclarationElementClass<
    'constructor',
    ConstructorDeclarationClass
> {
    constructor(declartion: ConstructorDeclarationClass) {
        super('constructor', declartion);
    }
}

export const isConstructorDeclarationElementClass = (
    target: CommonClass,
): target is ConstructorDeclarationElementClass => {
    return isCommonClass(target, ConstructorDeclarationElementClass);
};

export class InterfaceDeclarationElementClass extends DeclarationElementClass<
    'interface',
    InterfaceDeclarationClass
> {
    constructor(declartion: InterfaceDeclarationClass) {
        super('interface', declartion);
    }
}

export const isInterfaceDeclarationElementClass = (
    target: CommonClass,
): target is InterfaceDeclarationElementClass => {
    return isCommonClass(target, InterfaceDeclarationElementClass);
};

export class ClassDeclarationElementClass extends DeclarationElementClass<
    'class',
    ClassDeclarationClass
> {
    constructor(declartion: ClassDeclarationClass) {
        super('class', declartion);
    }
}

export const isClassDeclarationElementClass = (
    target: CommonClass,
): target is ClassDeclarationElementClass => {
    return isCommonClass(target, ClassDeclarationElementClass);
};

export class EnumDeclarationElementClass extends DeclarationElementClass<
    'enum',
    EnumDeclarationClass
> {
    constructor(declartion: EnumDeclarationClass) {
        super('enum', declartion);
    }
}

export const isEnumDeclarationElementClass = (
    target: CommonClass,
): target is EnumDeclarationElementClass => {
    return isCommonClass(target, EnumDeclarationElementClass);
};

export class PropertyDeclarationElementClass extends DeclarationElementClass<
    'property',
    PropertyDeclarationClass
> {
    constructor(declartion: PropertyDeclarationClass) {
        super('property', declartion);
    }
}

export const isPropertyDeclarationElementClass = (
    target: CommonClass,
): target is PropertyDeclarationElementClass => {
    return isCommonClass(target, PropertyDeclarationElementClass);
};

export class FieldDeclarationElementClass extends DeclarationElementClass<
    'field',
    FieldDeclarationClass
> {
    constructor(declartion: FieldDeclarationClass) {
        super('field', declartion);
    }
}

export const isFieldDeclarationElementClass = (
    target: CommonClass,
): target is FieldDeclarationElementClass => {
    return isCommonClass(target, FieldDeclarationElementClass);
};

export class MemberDeclarationClass extends CommonClass {
    private value:
        | MethodDeclarationElementClass
        | ConstructorDeclarationElementClass
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | PropertyDeclarationElementClass
        | FieldDeclarationElementClass
        | null = null;

    setValue(
        value:
            | MethodDeclarationElementClass
            | ConstructorDeclarationElementClass
            | InterfaceDeclarationElementClass
            | ClassDeclarationElementClass
            | EnumDeclarationElementClass
            | PropertyDeclarationElementClass
            | FieldDeclarationElementClass
            | null,
    ) {
        this.value = value;
    }

    getValue():
        | MethodDeclarationElementClass
        | ConstructorDeclarationElementClass
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | PropertyDeclarationElementClass
        | FieldDeclarationElementClass
        | null {
        return this.value;
    }

    copy(commonClass: MemberDeclarationClass): void {
        this.setValue(commonClass.getValue());
    }
}

const memberDeclarationConvert = (
    target: MemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MemberDeclaration | null => {
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

    let memberDeclaration: MemberDeclaration | null = null;

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

export class AnonymousTriggerMemberDeclarationClass extends CommonClass {
    private value:
        | MethodDeclarationElementClass
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | PropertyDeclarationElementClass
        | FieldDeclarationElementClass
        | null = null;

    setValue(
        value:
            | MethodDeclarationElementClass
            | InterfaceDeclarationElementClass
            | ClassDeclarationElementClass
            | EnumDeclarationElementClass
            | PropertyDeclarationElementClass
            | FieldDeclarationElementClass
            | null,
    ) {
        this.value = value;
    }

    getValue():
        | MethodDeclarationElementClass
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | PropertyDeclarationElementClass
        | FieldDeclarationElementClass
        | null {
        return this.value;
    }

    copy(commonClass: AnonymousTriggerMemberDeclarationClass): void {
        this.setValue(commonClass.getValue());
    }
}

export const isAnonymousTriggerMemberDeclarationClass = (
    target: CommonClass,
): target is AnonymousTriggerMemberDeclarationClass => {
    return isCommonClass(target, AnonymousTriggerMemberDeclarationClass);
};

export const anonymousMemberDeclarationConvert = (
    target: AnonymousMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousMemberDeclaration | null => {
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

    let anonymousMemberDeclaration: AnonymousMemberDeclaration | null = null;

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

export const triggerMemberDeclarationConvert = (
    target: TriggerMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TriggerMemberDeclaration | null => {
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

    let triggerMemberDeclaration: TriggerMemberDeclaration | null = null;

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

export class ClassBodyDeclarationClass extends CommonClass {
    private value: MemberDeclarationClass | NormalStatement[] | null = null;
    private modifier: NormalModifier[] = [];
    private isStatic: boolean | null = null;

    setValue(value: MemberDeclarationClass | NormalStatement[] | null): void {
        this.value = value;
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    setIsStatic(isStatic: boolean | null): void {
        this.isStatic = isStatic;
    }

    getValue(): MemberDeclarationClass | NormalStatement[] | null {
        return this.value;
    }

    getModifier(): NormalModifier[] {
        return this.modifier;
    }

    getIsStatic(): boolean | null {
        return this.isStatic;
    }

    copy(commonClass: ClassBodyDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
        this.setIsStatic(commonClass.getIsStatic());
    }
}

export const isClassBodyDeclarationClass = (
    target: CommonClass,
): target is ClassBodyDeclarationClass => {
    return isCommonClass(target, ClassBodyDeclarationClass);
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

export class ClassDeclarationClass extends CommonClass {
    private value: string | null = null;
    private body: ClassBodyDeclarationClass[] = [];
    private extend: TypeRef | null = null;
    private implement: TypeRef[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetBody(): void {
        this.body = [];
    }

    setBody(body: ClassBodyDeclarationClass[]): void {
        this.body.push(...body);
    }

    setExtend(extend: TypeRef | null): void {
        this.extend = extend;
    }

    resetImplement() {
        this.implement = [];
    }

    setImpliment(impliment: TypeRef[]): void {
        this.implement.push(...impliment);
    }

    getValue(): string | null {
        return this.value;
    }

    getBody(): ClassBodyDeclarationClass[] {
        return this.body;
    }

    getExtend(): TypeRef | null {
        return this.extend;
    }

    getImplement(): TypeRef[] {
        return this.implement;
    }

    copy(commonClass: ClassDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.resetBody();
        this.setBody(commonClass.getBody());
        this.setExtend(commonClass.getExtend());
        this.resetImplement();
        this.setImpliment(commonClass.getImplement());
    }
}

export const isClassDeclarationClass = (target: CommonClass): target is ClassDeclarationClass => {
    return isCommonClass(target, ClassDeclarationClass);
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

export class ConstructorDeclarationClass extends CommonClass {
    private value: string[] = [];
    private param: FormalParameter[] = [];
    private block: NormalStatement[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameter[]): void {
        this.param.push(...param);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatement[]) {
        this.block.push(...block);
    }

    getValue(): string[] {
        return this.value;
    }

    getParam(): FormalParameter[] {
        return this.param;
    }

    getBlock(): NormalStatement[] {
        return this.block;
    }

    copy(commonClass: ConstructorDeclarationClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetParam();
        this.setParam(commonClass.getParam());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isConstructorDeclarationClass = (
    target: CommonClass,
): target is ConstructorDeclarationClass => {
    return isCommonClass(target, ConstructorDeclarationClass);
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

export class EnumDeclarationClass extends CommonClass {
    private value: string | null = null;
    private constant: string[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetConstant(): void {
        this.constant = [];
    }

    setConstant(constant: string[]) {
        this.constant.push(...constant);
    }

    getValue(): string | null {
        return this.value;
    }

    getConstant(): string[] {
        return this.constant;
    }

    copy(commonClass: EnumDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.resetConstant();
        this.setConstant(commonClass.getConstant());
    }
}

export const isEnumDeclarationClass = (target: CommonClass): target is EnumDeclarationClass => {
    return isCommonClass(target, EnumDeclarationClass);
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

export class FieldDeclarationClass extends CommonClass {
    private value: VariableDeclarator[] = [];
    private valueType: TypeRef | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: VariableDeclarator[]): void {
        value.push(...value);
    }

    setValueType(valueType: TypeRef | null): void {
        this.valueType = valueType;
    }

    getValue(): VariableDeclarator[] {
        return this.value;
    }

    getValueType(): TypeRef | null {
        return this.valueType;
    }

    copy(commonClass: FieldDeclarationClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isFieldDeclarationClass = (target: CommonClass): target is FieldDeclarationClass => {
    return isCommonClass(target, FieldDeclarationClass);
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

export class InterfaceDeclarationClass extends CommonClass {
    private value: string | null = null;
    private body: InterfaceMethodDeclarationClass[] = [];
    private extend: TypeRef[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetBody(): void {
        this.body = [];
    }

    setBody(body: InterfaceMethodDeclarationClass[]): void {
        this.body.push(...body);
    }

    resetExtend(): void {
        this.extend = [];
    }

    setExtend(extend: TypeRef[]) {
        this.extend.push(...extend);
    }

    getValue(): string | null {
        return this.value;
    }

    getBody(): InterfaceMethodDeclarationClass[] {
        return this.body;
    }

    getExtend(): TypeRef[] {
        return this.extend;
    }

    copy(commonClass: InterfaceDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.resetBody();
        this.setBody(commonClass.getBody());
        this.resetExtend();
        this.setExtend(commonClass.getExtend());
    }
}

export const isInterfaceDeclarationClass = (
    target: CommonClass,
): target is InterfaceDeclarationClass => {
    return isCommonClass(target, InterfaceDeclarationClass);
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

export class InterfaceMethodDeclarationClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRef | 'void' | null = null;
    private param: FormalParameter[] = [];
    private modifier: NormalModifier[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRef | 'void' | null): void {
        this.valueType = valueType;
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameter[]): void {
        this.param.push(...param);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifier[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRef | 'void' | null {
        return this.valueType;
    }

    getParam(): FormalParameter[] {
        return this.param;
    }

    getModifier(): NormalModifier[] {
        return this.modifier;
    }

    copy(commonClass: InterfaceMethodDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetParam();
        this.setParam(commonClass.getParam());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isInterfaceMethodDeclarationClass = (
    target: CommonClass,
): target is InterfaceMethodDeclarationClass => {
    return isCommonClass(target, InterfaceMethodDeclarationClass);
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

export class LocalVariableDeclarationClass extends CommonClass {
    private value: VariableDeclaratorClass[] = [];
    private valueType: TypeRefClass = new TypeRefClass();
    private modifier: NormalModifierClass[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: VariableDeclaratorClass[]): void {
        this.value.push(...value);
    }

    setValueType(valueType: TypeRefClass) {
        this.valueType.copy(valueType);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): VariableDeclaratorClass[] {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: LocalVariableDeclarationClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isLocalVariableDeclarationClass = (
    target: CommonClass,
): target is LocalVariableDeclarationClass => {
    return isCommonClass(target, LocalVariableDeclarationClass);
};

export const localVariableDeclarationConvert = (
    target: LocalVariableDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclarationClass => {
    const localVariableDeclaration = new LocalVariableDeclarationClass();

    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);
    if (valueTypeClass) {
        localVariableDeclaration.setValue(variableDeclaratorsConvert(valueTypeClass, errorClass));
    }

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            const modifier = normalModifierConvert(modifierTypeClass, errorClass);
            if (modifier) {
                modifiers.push(modifier);
            }
        }
    });
    localVariableDeclaration.setModifier(modifiers);

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        localVariableDeclaration.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    return localVariableDeclaration;
};

export class MethodDeclarationClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRef | 'void' | null = null;
    private param: FormalParameter[] = [];
    private block: NormalStatement[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRef | 'void' | null): void {
        this.valueType = valueType;
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameter[]): void {
        this.param.push(...param);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatement[]): void {
        this.block.push(...block);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRef | 'void' | null {
        return this.valueType;
    }

    getParam(): FormalParameter[] {
        return this.param;
    }

    getBlock(): NormalStatement[] {
        return this.block;
    }

    copy(commonClass: MethodDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetParam();
        this.setParam(commonClass.getParam());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isMethodDeclarationClass = (target: CommonClass): target is MethodDeclarationClass => {
    return isCommonClass(target, MethodDeclarationClass);
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

export class PropertyDeclarationClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRef | null = null;
    private block: PropertyBlock[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRef | null): void {
        this.valueType = valueType;
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: PropertyBlock[]): void {
        this.block.push(...block);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRef | null {
        return this.valueType;
    }

    getBlock(): PropertyBlock[] {
        return this.block;
    }

    copy(commonClass: PropertyDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isPropertyDeclarationClass = (
    target: CommonClass,
): target is PropertyDeclarationClass => {
    return isCommonClass(target, PropertyDeclarationClass);
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

export class TypeDeclarationClass extends CommonClass {
    private value:
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | null = null;

    setValue(
        value:
            | InterfaceDeclarationElementClass
            | ClassDeclarationElementClass
            | EnumDeclarationElementClass
            | null,
    ): void {
        this.value = value;
    }

    getValue():
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | null {
        return this.value;
    }

    copy(commonClass: TypeDeclarationClass): void {
        this.setValue(commonClass.getValue());
    }
}

export const isTypeDeclarationClass = (target: CommonClass): target is TypeDeclarationClass => {
    return isCommonClass(target, TypeDeclarationClass);
};

export const typeDeclarationConvert = (
    target: TypeDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclaration | null => {
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

    let typeDeclaration: TypeDeclaration | null = null;

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
