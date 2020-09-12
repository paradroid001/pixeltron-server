import { NetObject } from './NetObject';
import { Vector2 } from './Base';
import { Action } from './Action';
import { PlayerConnection } from './PlayerConnection';

export class NetPlayer extends NetObject {
    public connection: PlayerConnection;

    public actionHandlers: { [key: string]: (action: Action) => void } = {};

    constructor(playerdata: any) {
        super();
        if (playerdata.name) this.name = playerdata.name;
    }

    protected registerActionHandler(actionType: string, handler: (action: Action) => void) {
        this.actionHandlers[actionType] = handler; //(_dt: number, a: Action) => {handler(_dt, a)};
    }
    public getHandler(actionType: string): (action: Action) => void {
        return this.actionHandlers[actionType];
        //return (dt: number, action: Action) => { this.actionHandlers[actionType](dt, action) };
    }
    public handlesAction(actionType: string): boolean {
        return this.actionHandlers.hasOwnProperty(actionType);
    }
    /*
    onMoveAction( dt: number, action: Action)
    {
        // console.log("Player is doing move action!");
        let pos: Vector2 = this.position;
        let dx: number = +action.args[0]; // + converts to int
        let dy: number = +action.args[1]; // + converts to int
        this.setPosition(pos.x + dx, pos.y + dy);
        
    }
    */
}
