"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Eye, EyeOff, Filter, RefreshCw } from "lucide-react"

interface User {
  id: number
  username: string
  value: string
  op: string
  attribute: string
  created_at: string
  updated_at: string
}

interface Group {
  id: number
  groupname: string
  priority: number
  created_at: string
  updated_at: string
}

export default function SearchUsersReport() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState({
    type: "username",
    term: "",
    attributeFilter: ""
  })
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})

  // Fetch groups for attribute filter
  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/radius/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  // Search users
  const handleSearch = async () => {
    if (!searchCriteria.term.trim()) {
      setFilteredUsers([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: searchCriteria.type,
        term: searchCriteria.term,
        attribute: searchCriteria.attributeFilter
      })

      const response = await fetch(`/api/radius/users/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setFilteredUsers(data)
      } else {
        console.error("Failed to search users")
        setFilteredUsers([])
      }
    } catch (error) {
      console.error("Error searching users:", error)
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  // Clear search
  const clearSearch = () => {
    setSearchCriteria({
      type: "username",
      term: "",
      attributeFilter: ""
    })
    setFilteredUsers([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search for users using various criteria and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Search Type</label>
                <Select 
                  value={searchCriteria.type} 
                  onValueChange={(value) => setSearchCriteria({ ...searchCriteria, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="attribute">Attribute</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Search Term</label>
                <Input
                  placeholder="Enter search term..."
                  value={searchCriteria.term}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, term: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Attribute Filter</label>
                <Select 
                  value={searchCriteria.attributeFilter} 
                  onValueChange={(value) => setSearchCriteria({ ...searchCriteria, attributeFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All attributes" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group, index) => (
                      <SelectItem key={`${group.id}-${index}`} value={group.groupname}>
                        {group.groupname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading || !searchCriteria.term.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {filteredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Search Results
                </CardTitle>
                <CardDescription>
                  Found {filteredUsers.length} user(s) matching your criteria
                </CardDescription>
              </div>
              <Badge variant="outline">
                {filteredUsers.length} Results
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="font-mono text-sm">{user.attribute}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {user.attribute === "Cleartext-Password" && !showPasswords[user.id]
                            ? "••••••••••"
                            : user.value
                          }
                        </span>
                        {user.attribute === "Cleartext-Password" && (
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
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.op}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchCriteria.term && !loading && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">
                No users match your search criteria. Try adjusting your search terms.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
