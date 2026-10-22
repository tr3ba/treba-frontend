import type { SellerApplication, SellerApplicationRequest } from "../../types/sellerApplication";
import { accountRequest } from "./account";

export async function getSellerApplication(): Promise<SellerApplication | null> {
  return (await accountRequest<{ application: SellerApplication | null }>("seller-application")).application;
}

export function submitSellerApplication(request: SellerApplicationRequest): Promise<SellerApplication> {
  return accountRequest("seller-application", { method: "POST", body: request });
}
