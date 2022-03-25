import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { AnimatePacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";
import { TitleId } from "./edition_faker";

export default class NoSwing extends ModuleBase {

    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=No Swing
        description=Tests if players did not swing their arms before performing certain actions.

        action.destroy=Destroy
        action.hitAir=Hit Air
        aciton.attack=Attack

        suspect.never=No swing animation was found before action [%s].
        suspect.tooLongAgo=Last swing animation before action [%1] was [%2 ms] ago.
    */};

    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Animate), (pk, ni) => {
            if (pk.action === AnimatePacket.Actions.SwingArm) {
                DB.setPlayerData(ni, Date.now(), "NoSwing.last");
            }
        });
        this.listen(events.blockDestructionStart, event => {
            const ni = event.player.getNetworkIdentifier();
            this.check(ni, this.translate("action.destroy"));
        });
        this.listen(events.packetBefore(MinecraftPacketIds.LevelSoundEvent), (pk, ni) => {
            if (pk.sound === 42 && !pk.disableRelativeVolume) {
                const titleId = DB.titleId(ni);
                if (titleId === "Unknown") return;
                if (titleId === TitleId.ANDROID.toString()) return;
                if (titleId === TitleId.IOS.toString()) return;
                if (this.check(ni, this.translate("action.hitAir"))) return CANCEL;
            }
        });
        this.listen(events.playerAttack, event => {
            const ni = event.player.getNetworkIdentifier();
            if (this.check(ni, this.translate("action.attack"))) return CANCEL;
        });
    }
    unload(): void {
    }

    check(ni: NetworkIdentifier, action: string): boolean {
        const lastSwing = DB.getPlayerData(ni, "NoSwing.last") ?? 0;
        if (lastSwing === 0) {
            this.suspect(ni, this.translate("suspect.never", [action]));
            return true;
        }
        const laternacy = (Date.now() - lastSwing) - Utils.getPing(ni);
        if (laternacy > 1000) {
            this.suspect(ni, this.translate("suspect.tooLongAgo", [action, laternacy.toString()]));
            return true;
        }
        return false;
    }
}