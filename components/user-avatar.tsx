"use client";

import { useState } from "react";

type Props = {
  src?: string;
  name?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export default function UserAvatar({ src, name = "K", imageClassName, fallbackClassName }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (src && src !== failedSrc) {
    return <img className={imageClassName} src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />;
  }

  return <div className={fallbackClassName} aria-hidden="true">{name.trim().slice(0, 1).toUpperCase() || "K"}</div>;
}
