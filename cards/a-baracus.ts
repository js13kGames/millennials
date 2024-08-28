import {Trace} from "../messages.js";
import {Sprites} from "../sprites/sprites.js";
import {CardController} from "./CardController.js";

export class Baracus extends CardController {
    Name = "B-Team C.D. Bacarus";
    Cost = 2;
    Power = 2;
    Text = "+3 power if revealed in the middle location";
    Sprite = Sprites.BABaracus;

    override *OnReveal(trace: Trace) {
        trace.push(this);

        const locations = this.Battle.querySelectorAll("a-location");
        let locationIndex = -1;

        for (let index = 0; index < locations.length; index++) {
            if (locations[index].contains(this.Element)) {
                locationIndex = index;
                break;
            }
        }

        if (locationIndex === 1) {
            yield trace.log(`${this.Name} gains +3 power for being in the middle location`);
            this.AddModifier(this, "addpower", 3);
        } else {
            yield trace.log(`${this.Name} does not gain any additional power`);
        }
    }
}
