import { auth } from "../src/lib/auth";

async function main() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: "admin@admin.com",
        password: "admin123",
        name: "Admin"
      }
    });
    console.log("Admin user created successfully:", res);
  } catch (error) {
    console.error("Failed to create admin:", error);
  }
}

main();
