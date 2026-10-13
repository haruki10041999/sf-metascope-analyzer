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
import { isTypeRefClass, TypeRefClass, typeRefConvert } from './type';
import { typeListConvert } from './list';
import { PropertyBlockClass, normalBlockConvert, propertyBlockConvert } from './block';
import { classBodyConvert, interfaceBodyConvert } from './body';
import { NormalModifierClass, normalModifierConvert } from './modifier';
import { FormalParameterClass, formalParametersConvert } from './parameter';
import { VariableDeclaratorClass, variableDeclaratorsConvert } from './variable';
import { isNormalStatementClassArray, NormalStatementClass } from './statement';

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

export const isMemberDeclarationClass = (target: any): target is MemberDeclarationClass => {
    return isCommonClass(target, MemberDeclarationClass);
};

export const isMemberDeclarationClassArray = (target: any): target is MemberDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isMemberDeclarationClass(t));
};

const memberDeclarationConvert = (
    target: MemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MemberDeclarationClass => {
    const memberDeclaration = new MemberDeclarationClass();

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

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new MethodDeclarationElementClass(
                    methodDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isConstructorDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new ConstructorDeclarationElementClass(
                    constructorDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new InterfaceDeclarationElementClass(
                    interfaceDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isClassDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new ClassDeclarationElementClass(
                    classDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new EnumDeclarationElementClass(enumDeclarationConvert(valueTypeClass, errorClass)),
            );
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new PropertyDeclarationElementClass(
                    propertyDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            memberDeclaration.setValue(
                new FieldDeclarationElementClass(
                    fieldDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
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
    target: any,
): target is AnonymousTriggerMemberDeclarationClass => {
    return isCommonClass(target, AnonymousTriggerMemberDeclarationClass);
};

export const isAnonymousTriggerMemberDeclarationClassArray = (
    target: any,
): target is AnonymousTriggerMemberDeclarationClass[] => {
    return (
        Array.isArray(target) && target.every((t) => isAnonymousTriggerMemberDeclarationClass(t))
    );
};

export const anonymousMemberDeclarationConvert = (
    target: AnonymousMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerMemberDeclarationClass => {
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

    const anonymousMemberDeclaration = new AnonymousTriggerMemberDeclarationClass();

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new MethodDeclarationElementClass(
                    methodDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new InterfaceDeclarationElementClass(
                    interfaceDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isClassDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new ClassDeclarationElementClass(
                    classDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new EnumDeclarationElementClass(enumDeclarationConvert(valueTypeClass, errorClass)),
            );
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new PropertyDeclarationElementClass(
                    propertyDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            anonymousMemberDeclaration.setValue(
                new FieldDeclarationElementClass(
                    fieldDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
    }

    return anonymousMemberDeclaration;
};

export const triggerMemberDeclarationConvert = (
    target: TriggerMemberDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): AnonymousTriggerMemberDeclarationClass => {
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

    const triggerMemberDeclaration = new AnonymousTriggerMemberDeclarationClass();

    if (valueTypeClass) {
        if (isMethodDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new MethodDeclarationElementClass(
                    methodDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new InterfaceDeclarationElementClass(
                    interfaceDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isClassDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new ClassDeclarationElementClass(
                    classDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new EnumDeclarationElementClass(enumDeclarationConvert(valueTypeClass, errorClass)),
            );
        }
        if (isPropertyDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new PropertyDeclarationElementClass(
                    propertyDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isFieldDeclarationType(valueTypeClass)) {
            triggerMemberDeclaration.setValue(
                new FieldDeclarationElementClass(
                    fieldDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
    }

    return triggerMemberDeclaration;
};

export class ClassBodyDeclarationClass extends CommonClass {
    private value: MemberDeclarationClass | NormalStatementClass[] | null = null;
    private modifier: NormalModifierClass[] = [];
    private isStatic: boolean | null = null;

    setValue(value: MemberDeclarationClass | NormalStatementClass[] | null): void {
        if (isMemberDeclarationClass(this.value) && isMemberDeclarationClass(value)) {
            this.value.copy(value);
        } else if (isNormalStatementClassArray(this.value) && isNormalStatementClassArray(value)) {
            this.value.push(...value);
        } else {
            this.value = value;
        }
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    setIsStatic(isStatic: boolean | null): void {
        this.isStatic = isStatic;
    }

    getValue(): MemberDeclarationClass | NormalStatementClass[] | null {
        return this.value;
    }

    getModifier(): NormalModifierClass[] {
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

export const isClassBodyDeclarationClass = (target: any): target is ClassBodyDeclarationClass => {
    return isCommonClass(target, ClassBodyDeclarationClass);
};

export const isClassBodyDeclarationClassArray = (
    target: any,
): target is ClassBodyDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isClassBodyDeclarationClass(t));
};

export const classBodyDeclarationConvert = (
    target: ClassBodyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassBodyDeclarationClass => {
    const classBodyDeclaration = new ClassBodyDeclarationClass();

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const modifierTypeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (modifierTypeClass) {
            modifiers.push(normalModifierConvert(modifierTypeClass, errorClass));
        }
    });
    classBodyDeclaration.setModifier(modifiers);

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
                classBodyDeclaration.setValue(memberDeclarationConvert(valueTypeClass, errorClass));
            }
            if (isNormalBlockType(valueTypeClass)) {
                classBodyDeclaration.setValue(normalBlockConvert(valueTypeClass, errorClass));
            }
        }

        const isStatic: boolean = target.getIsStatic();
        if (valueValue && isNormalBlockType(valueValue)) {
            classBodyDeclaration.setIsStatic(isStatic);
        }
    }

    return classBodyDeclaration;
};

export class ClassDeclarationClass extends CommonClass {
    private value: string | null = null;
    private body: ClassBodyDeclarationClass[] = [];
    private extend: TypeRefClass = new TypeRefClass();
    private implement: TypeRefClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetBody(): void {
        this.body = [];
    }

    setBody(body: ClassBodyDeclarationClass[]): void {
        this.body.push(...body);
    }

    setExtend(extend: TypeRefClass): void {
        this.extend.copy(extend);
    }

    resetImplement() {
        this.implement = [];
    }

    setImpliment(impliment: TypeRefClass[]): void {
        this.implement.push(...impliment);
    }

    getValue(): string | null {
        return this.value;
    }

    getBody(): ClassBodyDeclarationClass[] {
        return this.body;
    }

    getExtend(): TypeRefClass {
        return this.extend;
    }

    getImplement(): TypeRefClass[] {
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

export const isClassDeclarationClass = (target: any): target is ClassDeclarationClass => {
    return isCommonClass(target, ClassDeclarationClass);
};

export const isClassDeclarationClassArray = (target: any): target is ClassDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isClassDeclarationClass(t));
};

export const classDeclarationConvert = (
    target: ClassDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ClassDeclarationClass => {
    const classDeclaration = new ClassDeclarationClass();

    const body: ClassBodyDeclarationClass[] = [];
    const bodyTypeClass = toTypeClass(target.getBody(), isClassBodyType, errorClass);
    if (bodyTypeClass) {
        body.push(...classBodyConvert(bodyTypeClass, errorClass));
    }
    classDeclaration.setBody(body);

    const implementValue = target.getImplement();
    if (implementValue) {
        const implementTypeClass = toTypeClass(implementValue, isTypeListType, errorClass);
        if (implementTypeClass) {
            classDeclaration.setImpliment(typeListConvert(implementTypeClass, errorClass));
        }
    }

    const extendValue = target.getExtend();
    if (extendValue) {
        const extendTypeClass = toTypeClass(extendValue, isTypeRefType, errorClass);
        if (extendTypeClass) {
            classDeclaration.setExtend(typeRefConvert(extendTypeClass, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        classDeclaration.setValue(normalIdConvert(valueTypeClass));
    }

    return classDeclaration;
};

export class ConstructorDeclarationClass extends CommonClass {
    private value: string[] = [];
    private param: FormalParameterClass[] = [];
    private block: NormalStatementClass[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameterClass[]): void {
        this.param.push(...param);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]) {
        this.block.push(...block);
    }

    getValue(): string[] {
        return this.value;
    }

    getParam(): FormalParameterClass[] {
        return this.param;
    }

    getBlock(): NormalStatementClass[] {
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
    target: any,
): target is ConstructorDeclarationClass => {
    return isCommonClass(target, ConstructorDeclarationClass);
};

export const isConstructorDeclarationClassArray = (
    target: any,
): target is ConstructorDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isConstructorDeclarationClass(t));
};

export const constructorDeclarationConvert = (
    target: ConstructorDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): ConstructorDeclarationClass => {
    const constructorDeclaration = new ConstructorDeclarationClass();

    const valueTypeClass = toTypeClass(target.getValue(), isQualifiedNameType, errorClass);
    if (valueTypeClass) {
        constructorDeclaration.setValue(qualifiedNameConvert(valueTypeClass, errorClass));
    }

    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            constructorDeclaration.setParam(formalParametersConvert(paramTypeClass, errorClass));
        }
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        constructorDeclaration.setBlock(normalBlockConvert(blockTypeClass, errorClass));
    }

    return constructorDeclaration;
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

export const isEnumDeclarationClass = (target: any): target is EnumDeclarationClass => {
    return isCommonClass(target, EnumDeclarationClass);
};

export const isEnumDeclarationClassArray = (target: any): target is EnumDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isEnumDeclarationClass(t));
};

export const enumDeclarationConvert = (
    target: EnumDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): EnumDeclarationClass => {
    const enumDeclaration = new EnumDeclarationClass();

    const constantValue = target.getConstant();
    if (constantValue) {
        const constantTypeClass = toTypeClass(constantValue, isEnumConstantsType, errorClass);
        if (constantTypeClass) {
            enumDeclaration.setConstant(enumConstantsConvert(constantTypeClass, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        enumDeclaration.setValue(normalIdConvert(valueTypeClass));
    }

    return enumDeclaration;
};

export class FieldDeclarationClass extends CommonClass {
    private value: VariableDeclaratorClass[] = [];
    private valueType: TypeRefClass = new TypeRefClass();

    resetValue(): void {
        this.value = [];
    }

    setValue(value: VariableDeclaratorClass[]): void {
        this.value.push(...value);
    }

    setValueType(valueType: TypeRefClass): void {
        this.valueType.copy(valueType);
    }

    getValue(): VariableDeclaratorClass[] {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    copy(commonClass: FieldDeclarationClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isFieldDeclarationClass = (target: any): target is FieldDeclarationClass => {
    return isCommonClass(target, FieldDeclarationClass);
};

export const isFieldDeclarationClassArray = (target: any): target is FieldDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isFieldDeclarationClass(t));
};

export const fieldDeclarationConvert = (
    target: FieldDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): FieldDeclarationClass => {
    const fieldDeclaration = new FieldDeclarationClass();

    const valueTypeClass = toTypeClass(target.getValue(), isVariableDeclaratorsType, errorClass);
    if (valueTypeClass) {
        fieldDeclaration.setValue(variableDeclaratorsConvert(valueTypeClass, errorClass));
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        fieldDeclaration.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    return fieldDeclaration;
};

export class InterfaceDeclarationClass extends CommonClass {
    private value: string | null = null;
    private body: InterfaceMethodDeclarationClass[] = [];
    private extend: TypeRefClass[] = [];

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

    setExtend(extend: TypeRefClass[]) {
        this.extend.push(...extend);
    }

    getValue(): string | null {
        return this.value;
    }

    getBody(): InterfaceMethodDeclarationClass[] {
        return this.body;
    }

    getExtend(): TypeRefClass[] {
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

export const isInterfaceDeclarationClassArray = (
    target: CommonClass,
): target is InterfaceDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isInterfaceDeclarationClass(t));
};

export const interfaceDeclarationConvert = (
    target: InterfaceDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceDeclarationClass => {
    const interfaceDeclaration = new InterfaceDeclarationClass();

    const bodyTypeClass = toTypeClass(target.getBody(), isInterfaceBodyType, errorClass);
    if (bodyTypeClass) {
        interfaceDeclaration.setBody(interfaceBodyConvert(bodyTypeClass, errorClass));
    }

    const extendValue = target.getExtend();
    if (extendValue) {
        const extendTypeClass = toTypeClass(extendValue, isTypeListType, errorClass);
        if (extendTypeClass) {
            interfaceDeclaration.setExtend(typeListConvert(extendTypeClass, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        interfaceDeclaration.setValue(normalIdConvert(valueTypeClass));
    }
    return interfaceDeclaration;
};

export class InterfaceMethodDeclarationClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRefClass | 'void' | null = null;
    private param: FormalParameterClass[] = [];
    private modifier: NormalModifierClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRefClass | 'void' | null): void {
        if (isTypeRefClass(this.valueType) && isTypeRefClass(valueType)) {
            this.valueType.copy(valueType);
        } else {
            this.valueType = valueType;
        }
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameterClass[]): void {
        this.param.push(...param);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRefClass | 'void' | null {
        return this.valueType;
    }

    getParam(): FormalParameterClass[] {
        return this.param;
    }

    getModifier(): NormalModifierClass[] {
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
    target: any,
): target is InterfaceMethodDeclarationClass => {
    return isCommonClass(target, InterfaceMethodDeclarationClass);
};

export const isInterfaceMethodDeclarationClassArray = (
    target: any,
): target is InterfaceMethodDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isInterfaceMethodDeclarationClass(t));
};

export const interfaceMethodDeclarationConvert = (
    target: InterfaceMethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): InterfaceMethodDeclarationClass => {
    const interfaceMethodDeclaration = new InterfaceMethodDeclarationClass();

    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            interfaceMethodDeclaration.setParam(
                formalParametersConvert(paramTypeClass, errorClass),
            );
        }
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
    interfaceMethodDeclaration.setModifier(modifiers);

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        interfaceMethodDeclaration.setValue(normalIdConvert(valueTypeClass));
    }

    const valueType = target.getValueType();
    if (typeof valueType === 'string') {
        interfaceMethodDeclaration.setValueType(valueType);
    } else {
        const valueTypeTypeClass = toTypeClass(valueType, isTypeRefType, errorClass);
        if (valueTypeTypeClass) {
            interfaceMethodDeclaration.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
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
    target: any,
): target is LocalVariableDeclarationClass => {
    return isCommonClass(target, LocalVariableDeclarationClass);
};

export const isLocalVariableDeclarationClassArray = (
    target: any,
): target is LocalVariableDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isLocalVariableDeclarationClass(t));
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
    private valueType: TypeRefClass | 'void' | null = null;
    private param: FormalParameterClass[] = [];
    private block: NormalStatementClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRefClass | 'void' | null): void {
        if (isTypeRefClass(this.valueType) && isTypeRefClass(valueType)) {
            this.valueType.copy(valueType);
        } else {
            this.valueType = valueType;
        }
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: FormalParameterClass[]): void {
        this.param.push(...param);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]): void {
        this.block.push(...block);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRefClass | 'void' | null {
        return this.valueType;
    }

    getParam(): FormalParameterClass[] {
        return this.param;
    }

    getBlock(): NormalStatementClass[] {
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

export const isMethodDeclarationClass = (target: any): target is MethodDeclarationClass => {
    return isCommonClass(target, MethodDeclarationClass);
};

export const isMethodDeclarationClassArray = (target: any): target is MethodDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isMethodDeclarationClass(t));
};

export const methodDeclarationConvert = (
    target: MethodDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): MethodDeclarationClass => {
    const methodDeclaration = new MethodDeclarationClass();

    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(paramValue, isFormalParametersType, errorClass);
        if (paramTypeClass) {
            methodDeclaration.setParam(formalParametersConvert(paramTypeClass, errorClass));
        }
    }

    const blockValue = target.getBlock();
    if (blockValue) {
        const blockTypeClass = toTypeClass(blockValue, isNormalBlockType, errorClass);
        if (blockTypeClass) {
            methodDeclaration.setBlock(normalBlockConvert(blockTypeClass, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        methodDeclaration.setValue(normalIdConvert(valueTypeClass));
    }

    const valueType = target.getValueType();
    if (typeof valueType === 'string') {
        methodDeclaration.setValueType(valueType);
    } else {
        const valueTypeTypeClass = toTypeClass(valueType, isTypeRefType, errorClass);
        if (valueTypeTypeClass) {
            methodDeclaration.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
        }
    }

    return methodDeclaration;
};

export class PropertyDeclarationClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRefClass = new TypeRefClass();
    private block: PropertyBlockClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRefClass): void {
        this.valueType.copy(valueType);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: PropertyBlockClass[]): void {
        this.block.push(...block);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    getBlock(): PropertyBlockClass[] {
        return this.block;
    }

    copy(commonClass: PropertyDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isPropertyDeclarationClass = (target: any): target is PropertyDeclarationClass => {
    return isCommonClass(target, PropertyDeclarationClass);
};

export const isPropertyDeclarationClassArray = (
    target: any,
): target is PropertyDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isPropertyDeclarationClass(t));
};

export const propertyDeclarationConvert = (
    target: PropertyDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): PropertyDeclarationClass => {
    const propertyDeclaration = new PropertyDeclarationClass();

    const block: PropertyBlockClass[] = [];
    target.getBlock().forEach((item) => {
        const blockTypeClass = toTypeClass(item, isPropertyBlockType, errorClass);
        if (blockTypeClass) {
            block.push(propertyBlockConvert(blockTypeClass, errorClass));
        }
    });
    propertyDeclaration.setBlock(block);

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        propertyDeclaration.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        propertyDeclaration.setValue(normalIdConvert(valueTypeClass));
    }

    return propertyDeclaration;
};

export class TypeDeclarationClass extends CommonClass {
    private value:
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | null = null;
    private modifier: NormalModifierClass[] = [];

    setValue(
        value:
            | InterfaceDeclarationElementClass
            | ClassDeclarationElementClass
            | EnumDeclarationElementClass
            | null,
    ): void {
        this.value = value;
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue():
        | InterfaceDeclarationElementClass
        | ClassDeclarationElementClass
        | EnumDeclarationElementClass
        | null {
        return this.value;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: TypeDeclarationClass): void {
        this.setValue(commonClass.getValue());
        this.setModifier(commonClass.getModifier());
    }
}

export const isTypeDeclarationClass = (target: any): target is TypeDeclarationClass => {
    return isCommonClass(target, TypeDeclarationClass);
};

export const isTypeDeclarationClassArray = (target: any): target is TypeDeclarationClass[] => {
    return Array.isArray(target) && target.every((t) => isTypeDeclarationClass(t));
};

export const typeDeclarationConvert = (
    target: TypeDeclarationTypeClass,
    errorClass: ErrorTypeClass[],
): TypeDeclarationClass => {
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

    const typeDeclaration = new TypeDeclarationClass();
    typeDeclaration.setModifier(modifiers);

    if (valueTypeClass) {
        if (isClassDeclarationType(valueTypeClass)) {
            typeDeclaration.setValue(
                new ClassDeclarationElementClass(
                    classDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isEnumDeclarationType(valueTypeClass)) {
            typeDeclaration.setValue(
                new EnumDeclarationElementClass(enumDeclarationConvert(valueTypeClass, errorClass)),
            );
        }
        if (isInterfaceDeclarationType(valueTypeClass)) {
            typeDeclaration.setValue(
                new InterfaceDeclarationElementClass(
                    interfaceDeclarationConvert(valueTypeClass, errorClass),
                ),
            );
        }
    }

    return typeDeclaration;
};
