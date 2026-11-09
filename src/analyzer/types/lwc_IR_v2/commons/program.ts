import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isProgram, type Program } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { DirectiveTypeClass } from '../standardizedVisitor/directive';
import { InterpreterDirectiveTypeClass } from '../standardizedVisitor/interpreterDirective';
import { statementVisitorEvaluatePairs, type StatementTypeClass } from '../statementVisitor';

export type ProgramFields = TypeField<'program'> & {
    sourceType: Program['sourceType'];
    interpreter: InterpreterDirectiveTypeClass | null;
    directives: DirectiveTypeClass[];
    body: StatementTypeClass[];
};

export class ProgramTypeClass extends LwcCommonTypeClass<'program', ProgramFields> {
    private constructor(value: FieldsOf<ProgramFields>, sourceSpan: SourceSpan) {
        super('program', value, sourceSpan);
    }

    static create(target: Program, originalSource: string): ProgramTypeClass {
        return new ProgramTypeClass(
            {
                sourceType: target.sourceType,
                interpreter:
                    target.interpreter == null
                        ? null
                        : InterpreterDirectiveTypeClass.create(target.interpreter, originalSource),
                directives: target.directives.map((child) =>
                    DirectiveTypeClass.create(child, originalSource),
                ),
                body: visitNodeList(
                    target.body,
                    originalSource,
                    statementVisitorEvaluatePairs(),
                    'StatementVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getSourceType(): ProgramFields['sourceType'] {
        return this.getFields().sourceType;
    }

    getInterpreter(): ProgramFields['interpreter'] {
        return this.getFields().interpreter;
    }

    getDirectives(): ProgramFields['directives'] {
        return this.getFields().directives;
    }

    getBody(): ProgramFields['body'] {
        return this.getFields().body;
    }
}

export const programTypePair: EvaluatePair<Program, ProgramTypeClass> = makeEvaluatePair(
    isProgram,
    (target, originalSource) => ProgramTypeClass.create(target, originalSource),
);

export const isProgramType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ProgramTypeClass => target instanceof ProgramTypeClass;
