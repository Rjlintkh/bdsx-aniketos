import { ContainerType } from "bdsx/bds/inventory";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { MovePlayerPacket } from "bdsx/bds/packets";
import { events } from "bdsx/event";
import { DB } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class InventoryMove extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Inventory Move
        description=Detects if players still move when opening inventory screens.

        suspect.generic=Player still moving when opening inventory screen.

        punish.generic=Do not move when opening inventory screen.
    */};

    load(): void {
        this.listen(events.packetSend(MinecraftPacketIds.ContainerOpen), (pk, ni) => {
            if (pk.type !== ContainerType.CommandBlock) {
                DB.setPlayerData(ni, true, "InventoryMove.open");
            }
        });
        this.listen(events.packetBefore(MinecraftPacketIds.ContainerClose), (pk, ni) => {
            DB.setPlayerData(ni, false, "InventoryMove.open");
        });
        this.listen(events.packetAfter(MinecraftPacketIds.PlayerAuthInput), (pk, ni) => {
            if (DB.getPlayerData(ni, "InventoryMove.open")) {
                const player = ni.getActor()!;
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
            }
        });
    }
    unload(): void {
    }
}