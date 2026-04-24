import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const email = "gabrielsanticosta@gmail.com";
const password = "WolfieTeacher2026!";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing environment variablesNEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Available envs:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Checking if user exists...");
  const { data: listUserResponse, error: listUserError } = await supabase.auth.admin.listUsers();
  
  let userId;
  
  if (listUserError) {
      console.error("Error listing users", listUserError);
  }
  
  const existingUser = listUserResponse?.users?.find(u => u.email === email);
  
  if (existingUser) {
      console.log("User already exists, updating password and profile...");
      const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true });
      if (error) {
          console.error("Failed to update user:", error);
          return;
      }
      userId = existingUser.id;
  } else {
      console.log("Creating new user...");
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    
      if (error) {
        console.error("Error creating user:", error);
        return;
      }
      userId = data.user.id;
  }

  console.log("User ID:", userId);

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, role: "teacher" });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    return;
  }

  console.log("User and profile created/updated successfully.");
  console.log("Email:", email);
  console.log("Password:", password);
}

main();
