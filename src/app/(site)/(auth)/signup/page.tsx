import SignUp from "@/components/Auth/SignUp";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Criar conta | Play Leilões",
};

const SignupPage = () => {
  return (
    <>
      <Breadcrumb pageName="Criar conta" />

      <SignUp />
    </>
  );
};

export default SignupPage;
