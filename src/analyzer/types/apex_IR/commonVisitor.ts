import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

export class CommonTypeClass {
    private type: string = '';

    constructor(type: string) {
        this.type = type;
    }

    getType(): string {
        return this.type;
    }
}

export class ErrorTypeClass extends CommonTypeClass {
    private contextType: string = '';
    private context: string = '';
    private errorMessage: string = '';

    private constructor(contextType: string, context: string, errorMessage: string) {
        super('AnalyzerError');
        this.contextType = contextType;
        this.context = context;
        this.errorMessage = errorMessage;
    }

    static create(contextType: string, context: string, errorMessage: string): ErrorTypeClass {
        return new ErrorTypeClass(contextType, context, errorMessage);
    }

    getContextType(): string {
        return this.contextType;
    }

    getContext(): string {
        return this.context;
    }

    getParseErrorMessage(): string {
        return this.errorMessage;
    }
}

export const isErrorTypeClass = (target: CommonTypeClass): target is ErrorTypeClass => {
    return target instanceof ErrorTypeClass;
};

export class ContextTypeClass extends CommonTypeClass {
    private errorClasses: ErrorTypeClass[] = [];

    constructor(type: string, errorClasses: ErrorTypeClass[]) {
        super(type);
        this.errorClasses = errorClasses;
    }

    getErrorClasses(): ErrorTypeClass[] {
        return this.errorClasses;
    }
}

export class CommonVisitor<T> extends ApexParserBaseVisitor<T | ErrorTypeClass> {
    override visit(ctx: ApexParserRuleContext) {
        try {
            return super.visit(ctx);
        } catch (error) {
            return ErrorTypeClass.create(
                ctx.constructor.name,
                ctx.getText(),
                error instanceof Error ? error.message : String(error),
            );
        }
    }
}
