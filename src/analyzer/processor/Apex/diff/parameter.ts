import { ConvertKeys, ErrorJson, ParameterJson } from '../../../types';

import { TypeDiff, makeTypeDiff } from './type';
import { ModifierDiff, makeModifierDiff } from './modifier';

export type ParameterDiff = {
    kind: 'parameter';
};
