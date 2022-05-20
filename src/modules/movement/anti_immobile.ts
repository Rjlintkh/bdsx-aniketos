import { ActorFlags } from "bdsx/bds/actor";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { MovePlayerPacket, PlayerAuthInputPacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t } from "bdsx/nativetype";
import { Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

const DEBUG = false;

export default class AntiImmobile extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    langModel = () => {
    /*
        name=Anti-Immobile
        description=Force players with immobile flag to stay.
    */};

    load(): void {
        if (DEBUG) {
            this.registerCommand(({value}, origin, output) => {
                origin.getEntity()!.setStatusFlag(ActorFlags.NoAI, value);
            }, {value:bool_t});
        }
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Up) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Down) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Left) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.Right) ||
                Utils.getAuthInputData(pk, PlayerAuthInputPacket.InputData.WantUp)) {
                const player = ni.getActor()!;
                if (player.getStatusFlag(ActorFlags.NoAI)) {
                    const pk = MovePlayerPacket.allocate();
                    pk.actorId = player.getRuntimeID();
                    pk.pos.x = player.getPosition().x;
                    pk.pos.y = player.getPosition().y;
                    pk.pos.z = player.getPosition().z;
                    pk.pitch = player.getRotation().x;
                    pk.yaw = player.getRotation().y;
                    pk.headYaw = player.getRotation().y;
                    pk.sendTo(ni);
                    pk.dispose();
                    return CANCEL;
                }
            }
        });
    }
    unload(): void {
    }
}
