import { isDecorator, type Decorator } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DecoratorTypeClass extends LwcCommonTypeClass<'decorator'> {
    private constructor(originalSource: string) {
        super('decorator', originalSource);
    }

    static create(target: Decorator, originalSource: string): DecoratorTypeClass {
        throw new Error('DecoratorTypeClass.create is not implemented: ' + target.type);
    }
}

export const decoratorTypePair: EvaluatePair<Decorator, DecoratorTypeClass> = makeEvaluatePair(
    isDecorator,
    (target, originalSource) => DecoratorTypeClass.create(target, originalSource),
);

export const isDecoratorType = (target: LwcCommonTypeClass<string>): target is DecoratorTypeClass =>
    target instanceof DecoratorTypeClass;
