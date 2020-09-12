export class Vector2 {
    public x = 0;
    public y = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    //distance on a grid
    static dist_grid(v1: Vector2, v2: Vector2): number {
        let ret = 0;
        const dx: number = Math.abs(v1.x - v2.x);
        const dy: number = Math.abs(v1.y - v2.y);
        //dist on a grid is just the max of those two numbers.
        ret = Math.max(dx, dy);
        return ret;
    }
}

// return int between min and max (inclusive)
export function randomInt(min: number, max: number) {
    const diff: number = max - min;
    // the +1 below makes this function inclusive of max.
    const rnum: number = Math.floor(Math.random() * (diff + 1));
    return min + rnum;
}

export function randomChoice(arr: any[]): any {
    const rnum: number = randomInt(0, arr.length - 1);
    return arr[rnum];
}
