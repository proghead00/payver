import mongoose from "mongoose";
/**
 * Decodes an invite link to extract the group ID.
 * @param inviteLink - The invite link (e.g. -> "https://payver.com/groups/1234567890abcdef12345678")
 * @returns The group ID as a Mongoose ObjectId.
 */
export const decodeInviteLink = (inviteLink) => {
    // Extract the last part of the link (assuming it's the group ID)
    const groupId = inviteLink.split("/").pop();
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
        throw new Error("Invalid invite link");
    }
    return new mongoose.Types.ObjectId(groupId);
};
