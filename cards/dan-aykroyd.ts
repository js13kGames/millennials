import {shuffle} from "../lib/random.js";
import {Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";
import {CardController} from "./CardController.js";

export class DanAykroyd extends CardController {
    Name = "Dan";
    Cost = 3;
    Power = 2;
    Description = "Once: Give your three other cards +3 Power";
    Sprite = Sprites.DanAykroyd;

    override *OnReveal(trace: Trace) {
        const revealedCards = shuffle([...this.Battle.GetRevealedCards(this.Owner)]);
        const cardsToBuff = revealedCards.slice(0, 3);

        for (let card of cardsToBuff) {
            yield trace.Log(card.AddModifier(this, "addpower", 3));
        }
    }
}
