// LWC の target (置ける場所) と capability (できること) の一覧 (Salesforce の公式情報。リリースのたびに
// .claude/skills/salesforce-release-update で照合する)。パーサーの検証と解析で共通に使うので、型の層に置く。
// - capability: Metadata API Developer Guide の LightningComponentBundle の capability の「Valid values」と照合した (全件)
// - target: Metadata API Developer Guide は一覧を持たず「LWC の開発者ガイドの XML Configuration File Elements」を
//   指す。開発者ガイドは自動で取れる PDF がないので、Metadata API の資料に出てくるものだけを照合済み (verified) にする
// - Lightning ページの種類 (FlexiPage の type) は、Metadata API Developer Guide の FlexiPageType と照合した

/** 照合した資料の API バージョン (Metadata API Developer Guide。2026-11-26 に Version 68.0, Winter '27 で照合) */
export const LWC_STANDARD_TARGETS_REFERENCE_API_VERSION = 68;

/** 公式の名前 1 つと、公式資料で照合できたか */
export type LwcStandardName = {
    name: string;
    /** 公式資料 (PDF) で名前を確かめた。false は開発者ガイドにしか載らないもの (未照合。存在しないとは言わない) */
    verified: boolean;
};

/** capability (LightningComponentBundle の capability。資料の Valid values のすべて) */
export const LWC_CAPABILITIES: readonly LwcStandardName[] = [
    { name: 'lightningCommunity__RelaxedCSP', verified: true },
    { name: 'lightning__dynamicComponent', verified: true },
    { name: 'lightning__ServerRenderable', verified: true },
    { name: 'lightning__ServerRenderableWithHydration', verified: true },
    { name: 'lightning__ServiceCloudVoiceToolkitApi', verified: true },
];

/** 動的なコンポーネント (lwc:component) を使うのに要る capability */
export const LWC_DYNAMIC_COMPONENT_CAPABILITY = 'lightning__dynamicComponent';

/** 解析で使う target (全件ではない。載っていない target を「ない」と言わない) */
export const LWC_TARGETS: readonly LwcStandardName[] = [
    { name: 'lightning__AppPage', verified: true },
    { name: 'lightning__FlowAction', verified: true },
    { name: 'lightning__FlowScreen', verified: false },
    { name: 'lightning__HomePage', verified: true },
    { name: 'lightning__RecordPage', verified: true },
    { name: 'lightning__UtilityBar', verified: false },
    { name: 'lightningCommunity__Page', verified: false },
];

/** Flow の画面に置ける target */
export const LWC_FLOW_SCREEN_TARGET = 'lightning__FlowScreen';

/** Lightning ページの種類 (FlexiPage の type。FlexiPageType と照合済み) → LWC の js-meta.xml の target */
export const FLEXI_PAGE_TARGETS: Readonly<Record<string, string>> = {
    RecordPage: 'lightning__RecordPage',
    AppPage: 'lightning__AppPage',
    HomePage: 'lightning__HomePage',
    UtilityBar: 'lightning__UtilityBar',
    CommAppPage: 'lightningCommunity__Page',
    CommObjectPage: 'lightningCommunity__Page',
    CommRecordPage: 'lightningCommunity__Page',
    CommRelatedListPage: 'lightningCommunity__Page',
    CommThemeLayoutPage: 'lightningCommunity__Page',
};
