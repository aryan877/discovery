# DISCOVRY: Decentralized Sovereign Community Voting

DISCOVRY is a decentralized voting application built on the Solana blockchain, designed to run within a DSCVR Canvas. It empowers communities to create proposals, cast votes, and view results in real-time, all recorded on-chain for transparency and fairness.

## Features

- Create proposals with a rich text editor (Markdown support)
- On-chain voting using Solana smart contracts
- Real-time results and transparent decision-making
- Designed for any group size
- Runs inside DSCVR Canvas

## Quick Links

- [Frontend Repository](https://github.com/aryan877/discovery)
- [Smart Contract Repository](https://github.com/aryan877/discovery-anchor)
- [DSCVR Post](https://dscvr.one/post/1201388655764045836)
- [Demo Video](https://youtu.be/5r9OR6-5ymg)

## Setup Instructions

1. Clone the repository:

   ```
   git clone https://github.com/aryan877/discovery.git
   cd discovery
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add:

   ```
   NEXT_PUBLIC_DSCVR_GRAPHQL_ENDPOINT=https://api.dscvr.one/graphql
   NEXT_PUBLIC_PROGRAM_ID=8eCnu6Px3bSjsAdWFN1CYm6y4tYegAJU7Kd5Cy5Tw62R
   ```

4. Run the development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Technologies

- Next.js
- Solana Blockchain
- DSCVR Canvas

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any queries, reach out to [@aryankumar877](https://github.com/aryan877) on GitHub.
