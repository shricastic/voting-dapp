import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Votingdapp } from "@/../anchor/target/types/votingdapp";
import { Program, BN } from "@coral-xyz/anchor";

const IDL = require("@/../anchor/target/idl/votingdapp.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://www.parliamentarian.in/wp-content/uploads/2024/05/MK-lead3.jpg",
    title: "Vote for your favorite clown",
    description:
      "Everyone has their favorite clown, especially when you like circus, you can vote for your favorite clown here.",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Bozo the clown",
          href: "/api/vote?candidate=Bozo the clown",
          type: "external-link",
        },
        {
          label: "Vote for Krusty the clown",
          href: "/api/vote?candidate=Krusty the clown",
          type: "external-link",
        },
      ],
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate != "Krusty the clown" && candidate != "Bozo the clown") {
    return new Response("Invalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Votingdapp> = new Program(IDL, { connection });
  const body: ActionPostRequest = await request.json();
  let voter; 

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid Account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const instruction = await program.methods 
    .voteCandidate(candidate, new BN(1)) 
    .accounts({ signer: voter }) 
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  let transaction = new Transaction({
      feePayer: voter,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction
    }
  });

  return Response.json(response, { status: 200, headers: ACTIONS_CORS_HEADERS });
}
