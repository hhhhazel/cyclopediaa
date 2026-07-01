"use client";

import { useRouter, useSearchParams } from "next/navigation";
import MemeEditor from "../../components/meme/MemeEditor";

const DEFAULT_GIF = "/images/cyberclone-01.gif";

export default function MemePage() {
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
