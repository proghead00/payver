"use client";

import { useParams } from "next/navigation";
import { GroupProvider } from "@/context/GroupContext/GroupContext";
import GroupPageContent from "@/components/Group/GroupPageContent";

export default function GroupPage() {
  const params = useParams();
  const groupId = params?.id as string;

  return (
    <GroupProvider groupId={groupId}>
      <GroupPageContent />
    </GroupProvider>
  );
}
