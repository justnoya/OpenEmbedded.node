// @ts-nocheck
import { ContainerNode } from "./nodes/ContainerNode.js";
import { SectionNode } from "./nodes/SectionNode.js";
import { TextDisplayNode } from "./nodes/TextDisplayNode.js";
import { ThumbnailNode } from "./nodes/ThumbnailNode.js";
import { MediaGalleryNode } from "./nodes/MediaGalleryNode.js";
import { SeparatorNode } from "./nodes/SeparatorNode.js";
import { ActionRowNode } from "./nodes/ActionRowNode.js";
import { ButtonNode } from "./nodes/ButtonNode.js";
import { EmbedNode } from "./nodes/EmbedNode.js";
import { EmbeddNode } from "./nodes/EmbeddNode.js";
import { SelectMenuNode } from "./nodes/SelectMenuNode.js";
import { AutoSelectNode } from "./nodes/AutoSelectNode.js";
import { TextInputNode } from "./nodes/TextInputNode.js";
import { BotNode } from "./nodes/BotNode.js";
import { WebhookNode } from "./nodes/WebhookNode.js";
import { OpenEmbeddedNode } from "./nodes/OpenEmbeddedNode.js";
import { MessageNode } from "./nodes/MessageNode.js";
import { ModalNode } from "./nodes/ModalNode.js";
import { ScheduleNode } from "./nodes/ScheduleNode.js";

export const nodeTypes = {
  container: ContainerNode,
  embedd: EmbeddNode,
  section: SectionNode,
  textDisplay: TextDisplayNode,
  thumbnail: ThumbnailNode,
  mediaGallery: MediaGalleryNode,
  separator: SeparatorNode,
  actionRow: ActionRowNode,
  button: ButtonNode,
  embed: EmbedNode,
  selectMenu: SelectMenuNode,
  userSelect: AutoSelectNode,
  roleSelect: AutoSelectNode,
  mentionableSelect: AutoSelectNode,
  channelSelect: AutoSelectNode,
  textInput: TextInputNode,
  bot: BotNode,
  webhook: WebhookNode,
  openembedded: OpenEmbeddedNode,
  message: MessageNode,
  modal: ModalNode,
  schedule: ScheduleNode,
};
