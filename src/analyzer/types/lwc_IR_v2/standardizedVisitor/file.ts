import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isFile, type File } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ProgramTypeClass } from '../commons/program';

export type FileFields = TypeField<'file'> & {
    program: ProgramTypeClass;
};

export class FileTypeClass extends LwcCommonTypeClass<'file', FileFields> {
    private constructor(value: FieldsOf<FileFields>, sourceSpan: SourceSpan) {
        super('file', value, sourceSpan);
    }

    static create(target: File, originalSource: string): FileTypeClass {
        return new FileTypeClass(
            {
                program: ProgramTypeClass.create(target.program, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getProgram(): FileFields['program'] {
        return this.getFields().program;
    }
}

export const fileTypePair: EvaluatePair<File, FileTypeClass> = makeEvaluatePair(
    isFile,
    (target, originalSource) => FileTypeClass.create(target, originalSource),
);

export const isFileType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FileTypeClass => target instanceof FileTypeClass;
