import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

export type ErrorType = {
    type: 'AnalyzerError';
    contextType: string;
    context: string;
    errorMessage: string;
};

export class CommonVisitor<T> extends ApexParserBaseVisitor<T | ErrorType> {
    override visit(ctx: ApexParserRuleContext): T | ErrorType {
        try {
            return super.visit(ctx);
        } catch (error) {
            return {
                type: 'AnalyzerError',
                contextType: ctx.constructor.name,
                context: ctx.getText(),
                errorMessage: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
