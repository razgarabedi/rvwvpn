"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Eye, EyeOff, Edit, Trash2 } from "lucide-react"

interface RadUser {
  id: number
  username: string
  attribute: string
  op: string
  value: string
}

interface SearchCriteria {
  searchType: "username" | "attribute" | "value" | "all"
  searchTerm: string
  attributeFilter: string
  groupFilter: string
}

export default function UserSearch() {
  const [users, setUsers] = useState<RadUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<RadUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    searchType: "all",
    searchTerm: "",
    attributeFilter: "",
    groupFilter: ""
  })

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/radius/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Search and filter users
  const handleSearch = () => {
    setSearching(true)
    
    let results = [...users]

    // Filter by search term
    if (searchCriteria.searchTerm) {
      const term = searchCriteria.searchTerm.toLowerCase()
      results = results.filter(user => {
        switch (searchCriteria.searchType) {
          case "username":
            return user.username.toLowerCase().includes(term)
          case "attribute":
            return user.attribute.toLowerCase().includes(term)
          case "value":
            return user.value.toLowerCase().includes(term)
          case "all":
          default:
            return (
              user.username.toLowerCase().includes(term) ||
              user.attribute.toLowerCase().includes(term) ||
              user.value.toLowerCase().includes(term)
            )
        }
      })
    }

    // Filter by attribute
    if (searchCriteria.attributeFilter && searchCriteria.attributeFilter.trim() !== "") {
      results = results.filter(user => 
        user.attribute.toLowerCase().includes(searchCriteria.attributeFilter.toLowerCase())
      )
    }

    setFilteredUsers(results)
    setSearching(false)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchCriteria({
      searchType: "all",
      searchTerm: "",
      attributeFilter: "",
      groupFilter: ""
    })
    setFilteredUsers(users)
  }

  // Toggle password visibility
  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  // Get unique attributes for filter dropdown
  const uniqueAttributes = Array.from(new Set(users.map(user => user.attribute)))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Users
              </CardTitle>
              <CardDescription>
                Easily find users using various search criteria
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="searchType">Search Type</Label>
                <Select 
                  value={searchCriteria.searchType} 
                  onValueChange={(value: "username" | "attribute" | "value" | "all") => setSearchCriteria({ ...searchCriteria, searchType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="attribute">Attribute</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="searchTerm">Search Term</Label>
                <Input
                  id="searchTerm"
                  placeholder="Enter search term..."
                  value={searchCriteria.searchTerm}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, searchTerm: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div>
                <Label htmlFor="attributeFilter">Filter by Attribute</Label>
                <div className="flex gap-2">
                  <Select 
                    value={searchCriteria.attributeFilter} 
                    onValueChange={(value) => setSearchCriteria({ ...searchCriteria, attributeFilter: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="All attributes" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAttributes.map((attr) => (
                        <SelectItem key={attr} value={attr}>
                          {attr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {searchCriteria.attributeFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchCriteria({ ...searchCriteria, attributeFilter: "" })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={searching} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? "Searching..." : "Search"}
                </Button>
                <Button onClick={handleClearSearch} variant="outline">
                  Clear
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchCriteria.searchTerm || searchCriteria.attributeFilter 
                  ? "No users found matching your search criteria." 
                  : "No users found. Try adjusting your search criteria."
                }
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Search Results</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="h-4 w-4" />
                    Showing {filteredUsers.length} results
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Attribute</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.attribute}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>
                              {showPasswords[user.id] 
                                ? user.value 
                                : "••••••••••"
                              }
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => togglePasswordVisibility(user.id)}
                            >
                              {showPasswords[user.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Handle edit */}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Handle delete */}}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
