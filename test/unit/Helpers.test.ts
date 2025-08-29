// Helpers.test.ts
import {expect} from 'chai';
import {DeepDiffMapper, DiffType} from "@VaultSecretEditor/Helpers";


describe('DeepDiffMapper', () => {
    let mapper: DeepDiffMapper;

    beforeEach(() => {
        mapper = new DeepDiffMapper();
    });

    describe('map', () => {
        it('throws an error when a function is passed as input', () => {
            const obj1 = () => {
            };
            const obj2 = {key: 'value'};

            expect(() => mapper.map(obj1, obj2)).to.throw('Invalid argument. Function given, object expected.');
        });

        it('returns UNCHANGED when primitive values are equal', () => {
            const obj1 = 42;
            const obj2 = 42;

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({type: DiffType.UNCHANGED});
        });

        it('returns UPDATED when primitive values are different', () => {
            const obj1 = 42;
            const obj2 = 43;

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({
                type: DiffType.UPDATED,
                localValue: obj2,
                remoteValue: obj1,
            });
        });

        it('returns CREATED when obj1 is undefined', () => {
            const obj1 = undefined;
            const obj2 = {key: 'value'};

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({
                type: DiffType.CREATED,
                data: obj2,
            });
        });

        it('returns DELETED when obj2 is undefined', () => {
            const obj1 = {key: 'value'};
            const obj2 = undefined;

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({
                type: DiffType.DELETED,
                data: obj1,
            });
        });

        it('returns UPDATED for nested object differences', () => {
            const obj1 = {key: {nested: 42}};
            const obj2 = {key: {nested: 43}};

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({
                type: DiffType.UPDATED,
                data: {
                    key: {
                        type: DiffType.UPDATED,
                        data: {
                            nested: {
                                type: DiffType.UPDATED,
                                localValue: 43,
                                remoteValue: 42,
                            },
                        },
                    },
                },
            });
        });

        it('returns UNCHANGED for identical nested objects', () => {
            const obj1 = {key: {nested: 42}};
            const obj2 = {key: {nested: 42}};

            const result = mapper.map(obj1, obj2);

            expect(result).to.deep.equal({type: DiffType.UNCHANGED});
        });

        // it('handles array differences correctly', () => {
        //     const obj1 = {key: [1, 2, 3]};
        //     const obj2 = {key: [1, 3, 4]};
        //
        //     const result = mapper.map(obj1, obj2);
        //
        //     expect(result).to.deep.equal({
        //         type: DiffType.UPDATED,
        //         data: {
        //             key: {
        //                 type: DiffType.UPDATED,
        //                 localValue: obj2.key,
        //                 remoteValue: obj1.key,
        //             },
        //         },
        //     });
        // });
        //
        // it('returns CREATED for newly added top-level properties', () => {
        //     const obj1 = {a: 1};
        //     const obj2 = {a: 1, b: 2};
        //
        //     const result = mapper.map(obj1, obj2);
        //
        //     expect(result).to.deep.equal({
        //         type: DiffType.UPDATED,
        //         data: {
        //             b: {
        //                 type: DiffType.CREATED,
        //                 data: 2,
        //             },
        //         },
        //     });
        // });
        //
        // it('returns DELETED for removed top-level properties', () => {
        //     const obj1 = {a: 1, b: 2};
        //     const obj2 = {a: 1};
        //
        //     const result = mapper.map(obj1, obj2);
        //
        //     expect(result).to.deep.equal({
        //         type: DiffType.UPDATED,
        //         data: {
        //             b: {
        //                 type: DiffType.DELETED,
        //                 data: 2,
        //             },
        //         },
        //     });
        // });
    });
});