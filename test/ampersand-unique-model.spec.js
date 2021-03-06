/*jshint mocha: true*/
/*jshint expr: true*/

var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var AmpCollection = require('ampersand-collection');

// test
describe('ampersand-unique-model', function() {
    var registry;
    var AmpUniqueModel;
    var SkillModel;
    var SkillCollection;
    var PersonModel;
    var GroupModel;

    beforeEach(function () {
        registry = require('../ampersand-unique-registry');
        registry.clear();

        // inject stubs into library
        AmpUniqueModel = proxyquire('../ampersand-unique-model', {
            './ampersand-unique-registry': registry
        });

        SkillModel = AmpUniqueModel.extend({
            modelType: 'SkillType',
            extraProperties: 'reject',
            props: { id: 'number', name: 'string' },
            sync: function() {}
        });

        SkillCollection = AmpCollection.extend({
            model: SkillModel
        });

        PersonModel = AmpUniqueModel.extend({
            modelType: 'PersonType',
            extraProperties: 'reject',
            props: { id: 'number', name: 'string' },
            children: {
                job: SkillModel
            },
            collections: {
                skills: SkillCollection
            },
            sync: function() {}
        });

        GroupModel = AmpUniqueModel.extend({
            modelType: 'GroupType',
            extraProperties: 'allow',
            sync: function() {},
            children: {
                person: PersonModel
            }
        });
    });

    it('should register automatically', function() {
        var model = new PersonModel();

        // before edition
        expect(registry.lookup(model)).to.be.undefined;

        // add identifier, should be registered
        model.set(model.idAttribute, 123);
        expect(registry.lookup(model)).not.to.be.undefined;

        // remove identifier, should be unregistered
        model.set(model.idAttribute, null);
        expect(registry.lookup(model)).to.be.undefined;
    });

    it('should register a distinct instance', function() {
        var model = new PersonModel();

        // before edition
        expect(registry.lookup(model)).to.be.undefined;

        // add identifier, should be registered
        model.set(model.idAttribute, 123);
        expect(registry.lookup(model)).not.to.be.undefined;
        expect(registry.lookup(model).cid).not.to.equal(model.cid);
    });

    it('should unregister automatically', function() {
        var model = new PersonModel({
            id: 123
        });

        // before edition
        expect(registry.lookup(model)).not.to.be.undefined;

        // destroy object should be unregistered
        model.destroy();
        expect(registry.lookup(model)).to.be.undefined;
    });

    it('should share similar sources', function() {
        var person1 = new PersonModel();
        var person2 = new PersonModel();

        // before edition
        expect(registry.lookup(person1)).to.be.undefined;
        expect(registry.lookup(person2)).to.be.undefined;

        // add identifier, should be registered
        person1.set('id', 123);
        person2.set('id', 123);
        expect(registry.lookup(person1)).not.to.be.undefined;
        expect(registry.lookup(person2)).not.to.be.undefined;

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);
    });

    it('should split different sources', function() {
        var person1 = new PersonModel();
        var person2 = new PersonModel();

        // before edition
        expect(registry.lookup(person1)).to.be.undefined;
        expect(registry.lookup(person2)).to.be.undefined;

        // add identifier, should be registered
        person1.set('id', 123);
        person2.set('id', 456);
        expect(registry.lookup(person1)).not.to.be.undefined;
        expect(registry.lookup(person2)).not.to.be.undefined;

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).not.to.equal(registry.lookup(person2).cid);

        // change identifier, they must be shared
        person2.set('id', 123);
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);
    });

    it('should syncronize changes', function() {
        var person1 = new PersonModel({
            id: 123
        });
        var person2 = new PersonModel({
            id: 123
        });

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);

        // change 1 instance
        person1.set('name', 'Alex P.');

        // the other instance should be updated
        expect(person2.name).to.equal('Alex P.');
    });

    it('should expand missing properties (1/2)', function() {
        var person1 = new PersonModel({
            id: 123,
            name: 'Alex P.'
        });
        var person2 = new PersonModel({
            id: 123
        });

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);

        // the other instance should be updated
        expect(person2.name).to.equal('Alex P.');
    });

    it('should expand missing properties (2/2)', function() {
        var person1 = new PersonModel({
            id: 123
        });
        var person2 = new PersonModel({
            id: 123,
            name: 'Alex P.'
        });

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);

        // the other instance should be updated
        expect(person1.name).to.equal('Alex P.');
    });

    it('should stop listening when identifers change', function() {
        var person1 = new PersonModel({
            id: 123
        });
        var person2 = new PersonModel({
            id: 123
        });

        // the 2 instances must share the same source
        expect(registry.lookup(person1).cid).to.equal(registry.lookup(person2).cid);

        // update should be synchronized
        person1.set('name', 'Alex P.');
        expect(person2.name).to.equal('Alex P.');

        // split sources
        person2.id = 456;

        // update should NOT be synchronized
        person1.set('name', 'Fabien R.');
        expect(person2.name).to.equal('Alex P.');
        person2.set('name', 'Jérôme W.');
        expect(person1.name).to.equal('Fabien R.');
    });

    it('should syncronize nested changes', function() {
        var person = new PersonModel({
            id: 123
        });
        var group = new GroupModel({
            id: 456,
            person: { id: 123 }
        });

        // the person should be the same
        expect(group.person.id).to.equal(person.id);
        expect(group.person._source).not.to.be.undefined;
        expect(group.person._source.cid).to.equal(person._source.cid);

        // make a change
        group.person.name = 'Alice C.';
        expect(group.person._source.name).to.equal('Alice C.');
        expect(person._source.name).to.equal('Alice C.');
        expect(person.name).to.equal('Alice C.');
    });

    it('should not syncronize **deeply** nested changes', function() {
        var person = new PersonModel({
            id: 123,
            name: "Alex P.",
            job: {
                id: 777,
                name: "Developer"
            },
            skills: [
                {
                    id: 888,
                    name: "Magic"
                },
                {
                    id: 999,
                    name: "Stuff"
                }
            ]
        });

        var group = new GroupModel({
            id: 456,
            person: { id: 123 }
        });

        // the person should be the same
        expect(group.person.id).to.equal(person.id);
        expect(group.person._source).not.to.be.undefined;
        expect(group.person._source.cid).to.equal(person._source.cid);

        // props should be fixed
        expect(group.person.name).to.equal("Alex P.");

        // relations should NOT be synced
        expect(group.person.job.name).to.be.undefined;
        expect(group.person.skills.length).to.equal(0);
    });
});
