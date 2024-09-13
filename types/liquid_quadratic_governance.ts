/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/liquid_quadratic_governance.json`.
 */
export type LiquidQuadraticGovernance = {
  address: "AEpEkRkBqLz8BwqENLG1eYU82JPqUWrRGNqRmQmpiMao";
  metadata: {
    name: "liquidQuadraticGovernance";
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
          name: "governance";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 111, 118, 101, 114, 110, 97, 110, 99, 101];
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
                path: "governance.proposal_count";
                account: "governance";
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
          signer: true;
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
          name: "governance";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 111, 118, 101, 114, 110, 97, 110, 99, 101];
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
          name: "governance";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 111, 118, 101, 114, 110, 97, 110, 99, 101];
              }
            ];
          };
        },
        {
          name: "admin";
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
      name: "initializeUser";
      discriminator: [111, 17, 185, 250, 60, 122, 38, 254];
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
          writable: true;
          signer: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
          relations: ["governance"];
        },
        {
          name: "governance";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 111, 118, 101, 114, 110, 97, 110, 99, 101];
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "initialBasePower";
          type: "u64";
        }
      ];
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
          name: "voter";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114];
              },
              {
                kind: "account";
                path: "voterAuthority";
              }
            ];
          };
        },
        {
          name: "voterAuthority";
          signer: true;
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
        },
        {
          name: "votingPower";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "governance";
      discriminator: [18, 143, 88, 13, 73, 217, 47, 49];
    },
    {
      name: "proposal";
      discriminator: [26, 94, 189, 187, 116, 136, 53, 33];
    },
    {
      name: "user";
      discriminator: [159, 117, 95, 227, 239, 151, 58, 236];
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
      name: "numericalOverflow";
      msg: "Numerical overflow occurred";
    },
    {
      code: 6001;
      name: "proposalNotActive";
      msg: "Proposal is not active";
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
      name: "alreadyDelegated";
      msg: "User has already delegated their voting power";
    },
    {
      code: 6006;
      name: "notDelegated";
      msg: "User has not delegated their voting power";
    }
  ];
  types: [
    {
      name: "governance";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "proposalCount";
            type: "u64";
          },
          {
            name: "totalBasePower";
            type: "u64";
          }
        ];
      };
    },
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
            name: "basePower";
            type: "u64";
          },
          {
            name: "reputation";
            type: "u8";
          },
          {
            name: "lastVoteTime";
            type: "i64";
          },
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
          },
          {
            name: "votingPower";
            type: "u64";
          },
          {
            name: "originalVotingPower";
            type: "u64";
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
    }
  ];
};
