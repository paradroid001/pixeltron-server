//A net object is a net entity with a name and a position.
import logger from '../../utils/Logging';
import { NetEntity, sync, SyncAccess } from './NetEntity';
import { Vector2 } from './Base';

export class NetObject extends NetEntity {
    // We would like to get rid of the below.
    @sync('position')
    protected _position: Vector2;
    @sync('name')
    public name: string;

    constructor() {
        super();
        this._position = new Vector2();
    }

    public setPosition(x: number, y: number) {
        //TODO test here if you're setting a new pos?
        this._position.x = x;
        this._position.y = y;
        this.dirty('_position'); //must be real key name.
    }
    public get position(): Vector2 {
        return this._position;
    }
}
