import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

interface CPSHistory {
    last: number;
    history: {
        time: number;
        cps: number;
    }[];
}

export default class AutoClicker extends ModuleBase {
    info(): void {
        /**
         * @name: Auto Clicker
         * @version: 1.0.0
         * @description: Checks if players are clicking too fast or consistently.
         */
    }
    
    configModel = class Config extends ModuleConfig {
        "cps-cap" = 20;
        "cps-history-length" = 10;
        "warning" = true;
    };
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.LevelSoundEvent), (pk, ni) => {
            if (pk.sound === 42 && !pk.disableRelativeVolume) {
                if (this.click(ni)) return CANCEL;
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.InventoryTransaction), (pk, ni) => {
            if (pk.transaction.isItemUseOnEntityTransaction()) {
                if (this.click(ni)) return CANCEL;
            }
        });
    }
    unload(): void {
    }

    click(ni: NetworkIdentifier): boolean {
        const now = Date.now();

        let clicks = DB.getPlayerData(ni, "autoclicker.clicks") as number[] ?? [];

        clicks = clicks.filter(t => now - t < 1000);
        clicks.push(now);
        DB.setPlayerData(ni, clicks, "autoclicker.clicks");

        const cps = clicks.length;
        
        const history = DB.getPlayerData(ni, "autoclicker.history") as CPSHistory ?? {
            last: now,
            history: [{time: now, cps}]
        };

        history.history = history.history.filter(h => now - h.time < (this.getConfig()["cps-history-length"] ?? 10) * 1000 + 500);
        if (now - history.last > 1000) {
            history.last = now;
            history.history.push({time: now, cps});
        }
        DB.setPlayerData(ni, history, "autoclicker.history");

        if (cps > 10 && history.history.length >= (this.getConfig()["cps-history-length"] ?? 10) && history.history.every(c => c.cps === history.history[0].cps || c.cps === history.history[0].cps + 1 || c.cps === history.history[0].cps - 1)) {
            this.suspect(ni, `Player is clicking too consistently at [${cps} CPS].`);
            return true;
        }

        if (cps > (this.getConfig()["cps-cap"] ?? 15)) {
            this.suspect(ni, `Player is clicking too fast at [${cps} CPS].`);
            if (this.getConfig()["warning"]) {
                this.warn(ni, "Please slow down, you are clicking too fast.");
            }
            return true;
        }

        return false;
    }
}