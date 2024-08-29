import {ActorController} from "../actors/ActorController.js";
import {ActorElement} from "../elements/a-actor.js";
import {CardElement} from "../elements/a-card.js";
import {LocationElement} from "../elements/a-location.js";
import {BattleScene} from "../elements/battle-scene.js";
import {next_id} from "../lib/id.js";
import {LocationController} from "../locations/LocationController.js";
import {Message, Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";

export abstract class CardController {
    abstract Name: string;
    abstract Cost: number;
    abstract Power: number;
    abstract Text: string;
    abstract Sprite: Sprites;

    Id = next_id();
    IsRevealed = false;
    TurnPlayed = 0;

    constructor(public Element: CardElement) {}

    get CurrentCost() {
        let result = this.Cost;
        for (let modifier of this.Element.querySelectorAll("a-modifier")) {
            let op = modifier.getAttribute("op")!;
            let value = parseInt(modifier.getAttribute("value")!);
            switch (op) {
                case "addcost":
                    result += value;
                    break;
            }
        }
        return result;
    }

    get CurrentPower() {
        let result = this.Power;
        for (let modifier of this.Element.querySelectorAll("a-modifier")) {
            let op = modifier.getAttribute("op")!;
            let value = parseInt(modifier.getAttribute("value")!);
            switch (op) {
                case "addpower":
                    result += value;
                    break;
            }
        }
        return result;
    }

    get Owner(): ActorController {
        let location_owner = this.Element.closest("location-owner");
        if (location_owner) {
            let actor_id = location_owner.getAttribute("slot")!;
            let actor = this.Battle.querySelector("#" + actor_id) as ActorElement;
            return actor.Instance;
        } else {
            let actor_element = this.Element.closest("a-actor") as ActorElement;
            return actor_element.Instance;
        }
    }

    get Opponent(): ActorController {
        let actor_id = this.Owner.Type === "player" ? "villain" : "player";
        let actor = document.getElementById(actor_id) as ActorElement;
        return actor.Instance;
    }

    get Battle(): BattleScene {
        return this.Element.closest<BattleScene>("battle-scene")!;
    }

    get Location(): LocationController | undefined {
        let location = this.Element.closest<LocationElement>("a-location");
        return location?.Instance;
    }

    AddModifier(origin: CardController, op: string, value: number) {
        let modifier = document.createElement("a-modifier")!;
        modifier.setAttribute("origin-id", origin.Id.toString());
        modifier.setAttribute("origin-name", origin.Name);
        modifier.setAttribute("op", op);
        modifier.setAttribute("value", value.toString());
        this.Element.appendChild(modifier);

        // TODO Perhaps a MutationObserver would be a better way to handle this?
        this.Element.ReRender();
    }

    /**
     * Handles messages targeting other cards, as well as system messages (when
     * `card` is `undefined`).
     *
     * When the message is broadcast, the target card is present in the
     * container mentioned in the message:
     *
     * * `CardLeavesHand` — the card is **still** in the hand.
     * * `CardEntersHand` — the card is **already** in the hand.
     */
    *OnMessage(kind: Message, trace: Trace, card?: CardController): Generator<[Trace, string], void> {}

    /**
     * Handles messages targeting **this card**.
     *
     * When the message is broadcast, the card is present in the container
     * mentioned in the message:
     *
     * * `CardLeavesHand` — the card is **still** in the hand.
     * * `CardEntersHand` — the card is **already** in the hand.
     */
    *OnMessageSelf(kind: Message, trace: Trace): Generator<[Trace, string], void> {}

    *Reveal(trace: Trace) {
        if (trace.length === 0) {
            yield trace.log(`${this.Name} is revealed`);
        }
        this.Element.classList.add("frontside");
        yield* this.OnReveal(trace.fork());
        this.IsRevealed = true;
        this.TurnPlayed = this.Battle.CurrentTurn;

        yield* this.Battle.BroadcastCardMessage(Message.CardEntersTable, trace.fork(), this);
    }

    /**
     * Happens **before** the card is revealed.
     *
     * The card is already on the table face-up, but `GetRevealedCards` will not
     * include it.
     */
    *OnReveal(trace: Trace): Generator<[Trace, string], void> {
        // yield trace.log(`it does nothing special`);
    }

    *Trash(trace: Trace) {
        if (this.Element.closest("a-hand")) {
            yield* this.Battle.BroadcastCardMessage(Message.CardLeavesHand, trace.fork(), this);
        } else if (this.Element.closest("a-deck")) {
            yield* this.Battle.BroadcastCardMessage(Message.CardLeavesDeck, trace.fork(), this);
        } else if (this.Element.closest("a-location")) {
            yield* this.Battle.BroadcastCardMessage(Message.CardLeavesTable, trace.fork(), this);
        } else if (DEBUG) {
            throw `Card ${this.Name} is not in a valid location to be trashed`;
        }

        const trash = this.Owner.Element.querySelector("a-trash")!;
        trash.appendChild(this.Element);
        yield trace.log(`${this.Name} has been trashed`);

        yield* this.Battle.BroadcastCardMessage(Message.CardEntersTrash, trace.fork(), this);
    }

    *Move(trace: Trace, slot: HTMLElement) {
        const target_location = slot.closest<LocationElement>("a-location")!.Instance;

        const is_slot_taken = !!slot.querySelector("a-card");
        if (!is_slot_taken) {
            yield* this.Battle.BroadcastCardMessage(Message.CardMovesFromLocation, trace.fork(), this);
            slot.appendChild(this.Element);
            yield trace.log(`${this.Name} moved from ${this.Location!.Name} to ${target_location.Name} `);
            yield* this.Battle.BroadcastCardMessage(Message.CardMovesToLocation, trace.fork(), this);
        } else {
            yield trace.log(
                `${this.Name} could not move to ${target_location.Name} because the slot nr ${slot} is already taken`,
            );
        }
    }
}
