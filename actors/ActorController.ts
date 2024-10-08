import {ActorElement} from "../elements/a-actor.js";
import {CardElement} from "../elements/a-card.js";
import {BattleScene} from "../elements/battle-scene.js";
import {element} from "../lib/random.js";
import {Message, Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";
import {CollectionFlag, save_card_state} from "../storage.js";

export abstract class ActorController {
    abstract Type: "player" | "villain";
    abstract Name: string;
    abstract Sprite: Sprites;
    abstract Description: string;
    abstract StartingDeck: Array<Sprites>;

    CurrentEnergy = 0;

    constructor(public Element: ActorElement) {}

    toString() {
        return this.Name;
    }

    get Battle() {
        let battle = this.Element.closest<BattleScene>("battle-scene");
        DEBUG: if (!battle) {
            throw "Actor must be inside a battle";
        }
        return battle;
    }

    get Deck() {
        let deck = this.Element.querySelector("a-deck");
        DEBUG: if (!deck) {
            throw "Actor must have a deck";
        }
        return deck;
    }

    get Hand() {
        let hand = this.Element.querySelector("a-hand");
        DEBUG: if (!hand) {
            throw "Actor must have a hand";
        }
        return hand;
    }

    GetScore() {
        let score = 0;
        for (const location of this.Battle.Locations) {
            score += location.GetScore(this);
        }
        return score;
    }

    *StartBattle(trace: Trace) {
        for (const sprite of this.StartingDeck) {
            let card = document.createElement("a-card");
            card.setAttribute("type", sprite.toString());
            this.Deck.append(card);
        }

        for (let i = 0; i < 3; i++) {
            yield* this.DrawCard(trace);
        }
    }

    *StartTurn(turn: number, trace: Trace) {
        this.CurrentEnergy = turn;
        this.Element.Render();

        yield* this.DrawCard(trace);
    }

    *DrawCard(trace: Trace, from?: Element) {
        const deck = from ?? this.Deck;

        if (deck.firstElementChild && this.Hand.children.length >= 7) {
            yield trace.Log(`${this} draw a card`);
            yield trace.Fork(1).Log("but the hand is full");
        } else if (deck.firstElementChild) {
            let card = deck.firstElementChild! as CardElement;

            if (this.Type === "player") {
                yield trace.Log(`${this} draw ${card.Controller}`);
                card.setAttribute("draggable", "true");
                card.classList.add("frontside");

                if (save_card_state(card.Controller, CollectionFlag.Seen)) {
                    yield trace.Fork(1).Log(`you see ${card.Controller} for the first time!`);
                }
            } else {
                yield trace.Log(`${this} draw a card`);
            }

            // yield* this.Battle.BroadcastCardMessage(Message.CardLeavesDeck, trace, card.Instance);
            this.Hand.append(card);
            yield* this.Battle.BroadcastCardMessage(Message.CardEntersHand, trace, card.Controller);
        } else {
            yield trace.Log(`${this} draw a card`);
            yield trace.Fork(1).Log("but the deck is empty");
        }
    }

    *VillAIn(trace: Trace) {
        while (true) {
            let playable_cards = Array.from(this.Element.querySelectorAll<CardElement>("a-hand a-card")).filter(
                (card) => card.Controller.CurrentCost <= this.CurrentEnergy,
            );

            if (playable_cards.length === 0) {
                break;
            }

            let highest_cost_card = playable_cards[0];
            for (let card of playable_cards) {
                if (card.Controller.CurrentCost > highest_cost_card.Controller.CurrentCost) {
                    highest_cost_card = card;
                }
            }

            let possible_locations = this.Battle.GetPossibleLocations(highest_cost_card.Controller);

            if (possible_locations.length === 0) {
                break;
            }

            let location = element(possible_locations);

            yield trace.Log(`${this} play a card to ${location}`);

            location.GetSide(this).append(highest_cost_card);
            this.Battle.PlayedCardsQueue.push(highest_cost_card.Controller);

            this.CurrentEnergy -= highest_cost_card.Controller.CurrentCost;
            this.Element.Render();
        }
    }
}
