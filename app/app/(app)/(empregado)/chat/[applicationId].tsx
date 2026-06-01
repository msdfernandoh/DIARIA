import { useLocalSearchParams } from "expo-router";
import { ChatConversationScreen } from "../../../../src/components/ChatConversationScreen";
import { colors } from "../../../../src/constants/theme";

export default function ChatScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  if (!applicationId) return null;
  return <ChatConversationScreen applicationId={applicationId} accentColor={colors.green} />;
}
