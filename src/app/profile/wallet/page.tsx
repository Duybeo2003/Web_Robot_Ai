import { getWallet, getWalletTransactions } from "@/actions/wallet";
import WalletClientPage from "./client-page";

export default async function WalletPage() {
  const wallet = await getWallet();
  const transactions = await getWalletTransactions();

  return (
    <WalletClientPage 
      wallet={wallet} 
      transactions={transactions} 
      bankConfig={{
        bankId: process.env.BANK_ID || "",
        accountNo: process.env.BANK_ACCOUNT_NO || "",
        accountName: process.env.BANK_ACCOUNT_NAME || "",
      }}
    />
  );
}
