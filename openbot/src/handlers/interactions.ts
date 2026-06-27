// @ts-nocheck
import {
  Interaction,
  InteractionType,
  ComponentType,
  MessageFlags,
  InteractionReplyOptions,
  InteractionUpdateOptions,
} from "discord.js";
import { handleStatusCommand } from "../commands/status";
import { handleConnectionCommand } from "../commands/connection";

export interface FlowEntry {
  mode: "send_new" | "ephemeral" | "update_message" | "modal";
  responsePayload: Record<string, unknown>;
}

/**
 * In-memory registry: customId → interaction flow definition.
 * Populated when a message is sent via POST /send with a `flows` array.
 */
export const flowRegistry = new Map<string, FlowEntry>();

export async function handleInteraction(interaction: Interaction): Promise<void> {
  // ── /status slash command ───────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case "status":
        await handleStatusCommand(interaction, interaction.client);
        return;
      case "connection":
        await handleConnectionCommand(interaction, interaction.client);
        return;
      default:
        await interaction.reply({
          content: "Unknown command.",
          flags: MessageFlags.Ephemeral,
        });
        return;
    }
  }

  // ── Message component interactions (buttons / selects) ─────────────────────
  if (interaction.type !== InteractionType.MessageComponent) return;

  const isButton = interaction.componentType === ComponentType.Button;
  const isSelect =
    interaction.componentType === ComponentType.StringSelect ||
    interaction.componentType === ComponentType.UserSelect ||
    interaction.componentType === ComponentType.RoleSelect ||
    interaction.componentType === ComponentType.MentionableSelect ||
    interaction.componentType === ComponentType.ChannelSelect;

  if (!isButton && !isSelect) return;

  const customId = interaction.customId;
  const flow = flowRegistry.get(customId);

  if (!flow) {
    await interaction.reply({
      content: "This interaction is no longer active.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { mode, responsePayload } = flow;

  try {
    if (mode === "ephemeral") {
      await interaction.reply({
        ...(responsePayload as InteractionReplyOptions),
        flags: ((responsePayload.flags as number | undefined) ?? 0) | MessageFlags.Ephemeral,
      });
    } else if (mode === "update_message") {
      await interaction.update(responsePayload as InteractionUpdateOptions);
    } else if (mode === "modal") {
      if (responsePayload.type === "MODAL" && responsePayload.data) {
        await interaction.showModal(responsePayload.data as Parameters<typeof interaction.showModal>[0]);
      } else {
        await interaction.reply({
          ...(responsePayload as InteractionReplyOptions),
          flags: ((responsePayload.flags as number | undefined) ?? 0) | MessageFlags.Ephemeral,
        });
      }
    } else {
      // send_new — reply visible to everyone
      await interaction.reply(responsePayload as InteractionReplyOptions);
    }
  } catch (err) {
    console.error("[OpenBot] Interaction handler error:", err);
    try {
      if (interaction.replied || interaction.deferred) return;
      await interaction.reply({
        content: "An error occurred handling this interaction.",
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      // already replied — ignore
    }
  }
}

/**
 * Register or refresh a batch of interaction flows.
 * Called by the /send API endpoint after a message is successfully sent.
 */
export function registerFlows(
  flows: Array<{ customId: string; mode: string; responsePayload: Record<string, unknown> }>
): void {
  for (const flow of flows) {
    flowRegistry.set(flow.customId, {
      mode: flow.mode as FlowEntry["mode"],
      responsePayload: flow.responsePayload,
    });
  }
}
