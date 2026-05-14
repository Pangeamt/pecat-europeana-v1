"use client";

import React from "react";
import { TusList } from "@/components/Tus";

import { useParams } from "next/navigation";

const Tus = ({}) => {
  const { projectId } = useParams();

  return (
    <div>
      <TusList />
    </div>
  );
};

export default Tus;
