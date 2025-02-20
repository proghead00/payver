import React from "react";

const Chat = ({ groupId }: { groupId: string }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
      <p>{groupId}</p>
    </div>
  );
};

export default Chat;
