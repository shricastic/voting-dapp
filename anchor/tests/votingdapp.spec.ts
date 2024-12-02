import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey} from '@solana/web3.js'
import {Votingdapp} from '../target/types/votingdapp'
import { BankrunProvider, startAnchor } from "anchor-bankrun";

const IDL = require('../target/idl/votingdapp.json')
const votingdappAddress = new PublicKey("CstCjwHJP5GtAEAoFVLR4wAnHes8DyLHPpzkKUgwQtUV")

describe('votingdapp', () => {
  let context, provider:any;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingdappProgram = anchor.workspace.votingdapp as Program<Votingdapp>;
  beforeAll(async() => {
    context = await startAnchor("", [{name: "votingdapp", programId: votingdappAddress}], []); 
    provider = new BankrunProvider(context);

    votingdappProgram = new Program<Votingdapp>(
      IDL, provider
    );
  })

  it('Initialize Poll', async () =>{
    await votingdappProgram.methods.initializePoll(
      new anchor.BN(1),
      "Which candidate you vote for this election?",
      new anchor.BN(0),
      new anchor.BN(1832994801),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingdappAddress
    )

    const poll = await votingdappProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("Which candidate you vote for this election?")
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())

  })
  
  it('Initialize Candidate', async () =>{
    await votingdappProgram.methods.initializeCandidates(
      "Bozo the clown",
      new anchor.BN(1)
    ).rpc();

    await votingdappProgram.methods.initializeCandidates(
      "Krusty the clown",
      new anchor.BN(1)
    ).rpc();

    const[candidate1Address] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Bozo the clown")],
      votingdappAddress
    )
    const bozoCandidate = await votingdappProgram.account.candidate.fetch(candidate1Address);
    
    const[candidate2Address] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Krusty the clown")],
      votingdappAddress
    )
    const krustyCandidate = await votingdappProgram.account.candidate.fetch(candidate2Address);
    
    expect(bozoCandidate.candidateVotes.toNumber()).toEqual(0)
    expect(krustyCandidate.candidateVotes.toNumber()).toEqual(0)

    console.log(bozoCandidate)
    console.log(krustyCandidate)

  })

  it('VoteCandidate', async () => {
      const [pollAddress] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
          votingdappAddress
      );

      const [candidate1Address] = PublicKey.findProgramAddressSync(
          [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Bozo the clown")],
          votingdappAddress
      );

      await votingdappProgram.methods.voteCandidate(
          "Bozo the clown",  // Explicitly pass candidate name
          new anchor.BN(1)   // Explicitly pass poll ID
      ).rpc();

      const bozoCandidate = await votingdappProgram.account.candidate.fetch(candidate1Address);
      console.log(bozoCandidate);

      expect(bozoCandidate.candidateVotes.toNumber()).toEqual(1);
  });
})
