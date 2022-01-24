import { ActorFlags } from "bdsx/bds/actor";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { MovePlayerPacket, PlayerAuthInputPacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t } from "bdsx/nativetype";
import { Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class AntiImmobile extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    langModel = () => {
    /*
        name=Anti-Immobile
        description=Detects if players still moves with immobile flag.

        suspect.generic=Player still moves with immobile flag.

        punish.generic=You are not allowed to move.
    */};
    
    load(): void {
        this.registerCommand((params, origin, output) => {
            origin.getEntity()!.setStatusFlag(ActorFlags.NoAI, params.val);
        }, {val:bool_t});
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Up) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Down) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Left) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Right)) {
                const player = ni.getActor()!;
                if (player.getStatusFlag(ActorFlags.NoAI)) {
                    this.suspect(ni, this.translate("suspect.generic"));
                    if (this.getConfig().punish) {
                        this.punish(ni, this.translate("punish.generic"));
                    } else {
                        const pk = MovePlayerPacket.create();
                        pk.actorId = player.getRuntimeID();
                        pk.pos.x = player.getPosition().x;
                        pk.pos.y = player.getPosition().y;
                        pk.pos.z = player.getPosition().z;
                        pk.pitch = player.getRotation().x;
                        pk.yaw = player.getRotation().y;
                        pk.headYaw = player.getRotation().y;
                        pk.sendTo(ni);
                        pk.dispose();
                    }
                    return CANCEL;
                }
            }
        });
    }
    unload(): void {
    }
}