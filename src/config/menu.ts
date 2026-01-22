import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
} from "lucide-react"

export type MenuItem = {
  title: string
  url: string
  icon?: any
  items?: MenuItem[]
}

export const menuData: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Accounting",
    url: "#accounting",
    icon: FileText,
    items: [
      {
        title: "Transaction Entry",
        url: "/accounting/transactions",
        icon: FileText,
      },
      {
        title: "Monthly Stats",
        url: "/accounting/monthly",
        icon: FileText,
      },
      {
        title: "Yearly Summary",
        url: "/accounting/yearly",
        icon: FileText,
      },
    ],
  },
  {
    title: "System",
    url: "#system", // ?닻맒竊???뗥킑 ????    icon: Settings,
    items: [
      {
        title: "User Management",
        url: "/system/users",
        icon: Users,
      },
      {
        title: "Main Codes",
        url: "/system/main-codes",
        icon: FileText,
      },
      {
        title: "Sub Codes",
        url: "/system/sub-codes",
        icon: FileText,
      },
      {
        title: "Role Management",
        url: "/system/roles",
        icon: Users,
      },
    ],
  },
]
