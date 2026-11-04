import { isFile, type File } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class FileTypeClass extends LwcCommonTypeClass<'file'> {
    private constructor(originalSource: string) {
        super('file', originalSource);
    }

    static create(target: File, originalSource: string): FileTypeClass {
        throw new Error('FileTypeClass.create is not implemented: ' + target.type);
    }
}

export const fileTypePair: EvaluatePair<File, FileTypeClass> = makeEvaluatePair(
    isFile,
    (target, originalSource) => FileTypeClass.create(target, originalSource),
);

export const isFileType = (target: LwcCommonTypeClass<string>): target is FileTypeClass =>
    target instanceof FileTypeClass;
