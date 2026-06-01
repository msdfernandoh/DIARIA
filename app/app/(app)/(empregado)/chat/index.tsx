import { ChatInboxList } from "../../../../src/components/ChatInboxList";
import { colors } from "../../../../src/constants/theme";

export default function ChatListScreen() {
  return (
    <ChatInboxList
      mode="empregado"
      chatPath="/(app)/(empregado)/chat/[applicationId]"
      accent={colors.green}
    />
  );
}
