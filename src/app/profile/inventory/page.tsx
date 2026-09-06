import { getUserInventory } from "@/actions/user-inventory";
import InventoryClientPage from "./client-page";

export default async function InventoryPage() {
  const inventory = await getUserInventory();

  return <InventoryClientPage inventory={inventory} />;
}
