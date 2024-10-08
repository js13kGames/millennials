import {CardController} from "../cards/CardController.js";
import {Message, Trace} from "../messages.js";
import {LocationController} from "./LocationController.js";

export class CopyToOwnerHand extends LocationController {
    Description = "When you play a card here, add a copy to your hand";
    override *OnMessage(kind: Message, trace: Trace, card?: CardController) {
        if (card?.Field === this && kind === Message.CardEntersTable) {
            let clone = card.Clone();
            yield* clone.Controller.AddToHand(card.Owner, trace);
        }
    }
}
