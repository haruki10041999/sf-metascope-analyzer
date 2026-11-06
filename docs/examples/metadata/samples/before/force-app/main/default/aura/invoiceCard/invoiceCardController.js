({
    doInit: function (component, event, helper) {
        helper.load(component);
    },
    handleClick: function (component) {
        component.getEvent('invoiceSelected').fire();
    }
});
