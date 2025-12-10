import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with Service Role Key for Admin actions
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = serviceRoleKey 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

export async function GET(request) {
  if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Service Key not configured' }, { status: 500 })
  }
  
  // Check authentication of the requester (optional but recommended)
  // For now, assuming middleware protects /dashboard routes or relying on valid session check if passed
  
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  try {
    const { email, password, role } = await request.json()

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw authError

    // 2. Add to user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{ 
        user_id: authData.user.id, 
        email, 
        role 
      }])

    if (roleError) {
      // Rollback: Delete the user if role creation fails (cleanup)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw roleError
    }

    return NextResponse.json({ success: true, user: authData.user })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request) {
    try {
        const { id, password, role, email } = await request.json()
        
        // Update Password if provided
        if (password) {
            const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                { password }
            )
            if (passError) throw passError
        }

        // Update Role if provided
        if (role) {
            const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .update({ role })
                .eq('user_id', id)
            
            if (roleError) throw roleError
        }
        
         // Update Email if provided (complex, skips for now as it requires re-confirm)
         
        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) throw new Error('Missing ID')

        // Delete from Auth (Cascade should handle table, but let's be sure or rely on FK cascade)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (error) throw error
        
        // Manually delete from table if ON DELETE CASCADE isn't set (we set it in SQL but good to be safe or just rely on cascade)
        // With Cascade in SQL, we don't need to manually delete from user_roles.

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
