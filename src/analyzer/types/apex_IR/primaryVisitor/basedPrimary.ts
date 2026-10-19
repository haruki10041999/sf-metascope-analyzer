import { NormalPrimaryTypeClass } from './normal';
import { ThisPrimaryTypeClass } from './thisPrimary';
import { VoidPrimaryTypeClass } from './voidPrimary';
import { SoqlPrimaryTypeClass } from './soqlPrimary';
import { SuperPrimaryTypeClass } from './superPrimary';
import { TypeRefPrimaryTypeClass } from './typeRefPrimary';
import { IdPrimaryTypeClass } from './idPrimary';
import { LiteralPrimaryTypeClass } from './literalPrimary';
import { SoslPrimaryTypeClass } from './soslPrimary';

export type BasedPrimaryTypeClass =
    | NormalPrimaryTypeClass
    | ThisPrimaryTypeClass
    | VoidPrimaryTypeClass
    | SoqlPrimaryTypeClass
    | SuperPrimaryTypeClass
    | TypeRefPrimaryTypeClass
    | IdPrimaryTypeClass
    | LiteralPrimaryTypeClass
    | SoslPrimaryTypeClass;
