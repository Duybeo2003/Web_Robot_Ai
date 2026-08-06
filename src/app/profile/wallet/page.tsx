import { getWallet, getWalletTransactions } from "@/actions/wallet";
import WalletClientPage from "./client-page";

export default async function WalletPage() {
  const wallet = await getWallet();
  const transactions = await getWalletTransactions();

  return (
    <WalletClientPage 
      wallet={wallet} 
      transactions={transactions} 
    />
  );
}
