import { Metadata } from "next";

export const title = "Chainlink Price Feed Dashboard";
export const description =
  "A real‑time dashboard displaying Chainlink price feeds for BTC, ETH, and SOL with interactive graphs.";
export const url = "https://your-domain.com";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [`${url}/logo.png`],
    },
  };
}
