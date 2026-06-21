import { ContainerNode } from "./nodes/ContainerNode";
import { SectionNode } from "./nodes/SectionNode";
import { TextDisplayNode } from "./nodes/TextDisplayNode";
import { ThumbnailNode } from "./nodes/ThumbnailNode";
import { MediaGalleryNode } from "./nodes/MediaGalleryNode";
import { SeparatorNode } from "./nodes/SeparatorNode";
import { ActionRowNode } from "./nodes/ActionRowNode";
import { ButtonNode } from "./nodes/ButtonNode";
import { EmbedNode } from "./nodes/EmbedNode";
import { SelectMenuNode } from "./nodes/SelectMenuNode";
import { AutoSelectNode } from "./nodes/AutoSelectNode";
import { TextInputNode } from "./nodes/TextInputNode";
import { BotNode } from "./nodes/BotNode";

export const nodeTypes = {
  container: ContainerNode,
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
};
