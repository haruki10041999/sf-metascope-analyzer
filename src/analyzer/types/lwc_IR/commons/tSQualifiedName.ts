import { isTSQualifiedName, type TSQualifiedName } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSQualifiedNameTypeClass extends LwcCommonTypeClass<'tSQualifiedName'> {
    private constructor(originalSource: string) {
        super('tSQualifiedName', originalSource);
    }

    static create(target: TSQualifiedName, originalSource: string): TSQualifiedNameTypeClass {
        throw new Error('TSQualifiedNameTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSQualifiedNameTypePair: EvaluatePair<TSQualifiedName, TSQualifiedNameTypeClass> =
    makeEvaluatePair(isTSQualifiedName, (target, originalSource) =>
        TSQualifiedNameTypeClass.create(target, originalSource),
    );

export const isTSQualifiedNameType = (
    target: LwcCommonTypeClass<string>,
): target is TSQualifiedNameTypeClass => target instanceof TSQualifiedNameTypeClass;
