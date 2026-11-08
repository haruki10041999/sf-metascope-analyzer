import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { VariableDeclaratorTypeClass } from '../../apex_IR/variableVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type VariableDeclaratorsType = TypeField<'variableDeclarators'> & {
    element: VariableDeclaratorTypeClass[];
};

export class VariableDeclaratorsTypeClass extends ApexCommonTypeClass<
    'variableDeclarators',
    VariableDeclaratorsType
> {
    private constructor(element: VariableDeclaratorTypeClass[], sourceSpan: SourceSpan) {
        super('variableDeclarators', { element: element }, sourceSpan);
    }

    static create(ctx: VariableDeclaratorsContext) {
        return new VariableDeclaratorsTypeClass(
            ctx.variableDeclarator_list().map((v) => VariableDeclaratorTypeClass.create(v)),
            getSourceSpan(ctx),
        );
    }

    getElement(): VariableDeclaratorsType['element'] {
        return this.getFields().element;
    }
}

export const isVariableDeclaratorsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclaratorsTypeClass => {
    return isSpicifyApexCommonTypeClass('variableDeclarators', target);
};
