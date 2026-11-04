import { isTSImportType, type TSImportType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSImportTypeTypeClass extends LwcCommonTypeClass<'tSImportType'> {
    private constructor(originalSource: string) {
        super('tSImportType', originalSource);
    }

    static create(target: TSImportType, originalSource: string): TSImportTypeTypeClass {
        throw new Error('TSImportTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSImportTypeTypePair: EvaluatePair<TSImportType, TSImportTypeTypeClass> =
    makeEvaluatePair(isTSImportType, (target, originalSource) =>
        TSImportTypeTypeClass.create(target, originalSource),
    );

export const isTSImportTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSImportTypeTypeClass => target instanceof TSImportTypeTypeClass;
