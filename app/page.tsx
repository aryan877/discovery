import React from "react";
import CanvasClientWrapper from "./component/CanvasClientComponent";
import CreateProposal from "./component/CreateProposal";
import ProposalFeed from "./component/ProposalFeed";

function Home() {
  return (
    <div>
      <CreateProposal />
      <ProposalFeed />
      <CanvasClientWrapper />
    </div>
  );
}

export default Home;
