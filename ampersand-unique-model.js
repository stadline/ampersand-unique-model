var AmpModel = require('ampersand-model');
var registry = require('./ampersand-unique-registry');

module.exports = AmpModel.extend({
    isUnique: true,
    constructor: function() {
        AmpModel.prototype.constructor.apply(this, arguments);

        // on source identifier change, update source
        this.listenTo(this, 'change:'+this.idAttribute, this._setSource);
        this.listenTo(this, 'change:'+this.typeAttribute, this._setSource);
        this.listenTo(this, 'change:'+this.namespaceAttribute, this._setSource);

        this._setSource();
        this.listenToAndRun(this, 'change', this._onLocalChange);

        this.listenTo(this, 'destroy', this._onLocalDestroy);
    },
    set: function (key, value, options) {
        // retrieve "silent" option
        var silentOption;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (typeof key === 'string') {
            silentOption = options && options.silent;
        } else {
            silentOption = value && value.silent;
        }

        // save previous source identifiers
        var previousAttrs = {};

        if (silentOption) {
            // silent mode, handle the source manually
            previousAttrs[this.idAttribute] = this.getId();
            previousAttrs[this.typeAttribute] = this.getType();
            previousAttrs[this.namespaceAttribute] = this.getNamespace();
        }

        // set values
        var values = AmpModel.prototype.set.apply(this, arguments);

        // check if source should be changed
        if (previousAttrs && this.changedAttributes(previousAttrs)) {
            this._setSource();
        }

        // don't forget to return values;
        return values;
    },
    _source: null,
    _setSource: function() {
        // detach listeners
        if (this._source) {
            this.stopListening(this._source);
        }

        // update source
        registry.store(this);
        this._source = registry.lookup(this);

        // attach listeners
        if (this._source) {
            this.listenToAndRun(this._source, 'change', this._onSourceChange);
        }
    },
    _onLocalChange: function() {
        if (this._source) {
            var localAttrs = this.getAttributes({props: true, session: true});

            this._source.set(localAttrs);
        }
    },
    _onSourceChange: function() {
        if (this._source) {
            var sourceAttrs = this._source.getAttributes({props: true, session: true});

            this.set(sourceAttrs);
        }
    },
    _onLocalDestroy: function() {
        if (this._source) {
            registry.remove(this._source);
            this._source.clear();
        }
    }
});