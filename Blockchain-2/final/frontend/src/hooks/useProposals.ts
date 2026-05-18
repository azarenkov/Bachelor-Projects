import { useQuery } from "@tanstack/react-query";
import { GraphQLClient, gql } from "graphql-request";
import { SUBGRAPH_URL } from "../config/addresses";

export interface ProposalRow {
    id: string;
    proposalId: string;
    proposer: string;
    description: string;
    state: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    voteStart: string;
    voteEnd: string;
    executed: boolean;
    canceled: boolean;
}

const client = new GraphQLClient(SUBGRAPH_URL);

const PROPOSALS_QUERY = gql`
    query Proposals {
        proposals(orderBy: voteStart, orderDirection: desc, first: 50) {
            id
            proposalId
            proposer
            description
            state
            forVotes
            againstVotes
            abstainVotes
            voteStart
            voteEnd
            executed
            canceled
        }
    }
`;

export function useProposals() {
    return useQuery({
        queryKey: ["proposals"],
        queryFn: async () => {
            const res = await client.request<{ proposals: ProposalRow[] }>(PROPOSALS_QUERY);
            return res.proposals;
        },
        staleTime: 15_000,
    });
}
