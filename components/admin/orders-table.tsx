"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/supabase/types"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Search, Edit, Eye, Package, Truck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    const supabase = createClient()
    const { error } = await supabase.from("orders").update(updates).eq("id", orderId)

    if (error) {
      console.error("Error updating order:", error)
    } else {
      fetchOrders()
      setIsEditDialogOpen(false)
      setSelectedOrder(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getShippingBadgeColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Manage customer orders and shipping</CardDescription>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.customer_name}</span>
                    <span className="text-sm text-muted-foreground">{order.customer_email}</span>
                  </div>
                </TableCell>
                <TableCell>{order.product_name}</TableCell>
                <TableCell>${order.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getShippingBadgeColor(order.shipping_status)}>{order.shipping_status}</Badge>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
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
                          setSelectedOrder(order)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit order
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Package className="mr-2 h-4 w-4" />
                        Mark as shipped
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Truck className="mr-2 h-4 w-4" />
                        Mark as delivered
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* View Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Complete information for order {selectedOrder?.id.slice(0, 8)}...</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Customer Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Product</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.product_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Amount</Label>
                      <p className="text-sm text-muted-foreground">${selectedOrder.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge className={getStatusBadgeColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Shipping Status</Label>
                      <Badge className={getShippingBadgeColor(selectedOrder.shipping_status)}>
                        {selectedOrder.shipping_status}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Billing Address</Label>
                      <div className="text-sm text-muted-foreground">
                        {selectedOrder.billing_address_line1 && (
                          <>
                            <p>{selectedOrder.billing_address_line1}</p>
                            {selectedOrder.billing_address_line2 && <p>{selectedOrder.billing_address_line2}</p>}
                            <p>
                              {selectedOrder.billing_city}, {selectedOrder.billing_state}{" "}
                              {selectedOrder.billing_postal_code}
                            </p>
                            <p>{selectedOrder.billing_country}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone || "Not provided"}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="shipping" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Shipping Address</Label>
                      <div className="text-sm text-muted-foreground">
                        {selectedOrder.shipping_address_line1 && (
                          <>
                            <p>{selectedOrder.shipping_address_line1}</p>
                            {selectedOrder.shipping_address_line2 && <p>{selectedOrder.shipping_address_line2}</p>}
                            <p>
                              {selectedOrder.shipping_city}, {selectedOrder.shipping_state}{" "}
                              {selectedOrder.shipping_postal_code}
                            </p>
                            <p>{selectedOrder.shipping_country}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tracking Number</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.tracking_number || "Not assigned"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Special Instructions</Label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.special_instructions || "None"}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Order</DialogTitle>
              <DialogDescription>Update order status and shipping information.</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    defaultValue={selectedOrder.status}
                    onValueChange={(value) => setSelectedOrder({ ...selectedOrder, status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shipping_status" className="text-right">
                    Shipping
                  </Label>
                  <Select
                    defaultValue={selectedOrder.shipping_status}
                    onValueChange={(value) => setSelectedOrder({ ...selectedOrder, shipping_status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tracking_number" className="text-right">
                    Tracking
                  </Label>
                  <Input
                    id="tracking_number"
                    defaultValue={selectedOrder.tracking_number || ""}
                    className="col-span-3"
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_number: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" onClick={() => selectedOrder && updateOrder(selectedOrder.id, selectedOrder)}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
