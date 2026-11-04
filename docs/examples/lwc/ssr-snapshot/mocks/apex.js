// @salesforce/apex/* のスタブ。wire adapter として、モックのデータ (globalThis.__LWC_MOCKS__) を返す
export default class MockApexAdapter {
    constructor(dataCallback) {
        this.dataCallback = dataCallback;
    }
    connect() {
        this.dataCallback(
            globalThis.__LWC_MOCKS__?.getAccounts ?? { data: undefined, error: undefined },
        );
    }
    update() {}
    disconnect() {}
}
