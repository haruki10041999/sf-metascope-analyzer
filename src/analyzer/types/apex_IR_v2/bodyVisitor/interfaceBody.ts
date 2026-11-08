import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import {
    InterfaceMethodDeclarationTypeClass,
    DeclarationVisitor,
    isInterfaceMethodDeclarationType,
} from '../declarationVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type InterfaceBodyType = TypeField<'interfaceBody'> & {
    declaration: InterfaceMethodDeclarationTypeClass[];
};

export class InterfaceBodyTypeClass extends ApexCommonTypeClass<
    'interfaceBody',
    InterfaceBodyType
> {
    private constructor(
        declaration: InterfaceMethodDeclarationTypeClass[],
        sourceSpan: SourceSpan,
    ) {
        super('interfaceBody', { declaration: declaration }, sourceSpan);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
        return new InterfaceBodyTypeClass(
            ctx
                .interfaceMethodDeclaration_list()
                .map((d) => InterfaceMethodDeclarationTypeClass.create(d)),
            getSourceSpan(ctx),
        );
    }
}

export const isInterfaceBodyType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InterfaceBodyTypeClass => {
    return isSpicifyApexCommonTypeClass('interfaceBody', target);
};
