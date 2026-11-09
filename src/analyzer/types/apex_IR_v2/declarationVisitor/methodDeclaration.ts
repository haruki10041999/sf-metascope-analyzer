import { MethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { BlockTypeClass } from '../blockVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import { FormalParametersTypeClass } from '../parameterVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type MethodDeclarationType = TypeField<'methodDeclaration'> & {
    returnType: TypeRefTypeClass | 'void';
    name: IdTypeClass;
    parameters: FormalParametersTypeClass;
    /** abstract メソッドは本体を持たない（`void run();`）ので null */
    block: BlockTypeClass | null;
};

export class MethodDeclarationTypeClass extends ApexCommonTypeClass<
    'methodDeclaration',
    MethodDeclarationType
> {
    private constructor(fields: FieldsOf<MethodDeclarationType>, sourceSpan: SourceSpan) {
        super('methodDeclaration', fields, sourceSpan);
    }

    static create(ctx: MethodDeclarationContext): MethodDeclarationTypeClass {
        return new MethodDeclarationTypeClass(
            {
                returnType: ctx.VOID()
                    ? 'void'
                    : createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                parameters: createNode(
                    ctx.formalParameters(),
                    (c) => FormalParametersTypeClass.create(c),
                    'formalParameters',
                ),
                block: createOptionalNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            },
            getSourceSpan(ctx),
        );
    }

    getReturnType(): MethodDeclarationType['returnType'] {
        return this.getFields().returnType;
    }

    getName(): MethodDeclarationType['name'] {
        return this.getFields().name;
    }

    getParameters(): MethodDeclarationType['parameters'] {
        return this.getFields().parameters;
    }

    getBlock(): MethodDeclarationType['block'] {
        return this.getFields().block;
    }
}

export const isMethodDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MethodDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('methodDeclaration', target);
};
