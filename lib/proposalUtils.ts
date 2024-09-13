import { PublicKey } from "@solana/web3.js";

export interface ProposalStatus {
  active?: {};
  passed?: {};
  rejected?: {};
}

export interface ProposalAccount {
  id: bigint;
  title: string;
  description: string;
  creator: PublicKey;
  yesVotes: bigint;
  noVotes: bigint;
  status: ProposalStatus;
  startTime: number;
  endTime: number;
}

export interface Proposal {
  publicKey: string;
  account: ProposalAccount;
}

export function deserializeProposal(
  publicKey: string,
  accountData: Buffer
): Proposal | null {
  try {
    const PROPOSAL_DISCRIMINATOR = Buffer.from([
      26, 94, 189, 187, 116, 136, 53, 33,
    ]);
    if (!accountData.slice(0, 8).equals(PROPOSAL_DISCRIMINATOR)) {
      return null;
    }

    let offset = 8;

    // ID (u64)
    const id = accountData.readBigUInt64LE(offset);
    offset += 8;

    // Title (string)
    const titleLen = accountData.readUInt32LE(offset);
    offset += 4;
    const title = accountData.slice(offset, offset + titleLen).toString("utf8");
    offset += titleLen;

    // Description (string)
    const descriptionLen = accountData.readUInt32LE(offset);
    offset += 4;
    const description = accountData
      .slice(offset, offset + descriptionLen)
      .toString("utf8");
    offset += descriptionLen;

    // Creator (PublicKey, 32 bytes)
    const creator = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    // YesVotes (u64)
    const yesVotes = accountData.readBigUInt64LE(offset);
    offset += 8;

    // NoVotes (u64)
    const noVotes = accountData.readBigUInt64LE(offset);
    offset += 8;

    // Status (enum - Active, Passed, Rejected)
    const statusByte = accountData[offset];
    let status: ProposalStatus;
    if (statusByte === 0) status = { active: {} };
    else if (statusByte === 1) status = { passed: {} };
    else if (statusByte === 2) status = { rejected: {} };
    else throw new Error("Invalid status byte");
    offset += 1;

    // Start Time (i64)
    const startTime = Number(accountData.readBigInt64LE(offset));
    offset += 8;

    // End Time (i64)
    const endTime = Number(accountData.readBigInt64LE(offset));

    return {
      publicKey,
      account: {
        id,
        title,
        description,
        creator,
        yesVotes,
        noVotes,
        status,
        startTime,
        endTime,
      },
    };
  } catch (err) {
    console.error("Error parsing account data:", err);
    return null;
  }
}
