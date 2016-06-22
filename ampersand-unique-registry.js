var AmpRegistry = require('ampersand-registry');
var AmpModel = require('ampersand-model');
var registry = new AmpRegistry();

module.exports = {
    store: function(model) {
        if (model.getType() && model.getId()) {
            return registry.store(this._clone(model));
        }
    },
    lookup: function(model) {
        return registry.lookup(model.getType(), model.getId(), model.getNamespace());
    },
    remove: function(model) {
        return registry.remove(model.getType(), model.getId(), model.getNamespace());
    },
    clear: function() {
        return registry.clear();
    },
    _clone: function(model) {
        var modelId = model.getId();
        var modelType = model.getType();
        var modelNamespace = model.getNamespace();

        var RegisteredModel = AmpModel.extend({
            extraProperties: 'allow',
            getId: function() { return modelId; },
            getType: function() { return modelType; },
            getNamespace: function() { return modelNamespace; }
        });

        return new RegisteredModel(model.getAttributes({
            props: true,
            session: true
        }));
    }
};

