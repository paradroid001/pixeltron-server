import * as Base from '../Base';

describe('Base Functions', () => {
    test('Random int is in range', async () => {
        const result = await Base.randomInt(1, 2);
        expect(result).toBeGreaterThan(0);
    });
    test('Random int on small range', async () => {
        const result = await Base.randomInt(1, 1);
        expect(result).toEqual(1);
    });
    test('Random int on negative range', async () => {
        const result = await Base.randomInt(-6, -5);
        expect(result).toBeLessThanOrEqual(-5);
        expect(result).toBeGreaterThanOrEqual(-6);
    });
});
