import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
    ProposalCanceled,
    ProposalCreated,
    ProposalExecuted,
    VoteCast,
} from "../generated/ProtocolGovernor/ProtocolGovernor";
import { Proposal, Vote } from "../generated/schema";

function pidToBytes(pid: BigInt): Bytes {
    return Bytes.fromByteArray(Bytes.fromBigInt(pid));
}

export function handleProposalCreated(event: ProposalCreated): void {
    const id = pidToBytes(event.params.proposalId);
    const p = new Proposal(id);
    p.proposalId = event.params.proposalId;
    p.proposer = event.params.proposer;
    p.description = event.params.description;
    p.state = "Pending";
    p.forVotes = BigInt.zero();
    p.againstVotes = BigInt.zero();
    p.abstainVotes = BigInt.zero();
    p.voteStart = event.params.voteStart;
    p.voteEnd = event.params.voteEnd;
    p.executed = false;
    p.canceled = false;
    p.save();
}

export function handleVoteCast(event: VoteCast): void {
    const pid = pidToBytes(event.params.proposalId);
    const proposal = Proposal.load(pid);
    if (proposal == null) return;

    if (event.params.support == 0) proposal.againstVotes = proposal.againstVotes.plus(event.params.weight);
    if (event.params.support == 1) proposal.forVotes = proposal.forVotes.plus(event.params.weight);
    if (event.params.support == 2) proposal.abstainVotes = proposal.abstainVotes.plus(event.params.weight);
    proposal.save();

    const v = new Vote(event.transaction.hash.concatI32(event.logIndex.toI32()));
    v.proposal = pid;
    v.voter = event.params.voter;
    v.support = event.params.support;
    v.weight = event.params.weight;
    v.reason = event.params.reason;
    v.timestamp = event.block.timestamp;
    v.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
    const id = pidToBytes(event.params.proposalId);
    const p = Proposal.load(id);
    if (p == null) return;
    p.executed = true;
    p.state = "Executed";
    p.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
    const id = pidToBytes(event.params.proposalId);
    const p = Proposal.load(id);
    if (p == null) return;
    p.canceled = true;
    p.state = "Canceled";
    p.save();
}
