import { ChatInboxList } from "../../../../src/components/ChatInboxList";
import { colors } from "../../../../src/constants/theme";

export default function EmpregadorChatInbox() {
  return (
    <ChatInboxList
      mode="empregador"
      chatPath="/(app)/(empregador)/chat/[applicationId]"
      accent={colors.primary}
    />
  );
}
