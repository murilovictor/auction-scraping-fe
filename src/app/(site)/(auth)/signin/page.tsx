import Signin from "@/components/Auth/SignIn";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Entrar | Play Leilões",
};

const SigninPage = () => {
  return (
    <>
      <Breadcrumb pageName="Entrar" />

      <Signin />
    </>
  );
};

export default SigninPage;
