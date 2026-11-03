"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderTree,
  Users,
  Shield,
  KeyRound,
  Settings,
  ChevronDown,
  GitBranch,
  FileText,
  Inbox,
  Plus,
  PanelLeftClose,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  section: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: number;
  children?: {
    key: string;
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    permission?: string;
    badge?: number;
  }[];
}

const menuItems: MenuItem[] = [
  // MAIN
  {
    key: "dashboard",
    section: "Main",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  // MASTER DATA
  {
    key: "master-data",
    section: "Master Data",
    label: "Categories",
    href: "/dashboard/master-data/category",
    icon: FolderTree,
    permission: "master-data.view",
  },

  // USER MANAGEMENT
  {
    key: "user-management",
    section: "User Management",
    label: "User Management",
    icon: Users,
    children: [
      {
        key: "users",
        label: "Users",
        href: "/dashboard/user-management/user",
        icon: Users,
        permission: "user.view",
      },
      {
        key: "roles",
        label: "Roles",
        href: "/dashboard/user-management/role",
        icon: Shield,
        permission: "role.view",
      },
      {
        key: "permissions",
        label: "Permissions",
        href: "/dashboard/user-management/permission",
        icon: KeyRound,
        permission: "permission.view",
      },
    ],
  },

  // CONFIGURATION
  {
    key: "configuration",
    section: "Configuration",
    label: "Approval Lines",
    href: "/dashboard/configuration/approval-line",
    icon: GitBranch,
    permission: "configuration.approval-line.view",
  },

  // DOCUMENT REQUEST
  {
    key: "document-request",
    section: "Document Request",
    label: "Document Requests",
    icon: FileText,
    children: [
      {
        key: "my-requests",
        label: "My Requests",
        href: "/dashboard/document-request",
        icon: FileText,
        permission: "document-request.view",
      },
      {
        key: "approval-inbox",
        label: "Approval Inbox",
        href: "/dashboard/approval-inbox",
        icon: Inbox,
        permission: "approval.review",
      },
    ],
  },

  // SYSTEM
  {
    key: "settings",
    section: "System",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "document-request",
    "user-management",
  ]);
  const pathname = usePathname();
  const { data: session } = useSession();

  const toggleExpand = (item: string) => {
    setExpandedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.children?.some(
        (child) =>
          pathname === child.href || pathname.startsWith(child.href + "/"),
      ),
    );
    if (activeParent && !expandedItems.includes(activeParent.key)) {
      setExpandedItems((prev) => [...prev, activeParent.key]);
    }
  }, [pathname]);

  const permissions = session?.user?.permissions || [];
  const permissionsKey = permissions.join(',');
  const [inboxCount, setInboxCount] = useState<number>(0);

  useEffect(() => {
    if (!permissions.includes("approval.review")) {
      setInboxCount(0);
      return;
    }

    let isMounted = true;
    fetch("/api/document-request/inbox?page=1&per_page=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && typeof json?.data?.pagination?.total === "number") {
          setInboxCount(json.data.pagination.total);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [permissionsKey, pathname]);

  const filteredItems = menuItems.filter((item) => {
    if (item.permission && !permissions.includes(item.permission)) {
      return false;
    }
    if (item.children) {
      const hasVisibleChild = item.children.some(
        (child) => !child.permission || permissions.includes(child.permission),
      );
      if (!hasVisibleChild) return false;
    }
    return true;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-14 px-margin flex items-center justify-center relative border-b border-outline-variant/30 shrink-0">
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src="/assets/cbc954a6519ff310baa5cbff4ac5fc4ac8ac03d0.png"
              alt="Logo"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface lg:hidden"
            type="button"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* New Request CTA Button */}
          <div className="px-margin py-space-sm">
            <Link
              href="/dashboard/document-request"
              className="w-full h-8 rounded bg-[#ec4899] hover:bg-[#db2777] text-black flex items-center justify-center gap-space-xs font-label-md text-label-md transition-colors font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">New Request</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="px-space-md py-space-xs space-y-1 flex-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                item.children?.some((c) => pathname === c.href);
              const isExpanded = expandedItems.includes(item.key);

              if (!item.children) {
                return (
                  <Link
                    key={item.key}
                    href={item.href || "#"}
                    className={`flex items-center gap-space-sm px-space-sm py-2 rounded transition-colors font-label-md text-label-md ${
                      isActive
                        ? "bg-[#ec4899]/20 text-on-surface font-semibold"
                        : "text-on-surface-variant hover:bg-[#ec4899]/10 hover:text-on-surface"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-1.5 py-0.2 rounded-full font-label-sm text-label-sm bg-[#ec4899]/20 text-on-surface font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <div key={item.key} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.key)}
                    className={`w-full flex items-center justify-between px-space-sm py-2 rounded font-label-md text-label-md transition-colors ${
                      isActive
                        ? "text-on-surface font-semibold"
                        : "text-on-surface-variant hover:bg-[#ec4899]/10 hover:text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-space-sm truncate">
                      {Icon && <Icon className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="pl-6 space-y-1 border-l border-outline-variant/30 ml-3 py-0.5">
                      {item.children
                        .filter(
                          (child) =>
                            !child.permission ||
                            permissions.includes(child.permission),
                        )
                        .map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = pathname === child.href;
                          const currentBadge =
                            child.key === "approval-inbox"
                              ? inboxCount
                              : child.badge;

                          return (
                            <Link
                              key={child.key}
                              href={child.href}
                              className={`flex items-center justify-between px-space-sm py-1.5 rounded font-label-md text-label-md transition-colors ${
                                isChildActive
                                  ? "bg-[#ec4899]/20 text-on-surface font-semibold"
                                  : "text-secondary hover:bg-[#ec4899]/10 hover:text-on-surface"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {ChildIcon && (
                                  <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span className="truncate">{child.label}</span>
                              </div>
                              {Boolean(currentBadge && currentBadge > 0) && (
                                <span className="px-1.5 py-0.2 rounded-full font-label-sm text-label-sm bg-[#ec4899]/20 text-on-surface font-medium">
                                  {currentBadge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
