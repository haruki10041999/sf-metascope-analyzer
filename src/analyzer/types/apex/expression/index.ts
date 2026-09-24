import { ApexParserBaseVisitor, ExpressionContext } from '@apexdevtools/apex-parser';

export type ExpressionField = {};

export class ExpressionVisitor extends ApexParserBaseVisitor<ExpressionField> {
    visitExpression(ctx: ExpressionContext) {
        // Implement your logic for visiting an expression here
        return super.visitExpression(ctx);
    }
}
