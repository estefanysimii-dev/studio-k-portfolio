import React from "react";

type IconProps = { name: string; className?: string };

export default function Icon({ name, className = "" }: IconProps) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
    portfolio: <><path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3"/><path d="M4 12h16"/></>,
    products: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></>,
    discord: <><path d="M7 7.5A14 14 0 0 1 17 7.5"/><path d="M6 17c3 2 9 2 12 0"/><path d="M6 6c-2 3-3 7-2 11 2 2 4 3 6 3l1-2"/><path d="M18 6c2 3 3 7 2 11-2 2-4 3-6 3l-1-2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></>,
    account: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-5 4.5-7 8-7s6.5 2 8 7"/></>,
    control: <><path d="M4 7h16"/><path d="M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    spark: <><path d="m12 2 1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></>,
    cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></>
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.spark}
    </svg>
  );
}
