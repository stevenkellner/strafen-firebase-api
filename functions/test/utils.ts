import {initializeApp} from "firebase/app";
import {getFunctions, httpsCallable, HttpsCallableResult} from "firebase/functions";
import {getAuth, signInWithEmailAndPassword, UserCredential} from "firebase/auth";
import {firebaseConfig} from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "europe-west1");
export const auth = getAuth();

export async function callFunction(functionName: string, parameters: any | null): Promise<HttpsCallableResult<unknown>> {
    return await httpsCallable(functions, functionName)(parameters);
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function signInTestUser(): Promise<UserCredential> {
    return await signIn("functions-tests-user@mail.com", "ghQshXA7rnDdGWj8GffSQN7VGrm9Qf3Z");
}
