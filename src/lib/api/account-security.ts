import type { RegistrationChallenge, RegistrationResend } from "@/context/AuthContext";

export function configuredProvider(providers: readonly { name: string }[]) {
  return providers.find(provider => provider.name === "google" || provider.name === "facebook")?.name ?? "";
}
export function registrationAfterResend(previous: RegistrationChallenge, next: RegistrationResend): RegistrationChallenge {
  return { ...next, method: previous.method, maskedDestination: previous.maskedDestination };
}
