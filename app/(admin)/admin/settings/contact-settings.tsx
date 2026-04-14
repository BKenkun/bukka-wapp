"use client"

import * as React from "react"
import { IconLoader2, IconMail } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface ContactSettingsData {
  recipientEmail: string
  subjectPrefix: string
  autoReply: boolean
  autoReplySubject: string
  autoReplyMessage: string
}

const DEFAULT_DATA: ContactSettingsData = {
  recipientEmail: "soporte@bukkakery.com",
  subjectPrefix: "[Contact]",
  autoReply: false,
  autoReplySubject: "We received your message",
  autoReplyMessage: "Thank you for contacting us. We will get back to you within 24-48 hours.",
}

export function ContactSettings() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [data, setData] = React.useState<ContactSettingsData>(DEFAULT_DATA)

  React.useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/contact")
      if (response.ok) {
        const result = await response.json()
        setData({ ...DEFAULT_DATA, ...result })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Error saving")
      toast.success("Contact settings saved")
    } catch {
      toast.error("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="size-5" />
            Contact Form Settings
          </CardTitle>
          <CardDescription>
            Configure the contact form behavior and email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={data.recipientEmail}
              onChange={(e) => setData({ ...data, recipientEmail: e.target.value })}
              placeholder="soporte@bukkakery.com"
            />
            <p className="text-xs text-muted-foreground">
              Contact form submissions will be sent to this email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectPrefix">Subject Prefix</Label>
            <Input
              id="subjectPrefix"
              value={data.subjectPrefix}
              onChange={(e) => setData({ ...data, subjectPrefix: e.target.value })}
              placeholder="[Contact]"
            />
            <p className="text-xs text-muted-foreground">
              Added before the subject in notification emails (e.g. [Contact] Question about...)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Reply</CardTitle>
          <CardDescription>
            Optionally send an automatic reply when someone submits the contact form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Reply</Label>
              <p className="text-sm text-muted-foreground">
                Send an automatic confirmation email to the sender
              </p>
            </div>
            <Switch
              checked={data.autoReply}
              onCheckedChange={(checked) => setData({ ...data, autoReply: checked })}
            />
          </div>

          {data.autoReply && (
            <>
              <div className="space-y-2">
                <Label htmlFor="autoReplySubject">Auto-Reply Subject</Label>
                <Input
                  id="autoReplySubject"
                  value={data.autoReplySubject}
                  onChange={(e) => setData({ ...data, autoReplySubject: e.target.value })}
                  placeholder="We received your message"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoReplyMessage">Auto-Reply Message</Label>
                <Textarea
                  id="autoReplyMessage"
                  value={data.autoReplyMessage}
                  onChange={(e) => setData({ ...data, autoReplyMessage: e.target.value })}
                  placeholder="Thank you for contacting us..."
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
