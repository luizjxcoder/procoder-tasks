import { useState, useEffect } from "react"
import { useAuth } from "./useAuth"
import { supabase } from "@/integrations/supabase/client"

export type AppRole = "admin" | "user"

export const useRoles = () => {
  const { user } = useAuth()
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setRoles([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

        if (error) throw error

        setRoles(data?.map((item) => item.role as AppRole) || [])
      } catch (error) {
        console.error("Error fetching user roles:", error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user])

  const isAdmin = roles.includes("admin")
  const hasRole = (role: AppRole) => roles.includes(role)

  return {
    roles,
    loading,
    isAdmin,
    hasRole,
  }
}