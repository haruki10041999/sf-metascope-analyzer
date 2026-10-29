export * from './commons';
export * from './metadata';

// Apex: converter（IR → CommonType）と JSON 生成層（CommonType → JSON）
export * from './apex';

// Apex IR: 各 isXxxType が ./apex（converter）の同名の判定関数と衝突するため、名前空間で公開する
export * as apexIR from './apex_IR';

// IR のうち、解析の入口で使うものは直接公開する
export {
    CommonErrorListener,
    CommonTypeClass,
    ErrorTypeClass,
    UnitVisitor,
} from './apex_IR';
export type { SourcePosition, SourceSpan } from './apex_IR';
