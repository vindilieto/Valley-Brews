import { neon } from "@neondatabase/serverless";

// Connection to the Neon database. The address comes from an environment
// variable, so it never appears in the code.
export const sql = neon(process.env.DATABASE_URL);
