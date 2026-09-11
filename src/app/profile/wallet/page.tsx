import { getWallet, getWalletTransactions } from "@/actions/wallet";
import WalletClientPage from "./client-page";
import { Suspense } from "react";

export default async function WalletPage() {
  const wallet = await getWallet();
  const transactions = await getWalletTransactions();

  const vnpayConfigured = !!(
    process.env.VNP_TMN_CODE &&
    process.env.VNP_HASH_SECRET &&
    process.env.VNP_URL
  );

  return (
    <Suspense>
      <WalletClientPage
        wallet={wallet}
        transactions={transactions}
        bankConfig={{
          bankId: process.env.BANK_ID || "",
          accountNo: process.env.BANK_ACCOUNT_NO || "",
          accountName: process.env.BANK_ACCOUNT_NAME || "",
        }}
        vnpayConfigured={vnpayConfigured}
      />
    </Suspense>
  );
}
