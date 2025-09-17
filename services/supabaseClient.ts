import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnkdemdctgekgakpcvtc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdua2RlbWRjdGdla2dha3BjdnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDM2MjksImV4cCI6MjA3MjU3OTYyOX0.uMkS6pP2KtuKQ1A0hWRo6nvpn0xcD5rNyt-rW8xirsI';

if (!supabaseUrl || !supabaseAnonKey) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: white; background-color: #0f172a; height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: bold;">Supabase Configuration Missing</h1>
          <p style="margin-top: 1rem; color: #94a3b8;">Please provide Supabase credentials to connect to the backend.</p>
        </div>
      </div>
    `;
  }
  throw new Error("Supabase URL and Anon Key are not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);