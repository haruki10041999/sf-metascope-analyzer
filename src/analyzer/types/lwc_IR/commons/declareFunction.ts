import { isDeclareFunction, type DeclareFunction } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DeclareFunctionTypeClass extends LwcCommonTypeClass<'declareFunction'> {
    private constructor(originalSource: string) {
        super('declareFunction', originalSource);
    }

    static create(target: DeclareFunction, originalSource: string): DeclareFunctionTypeClass {
        throw new Error('DeclareFunctionTypeClass.create is not implemented: ' + target.type);
    }
}

export const declareFunctionTypePair: EvaluatePair<DeclareFunction, DeclareFunctionTypeClass> =
    makeEvaluatePair(isDeclareFunction, (target, originalSource) =>
        DeclareFunctionTypeClass.create(target, originalSource),
    );

export const isDeclareFunctionType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareFunctionTypeClass => target instanceof DeclareFunctionTypeClass;
