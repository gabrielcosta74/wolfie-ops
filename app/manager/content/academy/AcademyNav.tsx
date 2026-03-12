"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Video, Paperclip, Link2 } from "lucide-react";

const items = [
  { href: "/manager/content/academy", label: "Início", icon: Home, exact: true },
  { href: "/manager/content/academy/resumos", label: "Resumos", icon: BookOpen, exact: false },
  { href: "/manager/content/academy/videos", label: "Vídeos", icon: Video, exact: false },
  { href: "/manager/content/academy/ficheiros", label: "Ficheiros", icon: Paperclip, exact: false },
  { href: "/manager/content/academy/links", label: "Links", icon: Link2, exact: false },
];

export function AcademyNav() {
  const pathname = usePathname();

  return (
    <div className="ac-nav">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ac-nav-item${active ? " active" : ""}`}
          >
            <item.icon size={18} className="ac-nav-icon" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
