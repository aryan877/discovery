import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function Back() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="mb-8"
      onClick={() => {
        router.back();
      }}
    >
      <ArrowLeft />
    </Button>
  );
}

export default Back;
