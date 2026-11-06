({
    doInit: function (component, event, helper) {
        helper.load(component);
    },
    handleClick: function (component) {
        component.getEvent('invoiceSelected').fire();
    },
    toggleLines: function (component) {
        component.set('v.showLines', !component.get('v.showLines'));
    }
});
