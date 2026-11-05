// Apex / メタデータ / LWC で共通の型と部品 (JsonType・ソース位置・XML → JSON)
export * from './commons';

// メタデータ (オブジェクト): XML → JSON 生成層
export * from './metadata';

// Apex: converter（IR → CommonType）と JSON 生成層（CommonType → JSON）
export * from './apex';

// LWC: converter（IR → CommonType）と JSON 生成層（CommonType → JSON）
export * from './lwc';

// Apex IR: 各 isXxxType が ./apex（converter）の同名の判定関数と衝突するため、名前空間で公開する
export * as apexIR from './apex_IR';

// LWC IR: Babel Standardized ノード型と型ガード
export * as lwcIR from './lwc_IR';

// IR のうち、解析の入口で使うものは直接公開する
export { ApexCommonTypeClass, ApexErrorTypeClass, UnitVisitor } from './apex_IR';
