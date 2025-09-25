"use client"

import { useState, useEffect } from "react"
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type Admin,
  type CreateAdminData,
  type UpdateAdminData,
} from "@/lib/supabase/admin-management"
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
import { MoreHorizontal, Search, Edit, Trash2, UserPlus, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { getAssignableRoles, canPerformAdminAction } from "@/lib/supabase/permissions"
import { checkAdminStatus } from "@/lib/supabase/admin-management"
import { createClient } from "@/lib/supabase/client"

export function AdminManagementTable() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAdminData, setNewAdminData] = useState<CreateAdminData>({
    email: "",
    password: "",
    full_name: "",
    role: "admin",
  })
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string>("") // Track current user ID to prevent self-editing
  const [assignableRoles, setAssignableRoles] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchAdmins()
    getCurrentUserRole()
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      console.log("[v0] Starting to fetch admins...")
      const adminData = await getAllAdmins()
      console.log("[v0] Successfully fetched admins:", adminData)
      setAdmins(adminData)
    } catch (error) {
      console.error("[v0] Error fetching admins:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserRole = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setCurrentUserId(user.id)
      const { isAdmin, role } = await checkAdminStatus()
      if (isAdmin && role) {
        setCurrentUserRole(role)
        const roles = await getAssignableRoles(role)
        setAssignableRoles(roles)
      }
    }
  }

  const canEditAdmin = (admin: Admin): boolean => {
    if (admin.user_id === currentUserId) {
      return false
    }
    return canPerformAdminAction(currentUserRole, admin.role, "edit")
  }

  const canDeleteAdmin = (admin: Admin): boolean => {
    if (admin.user_id === currentUserId) {
      return false
    }
    return canPerformAdminAction(currentUserRole, admin.role, "delete")
  }

  const handleCreateAdmin = async () => {
    if (!newAdminData.email || !newAdminData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      })
      return
    }

    const result = await createAdmin(newAdminData, currentUserRole)

    if (result.success) {
      toast({
        title: "Success",
        description: "Admin created successfully",
      })
      setIsCreateDialogOpen(false)
      setNewAdminData({ email: "", password: "", full_name: "", role: "admin" })
      fetchAdmins()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create admin",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return

    const updates: UpdateAdminData = {
      role: selectedAdmin.role,
      full_name: selectedAdmin.full_name,
    }

    const result = await updateAdmin(selectedAdmin.id, updates, currentUserRole, selectedAdmin.role)

    if (result.success) {
      toast({
        title: "Success",
        description: "Admin updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedAdmin(null)
      fetchAdmins()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update admin",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (admin.user_id === currentUserId) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return
    }

    const result = await deleteAdmin(admin.id, currentUserRole, admin.role)

    if (result.success) {
      toast({
        title: "Success",
        description: "Admin deleted successfully",
      })
      fetchAdmins()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "moderator":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Admin Management
        </CardTitle>
        <CardDescription>Manage admin users and their permissions</CardDescription>
        <div className="flex items-center justify-between space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{admin.full_name || "No name"}</span>
                    <span className="text-sm text-muted-foreground">@{admin.username || "no-username"}</span>
                  </div>
                </TableCell>
                <TableCell>{admin.email || "No email"}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(admin.role)}>{admin.role.replace("_", " ").toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}</TableCell>
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
                      {canEditAdmin(admin) ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit permissions
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Edit className="mr-2 h-4 w-4" />
                          {admin.user_id === currentUserId ? "Cannot edit yourself" : "No permission to edit"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {canDeleteAdmin(admin) ? (
                        <DropdownMenuItem onClick={() => handleDeleteAdmin(admin)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {admin.user_id === currentUserId ? "Cannot delete yourself" : "No permission to delete"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Create Admin Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>Add a new admin user to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  className="col-span-3"
                  placeholder="admin@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                  className="col-span-3"
                  placeholder="Strong password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={newAdminData.full_name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, full_name: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newAdminData.role}
                  onValueChange={(value) => setNewAdminData({ ...newAdminData, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUserRole === "super_admin" && (
                      <>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </>
                    )}
                    {currentUserRole === "admin" && <SelectItem value="moderator">Moderator</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateAdmin}>
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Admin Permissions</DialogTitle>
              <DialogDescription>Change the role and permissions for this admin user.</DialogDescription>
            </DialogHeader>
            {selectedAdmin && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="edit_full_name"
                    value={selectedAdmin.full_name || ""}
                    onChange={(e) => setSelectedAdmin({ ...selectedAdmin, full_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_role" className="text-right">
                    Role
                  </Label>
                  {canEditAdmin(selectedAdmin) ? (
                    <Select
                      value={selectedAdmin.role}
                      onValueChange={(value) => setSelectedAdmin({ ...selectedAdmin, role: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUserRole === "super_admin" && (
                          <>
                            <SelectItem value="super_admin">
                              <div className="flex flex-col">
                                <span>Super Admin</span>
                                <span className="text-xs text-muted-foreground">Can manage all users</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex flex-col">
                                <span>Admin</span>
                                <span className="text-xs text-muted-foreground">Can manage moderators</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex flex-col">
                                <span>Moderator</span>
                                <span className="text-xs text-muted-foreground">Read-only access</span>
                              </div>
                            </SelectItem>
                          </>
                        )}
                        {currentUserRole === "admin" && (
                          <SelectItem value="moderator">
                            <div className="flex flex-col">
                              <span>Moderator</span>
                              <span className="text-xs text-muted-foreground">Read-only access</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="col-span-3">
                      <Badge className={getRoleBadgeColor(selectedAdmin.role)}>
                        {selectedAdmin.role.replace("_", " ").toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        You don't have permission to change this role
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm text-muted-foreground">Email</Label>
                  <span className="col-span-3 text-sm text-muted-foreground">
                    {selectedAdmin.email} (cannot be changed)
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedAdmin && canEditAdmin(selectedAdmin) ? (
                <Button type="submit" onClick={handleUpdateAdmin}>
                  Save changes
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
