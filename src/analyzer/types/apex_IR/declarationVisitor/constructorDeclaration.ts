import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    FormalParametersTypeClass,
    ParameterVisitor,
    isFormalParametersType,
} from '../parameterVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ConstructorDeclarationTypeClass extends DeclarationTypeClass<QualifiedNameTypeClass> {
    private param: FormalParametersTypeClass | null = null;
    private block: NormalBlockTypeClass | null = null;

    private constructor(
        value: QualifiedNameTypeClass | null,
        param: FormalParametersTypeClass | null,
        block: NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('constructorDeclaration', value, errorClasses);
        this.param = param;
        this.block = block;
    }

    static create(ctx: ConstructorDeclarationContext): ConstructorDeclarationTypeClass {
        if (!ctx.qualifiedName() || !ctx.block()) {
            throw new Error('値が異常です。ConstructorDeclarationContext: ' + ctx.getText());
        }

        let value: QualifiedNameTypeClass | null = null;
        let param: FormalParametersTypeClass | null = null;
        let block: NormalBlockTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const nameTypeClass = new NameVisitor().visit(ctx.qualifiedName());
        if (isQualifiedNameType(nameTypeClass)) {
            value = nameTypeClass;
        } else if (isErrorType(nameTypeClass)) {
            errorClasses['value'] = nameTypeClass;
        }

        if (ctx.formalParameters()) {
            const parameterTypeClass = new ParameterVisitor().visit(ctx.formalParameters());
            if (isFormalParametersType(parameterTypeClass)) {
                param = parameterTypeClass;
            } else if (isErrorType(parameterTypeClass)) {
                errorClasses['param'] = parameterTypeClass;
            }
        }

        const blockTypeClass = new BlockVisitor().visit(ctx.block());
        if (isNormalBlockType(blockTypeClass)) {
            block = blockTypeClass;
        } else if (isErrorType(blockTypeClass)) {
            errorClasses['block'] = blockTypeClass;
        }

        return new ConstructorDeclarationTypeClass(value, param, block, errorClasses);
    }

    getParam(): FormalParametersTypeClass | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }

    getBlock(): NormalBlockTypeClass | null {
        return this.block;
    }

    isBlockNull(): boolean {
        return this.block === null;
    }
}

export const isConstructorDeclarationType = (
    target: CommonTypeClass,
): target is ConstructorDeclarationTypeClass => {
    return target instanceof ConstructorDeclarationTypeClass;
};
