import React, { useState } from 'react';

type DocTab = 'system' | 'firebase' | 'supabase';

const Documentation: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DocTab>('system');

    const TABS = [
        { id: 'system', label: 'System Documentation' },
        { id: 'firebase', label: 'Firebase Prompt' },
        { id: 'supabase', label: 'Supabase Prompt' },
    ];

    return (
        <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Developer Documentation</h2>
            <div className="border-b border-slate-700 mb-6">
                <nav className="flex space-x-2 -mb-px">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as DocTab)} className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-slate-900/70 prose-pre:p-4 prose-pre:rounded-md prose-pre:border prose-pre:border-slate-700 prose-code:font-mono">
                {activeTab === 'system' && (
                    <div className="animate-fade-in">
                        <h3>System Architecture: E-Biz Hub with Firebase Backend</h3>
                        <p>This application is a full-stack, real-time, and collaborative tender management system. It's built with a React frontend and leverages the Google Firebase platform for all backend services, ensuring scalability, security, and real-time data synchronization across all users and devices.</p>
                        
                        <h4>Core Technologies</h4>
                        <ul>
                            <li><strong>Frontend:</strong> React with TypeScript for a robust, type-safe user interface.</li>
                            <li><strong>Backend Platform:</strong> Google Firebase.</li>
                            <li><strong>Database:</strong> Cloud Firestore, a flexible, scalable NoSQL database for storing all application data in real-time.</li>
                            <li><strong>Authentication:</strong> Firebase Authentication for handling user sign-up, login, and session management securely.</li>
                            <li><strong>File Storage:</strong> Firebase Storage for managing all user-uploaded files, such as company logos and tender documents.</li>
                            <li><strong>Serverless Functions:</strong> Firebase Cloud Functions for executing secure, server-side logic, such as making calls to third-party AI APIs.</li>
                            <li><strong>Styling:</strong> Tailwind CSS for a modern, utility-first design system.</li>
                        </ul>

                        <h4>Key Architectural Concepts</h4>
                        <ul>
                          <li><strong>Real-time Collaboration:</strong> The application uses Cloud Firestore's real-time listeners (<code>onSnapshot</code>). When one user makes a change (e.g., updates a task status), the data is updated in Firestore, which then automatically pushes the change to all other subscribed users, ensuring everyone's view is instantly synchronized.</li>
                          <li><strong>Security by Default:</strong> User data is protected at multiple levels. Firebase Authentication ensures only valid users can access the app. Firestore Security Rules are implemented to ensure users can only read and write their own data, providing strong data isolation and privacy.</li>
                          <li><strong>Serverless Operations:</strong> The architecture is fully serverless, eliminating the need to manage servers. AI service calls, which require a secure API key, are handled by a Firebase Cloud Function. This function acts as a secure intermediary between the client and the AI provider, preventing the API key from ever being exposed on the frontend.</li>
                        </ul>
                        
                        <h4>Application Modules & Data Flow</h4>
                        <ol>
                            <li><strong>Authentication:</strong> A user signs in via Firebase Authentication. The application receives their unique UID.</li>
                            <li><strong>Data Fetching:</strong> The application's data layer (conceptually, the <code>useTenderStore</code>) uses this UID to query Firestore collections (e.g., <code>tenders</code>, <code>clients</code>). It sets up real-time listeners for documents where the <code>userId</code> field matches the logged-in user's UID.</li>
                            <li><strong>UI Rendering:</strong> The data streamed from Firestore populates the React components, rendering the user's specific workspace.</li>
                            <li><strong>User Actions:</strong> When a user performs an action, like adding a client or updating a tender's status, the application calls a function that executes a write operation (<code>addDoc</code>, <code>updateDoc</code>) on the appropriate Firestore collection.</li>
                            <li><strong>Real-time Sync:</strong> Firestore automatically propagates this change to all active listeners. The listener in the user's application receives the updated data, the local state is updated, and the UI re-renders to reflect the change seamlessly.</li>
                            <li><strong>File Handling:</strong> When a document is uploaded, it is first sent to a private, secure folder in Firebase Storage. Upon successful upload, the file's unique download URL is stored in the corresponding Firestore document (e.g., in a tender's <code>documents</code> array).</li>
                             <li><strong>AI Services:</strong> For a feature like "AI Summary," the frontend sends the tender URL to a Firebase Cloud Function. This function securely fetches the content and calls the Gemini API using an API key stored securely in Firebase's environment variables. The result is then returned to the client.</li>
                        </ol>

                        <h4>Firestore Collections Example</h4>
                        <ul>
                            {/* FIX: Escaped curly braces to prevent them from being interpreted as JSX expressions. */}
                            <li><code>/users/{'{'}userId{'}'}</code> - Stores user-specific profiles and roles.</li>
                            {/* FIX: Escaped curly braces to prevent them from being interpreted as JSX expressions. */}
                            <li><code>/tenders/{'{'}tenderId{'}'}</code> - Each document contains all data for a specific tender, including a <code>userId</code> field.</li>
                            {/* FIX: Escaped curly braces to prevent them from being interpreted as JSX expressions. */}
                            <li><code>/clients/{'{'}clientId{'}'}</code> - Stores client information, linked by <code>userId</code>.</li>
                            {/* FIX: Escaped curly braces to prevent them from being interpreted as JSX expressions. */}
                            <li><code>/vendors/{'{'}vendorId{'}'}</code> - Stores vendor information, linked by <code>userId</code>.</li>
                        </ul>
                    </div>
                )}
                 {activeTab === 'firebase' && (
                    <div className="animate-fade-in">
                        <h3>Vibe Coding Prompt: Rebuild with Firebase</h3>
                        <p>Use the following prompt with your preferred AI code assistant to guide the migration of this application to a Firebase backend.</p>
                        <pre><code>
{`You are a world-class full-stack engineer specializing in React and Firebase. Your task is to migrate the existing E-Biz Hub application from a localStorage-based frontend to a full-stack application using Firebase as the backend. The frontend will remain in React and TypeScript.

Here is the step-by-step plan:

**Step 1: Firebase Project Setup**
1.  Create a new Firebase project.
2.  Enable Firebase Authentication with the "Email/Password" provider.
3.  Enable the Firestore database.
4.  Generate and copy the web app configuration object.

**Step 2: Authentication**
1.  Create simple Login and Signup components.
2.  Use the Firebase Auth SDK (\`firebase/auth\`) to implement user registration and login functionality.
3.  Create an authentication context or hook (\`useAuth\`) to manage the current user's state throughout the app.
4.  Protect the main application routes so they are only accessible to logged-in users.
5.  Replace the \`currentUserId\` simulation in \`useTenderStore.ts\` with the actual UID from the authenticated user.

**Step 3: Firestore Database Schema**
Design a Firestore collection structure. A good approach would be a top-level collection for each major data type, with a \`userId\` field to associate documents with users.
- \`users\` (to store user profiles, roles)
- \`tenders\`
- \`clients\`
- \`vendors\`
- \`catalogItems\`
- \`tasks\`
- \`shipments\`
- etc.
Each document in these collections must have a \`userId\` field.

**Step 4: Refactor \`useTenderStore.ts\`**
This is the core task. Refactor the store to interact with Firestore instead of localStorage.
1.  Initialize the Firebase app and get Firestore instance.
2.  Replace \`useState\` hooks with Firestore's real-time listeners (\`onSnapshot\`). For each data slice (e.g., watchlist, clients), set up a query that listens for documents where \`userId\` matches the current user's UID.
3.  Rewrite all data modification functions (\`addToWatchlist\`, \`updateClient\`, etc.). Instead of updating local state, they must now perform CRUD operations (addDoc, updateDoc, deleteDoc) on the corresponding Firestore collections.
4.  Ensure all created documents include the \`userId\` of the currently logged-in user.

**Step 5: Firestore Security Rules**
Write comprehensive Firestore security rules (\`firestore.rules\`) to secure the data. The fundamental rule is that users can only read, write, and delete documents that have their own \`userId\`.
Example rule for the 'tenders' collection:
\`\`\`
match /tenders/{tenderId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}
\`\`\`
Apply similar rules to all other collections.

**Step 6: Cloud Functions for AI Services (Optional but Recommended)**
To avoid exposing the Gemini API key on the client, create a Firebase Cloud Function.
1.  The function will be an HTTP-triggered endpoint.
2.  The frontend will call this function, passing the necessary data (e.g., a tender URL to summarize).
3.  The Cloud Function will securely call the Gemini API from the backend and return the result to the client.
4.  Store the Gemini API key securely using Firebase's environment configuration.

Begin by setting up the Firebase project and implementing the authentication flow.`}
                        </code></pre>
                    </div>
                )}
                 {activeTab === 'supabase' && (
                    <div className="animate-fade-in">
                        <h3>Vibe Coding Prompt: Rebuild with Supabase</h3>
                        <p>Use the following prompt with your preferred AI code assistant to guide the migration of this application to a Supabase backend.</p>
                        <pre><code>
{`You are a world-class full-stack engineer specializing in React and PostgreSQL. Your task is to migrate the existing E-Biz Hub application from a localStorage-based frontend to a full-stack application using Supabase as the backend. The frontend will remain in React and TypeScript.

Here is the step-by-step plan:

**Step 1: Supabase Project Setup**
1.  Create a new Supabase project.
2.  Copy the Project URL and anon API key.

**Step 2: Database Schema Design**
Using the Supabase Table Editor or SQL, define your database schema.
1.  Create tables for \`profiles\` (to link with \`auth.users\`), \`tenders\`, \`clients\`, \`vendors\`, \`catalog_items\`, etc.
2.  Define columns with appropriate data types (e.g., text, timestamp with timezone, numeric, jsonb for flexible fields).
3.  Establish foreign key relationships. For instance, each table should have a \`user_id\` column that references \`auth.users(id)\`.

**Step 3: Authentication**
1.  Integrate the Supabase Auth UI components or build custom Login/Signup forms using the Supabase client library (\`@supabase/supabase-js\`).
2.  Create an authentication context or hook (\`useAuth\`) to manage user sessions.
3.  Protect application routes, allowing access only to authenticated users.

**Step 4: Row Level Security (RLS)**
This is a critical step for security in Supabase.
1.  Enable RLS on every table that contains user data.
2.  Create policies to control access. The most common policy will be to ensure users can only access their own data.
Example RLS policy for the 'tenders' table:
\`\`\`sql
CREATE POLICY "Users can access their own tenders."
ON public.tenders FOR ALL
USING (auth.uid() = user_id);
\`\`\`
3.  Apply similar policies for SELECT, INSERT, UPDATE, and DELETE on all relevant tables.

**Step 5: Refactor \`useTenderStore.ts\`**
Modify the store to use the Supabase client for all data operations.
1.  Initialize the Supabase client with your project URL and anon key.
2.  Replace \`useState\` with calls to fetch initial data using \`supabase.from('table').select()\`.
3.  Implement real-time updates by subscribing to table changes using \`supabase.channel(...).on(...).subscribe()\`. Update React state within the subscription callback.
4.  Rewrite all data modification functions (\`addClient\`, \`updateTenderStatus\`, etc.) to use the Supabase client methods: \`insert()\`, \`update()\`, and \`delete()\`. Ensure the \`user_id\` is included on all new records.

**Step 6: Supabase Storage for File Uploads**
For features like company logos and document uploads:
1.  Create a storage bucket in Supabase (e.g., 'documents').
2.  Implement file upload functionality in the frontend using \`supabase.storage.from('bucket').upload()\`.
3.  Write Storage RLS policies to control who can upload and access files.

**Step 7: Edge Functions for Secure AI Calls**
To protect your Gemini API key:
1.  Create a Supabase Edge Function (e.g., 'gemini-service').
2.  This function will receive requests from your frontend.
3.  Store the Gemini API key as a Supabase secret (\`supabase secrets set\`).
4.  The function will securely call the Gemini API from the server-side and stream the response back to the client.

Begin by setting up the Supabase project and designing the database schema.`}
                        </code></pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documentation;
