"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getCustomerByEmail, syncStripeCustomerWithProfile } from "@/lib/stripe/customers"
import { isStripeConfigured } from "@/lib/stripe/client"
import type { Profile } from "@/lib/supabase/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Search, Edit, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function UsersTable() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("profiles_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
    } else {
      if (isStripeConfigured && data) {
        const usersWithStripeData = await Promise.all(
          data.map(async (user) => {
            if (user.email && !user.stripe_customer_id) {
              const stripeCustomer = await getCustomerByEmail(user.email)
              if (stripeCustomer) {
                await syncStripeCustomerWithProfile(stripeCustomer.id, user.id)
                return { ...user, stripe_customer_id: stripeCustomer.id }
              }
            }
            return user
          }),
        )
        setUsers(usersWithStripeData)
      } else {
        setUsers(data || [])
      }
    }
    setLoading(false)
  }

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      console.error("Error updating user:", error)
    } else {
      fetchUsers()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const deleteUser = async (userId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("profiles").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
    } else {
      fetchUsers()
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage user accounts and subscriptions</CardDescription>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || "No name"}</span>
                    <span className="text-sm text-muted-foreground">@{user.username || "no-username"}</span>
                    {user.stripe_customer_id && (
                      <span className="text-xs text-muted-foreground font-mono">Stripe: {user.stripe_customer_id}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email || "No email"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.subscription_tier}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getSubscriptionBadgeColor(user.subscription_status)}>
                    {user.subscription_status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit user
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Make changes to the user account here.</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    defaultValue={selectedUser.full_name || ""}
                    className="col-span-3"
                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    defaultValue={selectedUser.email || ""}
                    className="col-span-3"
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subscription_tier" className="text-right">
                    Subscription
                  </Label>
                  <Select
                    defaultValue={selectedUser.subscription_tier}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, subscription_tier: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Seedling">Seedling</SelectItem>
                      <SelectItem value="Forest Guardian">Forest Guardian</SelectItem>
                      <SelectItem value="Jungle Master">Jungle Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subscription_status" className="text-right">
                    Status
                  </Label>
                  <Select
                    defaultValue={selectedUser.subscription_status}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, subscription_status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={() => selectedUser && updateUser(selectedUser.id, selectedUser)}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
