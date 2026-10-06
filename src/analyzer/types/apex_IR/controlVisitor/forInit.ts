import { ForInitContext } from '@apexdevtools/apex-parser';

import { ControlTypeClass } from '.';

import {
    LocalVariableDeclarationTypeClass,
    DeclarationVisitor,
    isLocalVariableDeclarationType,
} from '../declarationVisitor';
import { ExpressionListTypeClass, ListVisitor, isExpressionListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ForInitTypeClass extends ControlTypeClass<
    LocalVariableDeclarationTypeClass | ExpressionListTypeClass
> {
    private constructor(
        value: LocalVariableDeclarationTypeClass | ExpressionListTypeClass | ErrorTypeClass,
    ) {
        super('forInit', value);
    }

    static create(ctx: ForInitContext): ForInitTypeClass {
        if (!ctx.localVariableDeclaration() && !ctx.expressionList()) {
            throw new Error('値が異常です。ForInitContext: ' + ctx.getText());
        }

        return new ForInitTypeClass(
            ctx.localVariableDeclaration()
                ? isValidClass(
                      new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
                      isLocalVariableDeclarationType,
                      'localVariableDeclaration',
                  )
                : isValidClass(
                      new ListVisitor().visit(ctx.expressionList()),
                      isExpressionListType,
                      'expressionList',
                  ),
        );
    }
}

export const isForInitType = (target: CommonTypeClass): target is ForInitTypeClass => {
    return target instanceof ForInitTypeClass;
};
