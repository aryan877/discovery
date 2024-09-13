/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voting_with_delegation.json`.
 */
export type VotingWithDelegation = {
  address: "EAeyPzTziA1QbpobqkzKF3tSmUXT2WRkahgSkAns8mpz";
  metadata: {
    name: "votingWithDelegation";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "createProposal";
      discriminator: [132, 116, 68, 174, 216, 160, 198, 22];
      accounts: [
        {
          name: "votingState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  111,
                  116,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ];
              }
            ];
          };
        },
        {
          name: "proposal";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 111, 112, 111, 115, 97, 108];
              },
              {
                kind: "account";
                path: "voting_state.proposal_count";
                account: "votingState";
              }
            ];
          };
        },
        {
          name: "proposer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "title";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        },
        {
          name: "votingPeriod";
          type: "i64";
        }
      ];
    },
    {
      name: "delegate";
      discriminator: [90, 147, 75, 178, 85, 88, 4, 137];
      accounts: [
        {
          name: "user";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114];
              },
              {
                kind: "account";
                path: "delegatorAuthority";
              }
            ];
          };
        },
        {
          name: "delegatorAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "delegateTo";
          type: "pubkey";
        }
      ];
    },
    {
      name: "finalizeProposal";
      discriminator: [23, 68, 51, 167, 109, 173, 187, 164];
      accounts: [
        {
          name: "proposal";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 111, 112, 111, 115, 97, 108];
              },
              {
                kind: "account";
                path: "proposal.id";
                account: "proposal";
              }
            ];
          };
        },
        {
          name: "finalizer";
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "votingState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  111,
                  116,
                  105,
                  110,
                  103,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ];
              }
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "undelegate";
      discriminator: [131, 148, 180, 198, 91, 104, 42, 238];
      accounts: [
        {
          name: "user";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114];
              },
              {
                kind: "account";
                path: "userAuthority";
              }
            ];
          };
        },
        {
          name: "userAuthority";
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "vote";
      discriminator: [227, 110, 155, 23, 136, 126, 172, 25];
      accounts: [
        {
          name: "proposal";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [112, 114, 111, 112, 111, 115, 97, 108];
              },
              {
                kind: "account";
                path: "proposal.id";
                account: "proposal";
              }
            ];
          };
        },
        {
          name: "userVote";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 118, 111, 116, 101];
              },
              {
                kind: "account";
                path: "voter";
              },
              {
                kind: "account";
                path: "proposal";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114];
              },
              {
                kind: "account";
                path: "voter";
              }
            ];
          };
        },
        {
          name: "voter";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "voteType";
          type: {
            defined: {
              name: "voteType";
            };
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "proposal";
      discriminator: [26, 94, 189, 187, 116, 136, 53, 33];
    },
    {
      name: "user";
      discriminator: [159, 117, 95, 227, 239, 151, 58, 236];
    },
    {
      name: "userVote";
      discriminator: [136, 163, 243, 202, 202, 124, 112, 53];
    },
    {
      name: "votingState";
      discriminator: [96, 6, 102, 202, 44, 29, 199, 133];
    }
  ];
  events: [
    {
      name: "proposalFinalizedEvent";
      discriminator: [228, 151, 231, 28, 58, 215, 17, 130];
    },
    {
      name: "voteEvent";
      discriminator: [195, 71, 250, 105, 120, 119, 234, 134];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "proposalNotActive";
      msg: "Proposal is not active";
    },
    {
      code: 6001;
      name: "votingPeriodNotStarted";
      msg: "Voting period has not started yet";
    },
    {
      code: 6002;
      name: "votingPeriodEnded";
      msg: "Voting period has ended";
    },
    {
      code: 6003;
      name: "votingPeriodNotEnded";
      msg: "Voting period has not ended yet";
    },
    {
      code: 6004;
      name: "proposalAlreadyFinalized";
      msg: "Proposal has already been finalized";
    },
    {
      code: 6005;
      name: "alreadyVoted";
      msg: "User has already voted on this proposal";
    },
    {
      code: 6006;
      name: "notDelegated";
      msg: "User has not delegated their voting power";
    }
  ];
  types: [
    {
      name: "proposal";
      type: {
        kind: "struct";
        fields: [
          {
            name: "id";
            type: "u64";
          },
          {
            name: "title";
            type: "string";
          },
          {
            name: "description";
            type: "string";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "yesVotes";
            type: "u64";
          },
          {
            name: "noVotes";
            type: "u64";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "proposalStatus";
              };
            };
          },
          {
            name: "startTime";
            type: "i64";
          },
          {
            name: "endTime";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "proposalFinalizedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "proposalId";
            type: "u64";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "proposalStatus";
              };
            };
          },
          {
            name: "yesVotes";
            type: "u64";
          },
          {
            name: "noVotes";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "proposalStatus";
      type: {
        kind: "enum";
        variants: [
          {
            name: "active";
          },
          {
            name: "passed";
          },
          {
            name: "rejected";
          }
        ];
      };
    },
    {
      name: "user";
      type: {
        kind: "struct";
        fields: [
          {
            name: "delegatedTo";
            type: {
              option: "pubkey";
            };
          }
        ];
      };
    },
    {
      name: "userVote";
      type: {
        kind: "struct";
        fields: [
          {
            name: "hasVoted";
            type: "bool";
          },
          {
            name: "voteType";
            type: {
              option: {
                defined: {
                  name: "voteType";
                };
              };
            };
          }
        ];
      };
    },
    {
      name: "voteEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "proposalId";
            type: "u64";
          },
          {
            name: "voter";
            type: "pubkey";
          },
          {
            name: "voteType";
            type: {
              defined: {
                name: "voteType";
              };
            };
          }
        ];
      };
    },
    {
      name: "voteType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "yes";
          },
          {
            name: "no";
          }
        ];
      };
    },
    {
      name: "votingState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "proposalCount";
            type: "u64";
          }
        ];
      };
    }
  ];
};
