"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Users } from "lucide-react"

interface RadGroupCheck {
  id: number
  groupname: string
  attribute: string
  op: string
  value: string
}

interface RadGroupReply {
  id: number
  groupname: string
  attribute: string
  op: string
  value: string
}

interface RadGroup {
  name: string
  checks: RadGroupCheck[]
  replies: RadGroupReply[]
}

export default function GroupsManagement() {
  const [groups, setGroups] = useState<RadGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<RadGroup | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    checks: [{ attribute: "", op: ":=", value: "" }],
    replies: [{ attribute: "", op: ":=", value: "" }]
  })

  // Load groups
  const loadGroups = async () => {
    try {
      const response = await fetch("/api/radius/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  // Create or update group
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/radius/groups", {
        method: editingGroup ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadGroups()
        resetForm()
        setIsDialogOpen(false)
      } else {
        let errorMessage = 'Unknown error occurred';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        } else {
          console.error('Response is not JSON:', response);
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving group:", error)
      alert("Failed to save group")
    }
  }

  // Delete group
  const handleDelete = async (groupName: string) => {
    if (!confirm(`Are you sure you want to delete group "${groupName}"?`)) return

    try {
      const response = await fetch("/api/radius/groups", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName }),
      })

      if (response.ok) {
        await loadGroups()
      } else {
        let errorMessage = 'Unknown error occurred';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        } else {
          console.error('Response is not JSON:', response);
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting group:", error)
      alert("Failed to delete group")
    }
  }

  // Edit group
  const handleEdit = (group: RadGroup) => {
    setEditingGroup(group)

    const mappedChecks = (group.checks || []).map(c => ({
      ...c,
      attribute: c.attribute ?? "",
      value: c.value ?? ""
    }))

    const mappedReplies = (group.replies || []).map(r => ({
      ...r,
      attribute: r.attribute ?? "",
      value: r.value ?? ""
    }))

    setFormData({
      name: group.name,
      checks: mappedChecks.length > 0 ? mappedChecks : [{ attribute: "", op: ":=", value: "" }],
      replies: mappedReplies.length > 0 ? mappedReplies : [{ attribute: "", op: ":=", value: "" }]
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      checks: [{ attribute: "", op: ":=", value: "" }],
      replies: [{ attribute: "", op: ":=", value: "" }]
    })
    setEditingGroup(null)
  }

  // Add check attribute
  const addCheckAttribute = () => {
    setFormData({
      ...formData,
      checks: [...formData.checks, { attribute: "", op: ":=", value: "" }]
    })
  }

  // Remove check attribute
  const removeCheckAttribute = (index: number) => {
    setFormData({
      ...formData,
      checks: formData.checks.filter((_, i) => i !== index)
    })
  }

  // Add reply attribute
  const addReplyAttribute = () => {
    setFormData({
      ...formData,
      replies: [...formData.replies, { attribute: "", op: ":=", value: "" }]
    })
  }

  // Remove reply attribute
  const removeReplyAttribute = (index: number) => {
    setFormData({
      ...formData,
      replies: formData.replies.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading groups...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Groups Management</h2>
          <p className="text-gray-600">Manage FreeRADIUS groups and their attributes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create New Group"}
              </DialogTitle>
              <DialogDescription>
                Configure group attributes for FreeRADIUS authentication
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Group Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>

              {/* Check Attributes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Check Attributes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addCheckAttribute}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Check
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.checks.map((check, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Attribute"
                        value={check.attribute}
                        onChange={(e) => {
                          const newChecks = [...formData.checks]
                          newChecks[index].attribute = e.target.value
                          setFormData({ ...formData, checks: newChecks })
                        }}
                        className="col-span-4"
                      />
                      <select
                        value={check.op}
                        onChange={(e) => {
                          const newChecks = [...formData.checks]
                          newChecks[index].op = e.target.value
                          setFormData({ ...formData, checks: newChecks })
                        }}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value=":=">:=</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">=">{">="}</option>
                        <option value="<=">{"<="}</option>
                        <option value=">">{">"}</option>
                        <option value="<">{"<"}</option>
                        <option value="=~">=~</option>
                        <option value="!~">!~</option>
                      </select>
                      <Input
                        placeholder="Value"
                        value={check.value}
                        onChange={(e) => {
                          const newChecks = [...formData.checks]
                          newChecks[index].value = e.target.value
                          setFormData({ ...formData, checks: newChecks })
                        }}
                        className="col-span-5"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCheckAttribute(index)}
                        className="col-span-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Attributes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Reply Attributes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addReplyAttribute}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reply
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.replies.map((reply, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Attribute"
                        value={reply.attribute}
                        onChange={(e) => {
                          const newReplies = [...formData.replies]
                          newReplies[index].attribute = e.target.value
                          setFormData({ ...formData, replies: newReplies })
                        }}
                        className="col-span-4"
                      />
                      <select
                        value={reply.op}
                        onChange={(e) => {
                          const newReplies = [...formData.replies]
                          newReplies[index].op = e.target.value
                          setFormData({ ...formData, replies: newReplies })
                        }}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value=":=">:=</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">=">{">="}</option>
                        <option value="<=">{"<="}</option>
                        <option value=">">{">"}</option>
                        <option value="<">{"<"}</option>
                        <option value="=~">=~</option>
                        <option value="!~">!~</option>
                      </select>
                      <Input
                        placeholder="Value"
                        value={reply.value}
                        onChange={(e) => {
                          const newReplies = [...formData.replies]
                          newReplies[index].value = e.target.value
                          setFormData({ ...formData, replies: newReplies })
                        }}
                        className="col-span-5"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReplyAttribute(index)}
                        className="col-span-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGroup ? "Update Group" : "Create Group"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups ({groups.length})
          </CardTitle>
          <CardDescription>
            FreeRADIUS groups with their check and reply attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No groups found. Create your first group to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(group.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Check Attributes:</h4>
                      {group.checks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No check attributes</p>
                      ) : (
                        <ul className="text-sm text-gray-500 space-y-1">
                          {group.checks.map((check, i) => (
                            <li key={i} className="font-mono">
                              {check.attribute} {check.op} {check.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Reply Attributes:</h4>
                      {group.replies.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No reply attributes</p>
                      ) : (
                        <ul className="text-sm text-gray-500 space-y-1">
                          {group.replies.map((reply, i) => (
                            <li key={i} className="font-mono">
                              {reply.attribute} {reply.op} {reply.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
