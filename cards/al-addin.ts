import {Message, Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";
import {CardController} from "./CardController.js";

export class Aladdin extends CardController {
    Name = "La-la-din";
    Cost = 3;
    Power = 4;
    Description = "When this moves, +6 Power";
    Sprite = Sprites.Aladdin;

    override *OnMessageSelf(kind: Message, trace: Trace) {
        switch (kind) {
            case Message.CardMovesToLocation:
                yield trace.Log(this.AddModifier(this, "addpower", 6));
                break;
        }
    }
}
