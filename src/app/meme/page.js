"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MemeEditor from "../../components/meme/MemeEditor";

const DEFAULT_GIF = "/images/cyberclone-01.gif";

function MemePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gif = searchParams.get("gif") || DEFAULT_GIF;

  return (
    <MemeEditor
      gifSrc={gif}
      onClose={function () {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/field");
        }
      }}
      onUploadSuccess={function () {
        router.push("/gallery");
      }}
    />
  );
}

export default function MemePage() {
  return (
    <Suspense fallback={null}>
      <MemePageContent />
    </Suspense>
  );
}
