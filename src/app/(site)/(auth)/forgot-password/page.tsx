import React from "react";
import ForgotPassword from "@/components/Auth/ForgotPassword";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Esqueci minha senha | Play Leilões",
};

const ForgotPasswordPage = () => {
  return (
    <>
      <Breadcrumb pageName="Esqueci minha senha" />
      <ForgotPassword />
    </>
  );
};

export default ForgotPasswordPage;
