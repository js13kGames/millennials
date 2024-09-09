import {CardElement} from "../elements/a-card.js";
import {Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";
import {CardController} from "./CardController.js";

export class LuckyLuke extends CardController {
    Name = "Fortune Lucas";
    Cost = 5;
    Power = 7;
    Text = "Once: Trash the cheapest card from your opponent's hand";
    Sprite = Sprites.LuckyLuke;

    override *OnReveal(trace: Trace) {
        const hand = this.Opponent.Hand;

        if (hand.firstElementChild) {
            let cheapest = hand.firstElementChild as CardElement;

            for (let card of hand.querySelectorAll<CardElement>("a-card")) {
                if (card.Instance.CurrentCost < cheapest.Instance.CurrentCost) {
                    cheapest = card;
                }
            }

            yield* cheapest.Instance.Trash(trace);
        }
    }
}
