"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Search, LogOut, Settings, Users, ShoppingCart, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function AdminHeader() {
  const [notifications] = useState(3) // Mock notification count
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentUser, setCurrentUser] = useState<{
    email: string
    full_name: string | null
    role: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("email, full_name, role")
          .eq("id", user.id)
          .single()

        if (userProfile) {
          setCurrentUser(userProfile)
        } else {
          setCurrentUser({
            email: user.email || "admin@duoheads.com",
            full_name: null,
            role: "admin",
          })
        }
      }
    }

    fetchCurrentUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true)
        await performSearch(searchQuery)
        setIsSearching(false)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    try {
      const supabase = createClient()
      const results: any[] = []

      const { data: users } = await supabase
        .from("users")
        .select("id, email, full_name, role")
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5)

      if (users) {
        results.push(
          ...users.map((user) => ({
            ...user,
            type: "user",
            title: user.full_name || user.email,
            subtitle: user.email,
            icon: Users,
          })),
        )
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("id, user_id, total, status, created_at")
        .or(`id.ilike.%${query}%,status.ilike.%${query}%`)
        .limit(5)

      if (orders) {
        results.push(
          ...orders.map((order) => ({
            ...order,
            type: "order",
            title: `Order #${order.id}`,
            subtitle: `$${order.total} - ${order.status}`,
            icon: ShoppingCart,
          })),
        )
      }

      const { data: messages } = await supabase
        .from("contact_messages")
        .select("id, name, email, subject, ticket_number")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,subject.ilike.%${query}%,ticket_number.ilike.%${query}%`)
        .limit(5)

      if (messages) {
        results.push(
          ...messages.map((message) => ({
            ...message,
            type: "message",
            title: message.subject,
            subtitle: `${message.name} - ${message.ticket_number}`,
            icon: MessageSquare,
          })),
        )
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }
  }

  const handleResultClick = (result: any) => {
    setShowResults(false)
    setSearchQuery("")

    switch (result.type) {
      case "user":
        router.push(`/admin/users?search=${result.email}`)
        break
      case "order":
        router.push(`/admin/orders?search=${result.id}`)
        break
      case "message":
        router.push(`/admin/contact-messages?search=${result.ticket_number}`)
        break
    }
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger />

      <div className="flex-1 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users, orders, messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-sm text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  {searchResults.map((result, index) => {
                    const Icon = result.icon
                    return (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleResultClick(result)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{result.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>
                  {currentUser?.full_name
                    ? currentUser.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : currentUser?.email?.[0]?.toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.full_name || "Admin User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser?.email || "Loading..."}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (window.location.href = "/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
