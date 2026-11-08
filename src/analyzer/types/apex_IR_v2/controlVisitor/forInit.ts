import { ForInitContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import {
    LocalVariableDeclarationTypeClass,
    DeclarationVisitor,
    isLocalVariableDeclarationType,
} from '../declarationVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ForInitTypeClass extends ControlTypeClass<
    'forInit',
    LocalVariableDeclarationTypeClass | ExpressionListTypeClass
> {
    private constructor(
        value: LocalVariableDeclarationTypeClass | ExpressionListTypeClass | ApexErrorTypeClass,
    ) {
        super('forInit', value);
    }

    static create(ctx: ForInitContext): ForInitTypeClass {
        if (!ctx.localVariableDeclaration() && !ctx.expressionList()) {
            throw new Error('値が異常です。ForInitContext: ' + ctx.getText());
        }

        return new ForInitTypeClass(
            ctx.localVariableDeclaration()
                ? visitNode(
                      new DeclarationVisitor(),
                      ctx.localVariableDeclaration(),
                      isLocalVariableDeclarationType,
                      'localVariableDeclaration',
                  )
                : visitNode(
                      new ListVisitor(),
                      ctx.expressionList(),
                      isExpressionListType,
                      'expressionList',
                  ),
        );
    }
}

export const isForInitType = (target: ApexCommonTypeClass<string>): target is ForInitTypeClass => {
    return target instanceof ForInitTypeClass;
};
