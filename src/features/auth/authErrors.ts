import type { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/too-many-requests":
    "Muitas tentativas. Aguarde um momento e tente de novo.",
  "auth/network-request-failed":
    "Sem conexão. Verifique a internet e tente novamente.",
  "auth/operation-not-allowed": "Login por e-mail não está habilitado.",
  "auth/missing-password": "Informe a senha.",
  "auth/missing-email": "Informe o e-mail.",
  "auth/requires-recent-login":
    "Por segurança, faça login novamente antes desta ação.",
  "auth/not-authenticated": "Você precisa estar conectado.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (isFirebaseError(error)) {
    return AUTH_ERROR_MESSAGES[error.code] ?? "Não foi possível concluir. Tente novamente.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível concluir. Tente novamente.";
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  );
}
