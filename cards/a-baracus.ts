import {CardController} from "../controllers/CardController.js";
import {Sprites} from "../sprites/sprites.js";

customElements.define(
    "a-baracus",
    class extends CardController {
        Name = "B-Team C.D. Bacarus";
        Cost = 2;
        Power = 2;
        Text = "If in the middle location +3 power";
        Sprite = Sprites.BABaracus;

        override *OnReveal() {
            const battle_cotroller = this.closest("battle-controller")!;
            const locations = battle_cotroller.querySelectorAll("a-location");
            let locationIndex = -1;

            for (let index = 0; index < locations.length; index++) {
                if (locations[index].contains(this)) {
                    locationIndex = index;
                    break;
                }
            }

            if (locationIndex === 1) {
                yield `${this.Name} gains +3 power for being in the middle location`;
                this.AddModifier(this, "addpower", 3);
            } else {
                yield `${this.Name} does not gain any additional power`;
            }
        }
    },
);
