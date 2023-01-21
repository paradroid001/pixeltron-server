import * as Base from '../Base';

describe('Base Functions', () => {
    test('Random int is in range', async () => {
        const result = await Base.randomInt(1, 2);
        await expect(result).toBeGreaterThan(0);
    });
    test('Random int on small range', async () => {
        const result = await Base.randomInt(1, 1);
        await expect(result).toEqual(1);
    });
    test('Random int on negative range', async () => {
        const result = await Base.randomInt(-6, -5);
        await expect(result).toBeLessThanOrEqual(-5);
        await expect(result).toBeGreaterThanOrEqual(-6);
    });
});
